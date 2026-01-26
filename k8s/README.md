# Studojo v2 Kubernetes Manifests

This directory contains Kubernetes manifests for deploying Studojo v2 to Azure Kubernetes Service (AKS).

## Directory Structure

```
k8s/
├── README.md                    # This file
├── namespace.yaml               # Namespace definition
├── configmaps/
│   └── configmaps.yaml         # Non-sensitive configuration
├── secrets/
│   └── secrets-template.yaml    # Secret template (fill in values)
├── postgresql/
│   └── postgresql.yaml         # PostgreSQL StatefulSet (dev only)
├── rabbitmq/
│   └── rabbitmq.yaml           # RabbitMQ StatefulSet (dev only)
├── control-plane/
│   └── deployment.yaml         # Control Plane API
├── frontend/
│   ├── job-db-push.yaml        # Database migration job
│   └── deployment.yaml         # Frontend application
├── resume-service/
│   └── deployment.yaml         # Resume service
├── assignment-gen-worker/
│   └── deployment.yaml         # Assignment generation worker
├── resume-worker/
│   └── deployment.yaml         # Resume worker
└── ingress/
    └── ingress.yaml            # Ingress configuration
```

## Prerequisites

1. **Azure Resources** (create these first):
   - Azure Kubernetes Service (AKS) cluster
   - Azure Container Registry (ACR)
   - Azure Database for PostgreSQL (for production) OR use in-cluster PostgreSQL (dev)
   - Azure Blob Storage account with containers: `assignments` and `resumes`
   - Azure Service Bus (optional, for production) OR use in-cluster RabbitMQ (dev)

2. **kubectl** configured to connect to your AKS cluster:
   ```bash
   az aks get-credentials --resource-group studojo-rg --name studojo-aks
   ```

3. **Docker images** built and pushed to ACR:
   ```bash
   # Build and push images
   az acr build --registry acrstudojo --image control-plane:latest ./services/control-plane
   az acr build --registry acrstudojo --image frontend:latest ./frontend
   az acr build --registry acrstudojo --image resume-service:latest ./services/resume-svc
   az acr build --registry acrstudojo --image assignment-gen-worker:latest ./services/assignment-gen-worker
   az acr build --registry acrstudojo --image resume-worker:latest ./services/resume-worker
   ```

## Deployment Steps

### 1. Create Namespace

```bash
kubectl apply -f namespace.yaml
```

### 2. Configure Secrets

**IMPORTANT**: Edit `secrets/secrets-template.yaml` and replace all placeholder values with actual secrets. Then rename it or create a new file:

```bash
# Edit the template and fill in real values
cp secrets/secrets-template.yaml secrets/secrets.yaml
# Edit secrets/secrets.yaml with your actual values
kubectl apply -f secrets/secrets.yaml
```

**For Production**: Use Azure Key Vault with CSI driver instead of plain Kubernetes secrets.

### 3. Create ACR Pull Secret

```bash
kubectl create secret docker-registry acr-secret \
  --docker-server=acrstudojo.azurecr.io \
  --docker-username=acrstudojo \
  --docker-password=$(az acr credential show --name acrstudojo --query "passwords[0].value" -o tsv) \
  --namespace=studojo
```

### 4. Apply ConfigMaps

```bash
kubectl apply -f configmaps/
```

### 5. Deploy Infrastructure Services

**Option A: Use Azure Managed Services (Recommended for Production)**
- Use Azure Database for PostgreSQL (update `database-url` in secrets)
- Use Azure Service Bus (update `rabbitmq-url` in secrets)
- Skip PostgreSQL and RabbitMQ deployments

**Option B: Deploy In-Cluster (Development/Testing)**
```bash
kubectl apply -f postgresql/
kubectl apply -f rabbitmq/configmap.yaml  # RabbitMQ configuration (disables guest user)
kubectl apply -f rabbitmq/
```

