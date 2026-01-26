# Azure Setup Guide for Studojo v2

This guide walks you through setting up Azure resources and deploying Studojo v2 to Azure Kubernetes Service (AKS).

## Prerequisites

1. **Azure CLI** installed and logged in:
   ```bash
   az login
   az account set --subscription <your-subscription-id>
   ```

2. **kubectl** installed

3. **Docker** installed (for building images locally, or use ACR build)

## Step 1: Create Resource Group

```bash
az group create --name studojo-rg --location eastus
```

## Step 2: Create Azure Container Registry (ACR)

```bash
az acr create --resource-group studojo-rg --name acrstudojo --sku Basic
az acr login --name acrstudojo
```

## Step 3: Build and Push Docker Images

Build and push all your service images to ACR:

```bash
# Control Plane
az acr build --registry acrstudojo --image control-plane:latest ./services/control-plane

# Frontend
az acr build --registry acrstudojo --image frontend:latest ./frontend

# Resume Service
az acr build --registry acrstudojo --image resume-service:latest ./services/resume-svc

# Assignment Gen Worker
az acr build --registry acrstudojo --image assignment-gen-worker:latest ./services/assignment-gen-worker

# Resume Worker
az acr build --registry acrstudojo --image resume-worker:latest ./services/resume-worker
```

Or build locally and push:

```bash
# Tag and push
docker build -t acrstudojo.azurecr.io/control-plane:latest ./services/control-plane
docker push acrstudojo.azurecr.io/control-plane:latest

# Repeat for other services...
```

## Step 4: Create Azure Database for PostgreSQL

```bash
az postgres flexible-server create \
  --resource-group studojo-rg \
  --name psql-studojo-prod \
  --admin-user studojo \
  --admin-password <YOUR_SECURE_PASSWORD> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32 \
  --location eastus

# Enable pgvector extension
az postgres flexible-server db create \
  --resource-group studojo-rg \
  --server-name psql-studojo-prod \
  --database-name postgres

# Connect and enable extension
psql -h psql-studojo-prod.postgres.database.azure.com -U studojo -d postgres
# Then run: CREATE EXTENSION IF NOT EXISTS vector;
```

**Get connection string:**
```bash
echo "postgresql://studojo:<PASSWORD>@psql-studojo-prod.postgres.database.azure.com:5432/postgres?sslmode=require"
```

## Step 5: Create Azure Blob Storage

```bash
# Create storage account
az storage account create \
  --resource-group studojo-rg \
  --name studojostorage \
  --sku Standard_LRS \
  --location eastus

# Create containers
az storage container create \
  --account-name studojostorage \
  --name assignments \
  --auth-mode login

az storage container create \
  --account-name studojostorage \
  --name resumes \
  --auth-mode login

# Get access key
az storage account keys list \
  --resource-group studojo-rg \
  --account-name studojostorage \
  --query "[0].value" -o tsv
```

## Step 6: Create Azure Kubernetes Service (AKS)

```bash
az aks create \
  --resource-group studojo-rg \
  --name studojo-aks \
  --node-count 3 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --attach-acr acrstudojo \
  --location eastus

# Get credentials
az aks get-credentials --resource-group studojo-rg --name studojo-aks
```

## Step 7: Configure Firewall Rules

Allow AKS to access PostgreSQL:

```bash
# Get AKS outbound IPs (you may need to check your AKS cluster's outbound IPs)
# Or allow Azure services
az postgres flexible-server firewall-rule create \
  --resource-group studojo-rg \
  --name psql-studojo-prod \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## Step 8: Configure Secrets

1. Copy the secrets template:
   ```bash
   cp k8s/secrets/secrets-template.yaml k8s/secrets/secrets.yaml
   ```

2. Edit `k8s/secrets/secrets.yaml` and fill in:
   - Database URL (from Step 4)
   - Azure Storage account name and key (from Step 5)
   - API keys (OpenAI, Anthropic, Rephrasy, etc.)
   - Razorpay credentials
   - Frontend secrets (Better Auth, Google OAuth, Twilio)

3. **IMPORTANT**: Never commit `secrets/secrets.yaml` to git (it's in .gitignore)

## Step 9: Update ConfigMaps

Edit `k8s/configmaps/configmaps.yaml`:
- Update `CORS_ORIGINS` with your actual domain
- Update `BETTER_AUTH_URL` with your frontend URL

## Step 10: Deploy to Kubernetes

```bash
cd k8s
./deploy.sh
```

Or deploy manually:

```bash
# Create namespace
kubectl apply -f namespace.yaml

# Apply secrets
kubectl apply -f secrets/secrets.yaml

# Apply configmaps
kubectl apply -f configmaps/

# Create ACR pull secret
kubectl create secret docker-registry acr-secret \
  --docker-server=acrstudojo.azurecr.io \
  --docker-username=acrstudojo \
  --docker-password=$(az acr credential show --name acrstudojo --query "passwords[0].value" -o tsv) \
  --namespace=studojo

# Run DB migration
kubectl apply -f frontend/job-db-push.yaml
kubectl wait --for=condition=complete job/frontend-db-push -n studojo --timeout=300s

# Deploy services
kubectl apply -f control-plane/
kubectl apply -f frontend/
kubectl apply -f resume-service/
kubectl apply -f assignment-gen-worker/
kubectl apply -f resume-worker/

# Configure ingress
kubectl apply -f ingress/
```

## Step 11: Set Up Ingress

### Option A: NGINX Ingress Controller

```bash
# Install NGINX Ingress
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Wait for it to be ready
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

# Get external IP
kubectl get service ingress-nginx-controller --namespace=ingress-nginx
```

### Option B: Azure Application Gateway Ingress Controller (AGIC)

```bash
# Install AGIC
helm repo add application-gateway-kubernetes-ingress https://appgwingress.blob.core.windows.net/ingress-azure-helm-charts/
helm install ingress-azure application-gateway-kubernetes-ingress/ingress-azure \
  --set appgw.subscriptionId=<subscription-id> \
  --set appgw.resourceGroup=<resource-group> \
  --set appgw.name=<application-gateway-name> \
  --set armAuth.type=aadPodIdentity \
  --set armAuth.identityResourceID=<identity-resource-id> \
  --set armAuth.identityClientID=<identity-client-id> \
  --set rbac.enabled=true \
  --namespace ingress-azure
```

## Step 12: Configure DNS

Point your domain to the Ingress external IP:
- `studojo.com` → Frontend
- `api.studojo.com` → Control Plane API

## Step 13: Set Up TLS/SSL

### Using cert-manager with Let's Encrypt:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@example.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

Then update `ingress/ingress.yaml` to use the ClusterIssuer annotation.

## Step 14: Verify Deployment

```bash
# Check pods
kubectl get pods -n studojo

# Check services
kubectl get svc -n studojo

# Check ingress
kubectl get ingress -n studojo

# View logs
kubectl logs -n studojo -l app=control-plane
kubectl logs -n studojo -l app=frontend
```

## Optional: Azure Service Bus (Alternative to RabbitMQ)

If you want to use Azure Service Bus instead of in-cluster RabbitMQ:

```bash
# Create Service Bus namespace
az servicebus namespace create \
  --resource-group studojo-rg \
  --name studojo-sb \
  --location eastus \
  --sku Basic

# Create queues
az servicebus queue create \
  --resource-group studojo-rg \
  --namespace-name studojo-sb \
  --name assignment-gen-jobs

az servicebus queue create \
  --resource-group studojo-rg \
  --namespace-name studojo-sb \
  --name resume-jobs

# Get connection string
az servicebus namespace authorization-rule keys list \
  --resource-group studojo-rg \
  --namespace-name studojo-sb \
  --name RootManageSharedAccessKey \
  --query primaryConnectionString -o tsv
```

Then update your application code to use Azure Service Bus SDK and update the `rabbitmq-url` secret.

## Cost Optimization Tips

1. **Use Azure Database for PostgreSQL** - More cost-effective than running PostgreSQL in AKS
2. **Use Azure Service Bus** - Managed service, no maintenance
3. **Right-size your AKS nodes** - Start with smaller VMs, scale as needed
4. **Enable cluster autoscaling**:
   ```bash
   az aks update \
     --resource-group studojo-rg \
     --name studojo-aks \
     --enable-cluster-autoscaler \
     --min-count 1 \
     --max-count 5
   ```
5. **Use Azure Spot VMs** for non-critical workloads (workers)

## Monitoring and Logging

Set up Azure Monitor for Containers:

```bash
az aks enable-addons \
  --resource-group studojo-rg \
  --name studojo-aks \
  --addons monitoring
```

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions, Azure DevOps)
2. Configure backup for PostgreSQL
3. Set up alerts and monitoring
4. Implement horizontal pod autoscaling (HPA)
5. Set up network policies for security
6. Configure Azure Key Vault for secrets management

## Troubleshooting

### Pods not starting
```bash
kubectl describe pod <pod-name> -n studojo
kubectl logs <pod-name> -n studojo
```

### Can't pull images from ACR
```bash
# Verify ACR secret exists
kubectl get secret acr-secret -n studojo

# Check ACR credentials
az acr credential show --name acrstudojo
```

### Database connection issues
```bash
# Test connection from a pod
kubectl run -it --rm debug --image=postgres:16 --restart=Never -- psql -h psql-studojo-prod.postgres.database.azure.com -U studojo -d postgres
```

### Ingress not working
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx
kubectl logs -n ingress-nginx -l app.kubernetes.io/component=controller

# Check ingress resource
kubectl describe ingress studojo-ingress -n studojo
```