Wait for them to be ready:
```bash
kubectl wait --for=condition=ready pod -l app=postgres -n studojo --timeout=300s
kubectl wait --for=condition=ready pod -l app=rabbitmq -n studojo --timeout=300s
```

### 6. Run Database Migration Job

```bash
kubectl apply -f frontend/job-db-push.yaml
kubectl wait --for=condition=complete job/frontend-db-push -n studojo --timeout=300s
```

### 7. Deploy Application Services

```bash
kubectl apply -f control-plane/
kubectl apply -f frontend/
kubectl apply -f resume-service/
```

### 8. Deploy Workers

```bash
kubectl apply -f assignment-gen-worker/
kubectl apply -f resume-worker/
```

### 9. Configure Ingress

Update `ingress/ingress.yaml` with your actual domain names, then:

```bash
kubectl apply -f ingress/
```

## Quick Deploy Script

You can deploy everything in order with:

```bash
#!/bin/bash
set -e

echo "Creating namespace..."
kubectl apply -f namespace.yaml

echo "Applying secrets..."
kubectl apply -f secrets/secrets.yaml  # Make sure this file exists with real values

echo "Applying configmaps..."
kubectl apply -f configmaps/

echo "Deploying infrastructure (if using in-cluster)..."
# kubectl apply -f postgresql/
# kubectl apply -f rabbitmq/

echo "Running DB migration..."
kubectl apply -f frontend/job-db-push.yaml
kubectl wait --for=condition=complete job/frontend-db-push -n studojo --timeout=300s

echo "Deploying application services..."
kubectl apply -f control-plane/
kubectl apply -f frontend/
kubectl apply -f resume-service/

echo "Deploying workers..."
kubectl apply -f assignment-gen-worker/
kubectl apply -f resume-worker/

echo "Configuring ingress..."
kubectl apply -f ingress/

echo "Deployment complete!"
```

## Verification

Check all pods are running:

```bash
kubectl get pods -n studojo
```

Check services:

```bash
kubectl get svc -n studojo
```

Check ingress:

```bash
kubectl get ingress -n studojo
```

## Updating Deployments

To update a deployment with a new image:

```bash
# Update image
kubectl set image deployment/control-plane control-plane=acrstudojo.azurecr.io/control-plane:v2.0.0 -n studojo

# Watch rollout
kubectl rollout status deployment/control-plane -n studojo

# Rollback if needed
kubectl rollout undo deployment/control-plane -n studojo
```

## Troubleshooting

### Pods not starting
```bash
# Check pod logs
kubectl logs -n studojo <pod-name>

# Check pod events
kubectl describe pod -n studojo <pod-name>
```

### Services not connecting
- Verify DNS names: `<service-name>.studojo.svc.cluster.local`
- Check service endpoints: `kubectl get endpoints -n studojo`
- Verify secrets/configmaps are applied correctly

### Database connection issues
- Verify PostgreSQL is accessible (if in-cluster)
- Check firewall rules (if Azure Database)
- Verify connection string in secrets

## Production Considerations

1. **Use Azure Managed Services**:
   - Azure Database for PostgreSQL (instead of in-cluster)
   - Azure Service Bus (instead of in-cluster RabbitMQ)
   - Azure Key Vault (for secrets)

2. **Security**:
   - Enable network policies
   - Use Azure Key Vault CSI driver for secrets
   - Enable pod security standards
   - Use managed identities where possible

3. **Monitoring**:
   - Set up Azure Monitor for Containers
   - Configure log aggregation
   - Set up alerts

4. **Scaling**:
   - Configure Horizontal Pod Autoscaling (HPA)
   - Set appropriate resource requests/limits
   - Consider cluster autoscaling

5. **Backup**:
   - Set up database backups
   - Configure persistent volume backups

## Additional Resources

- See `guide.md` for detailed translation guide and learning resources
- [Azure Kubernetes Service Documentation](https://learn.microsoft.com/en-us/azure/aks/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
