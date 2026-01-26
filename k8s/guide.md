# Studojo v2: Docker Compose to Kubernetes on Azure - Complete Guide

This guide walks you through translating your `docker-compose.yml` to Kubernetes manifests and deploying to Azure Kubernetes Service (AKS). It's tailored specifically to your studojo-v2 architecture.

## Table of Contents

1. [Understanding the Translation](#understanding-the-translation)
2. [Service-by-Service Translation](#service-by-service-translation)
3. [Azure Services Integration](#azure-services-integration)
4. [Networking and Service Discovery](#networking-and-service-discovery)
5. [Configuration Management](#configuration-management)
6. [Storage and Volumes](#storage-and-volumes)
7. [Dependencies and Init Containers](#dependencies-and-init-containers)
8. [Health Checks and Probes](#health-checks-and-probes)
9. [Deployment Strategy](#deployment-strategy)
10. [Step-by-Step Learning Path](#step-by-step-learning-path)

---

## Understanding the Translation

### Core Concepts Mapping

| Docker Compose | Kubernetes Equivalent | Purpose |
|----------------|----------------------|---------|
| `services` | `Deployment` + `Service` | Container orchestration |
| `ports` | `Service` (ClusterIP/NodePort/LoadBalancer) | Network exposure |
| `environment` | `ConfigMap` + `Secret` | Configuration |
| `volumes` | `PersistentVolume` + `PersistentVolumeClaim` | Persistent storage |
| `depends_on` | `initContainers` + `readinessProbe` | Dependency management |
| `healthcheck` | `livenessProbe` + `readinessProbe` | Health monitoring |
| `build` | Container Registry (ACR) + Image Pull | Image management |
| `networks` | Kubernetes DNS (automatic) | Service discovery |

### Your Architecture Overview

Your stack consists of:
- **Stateful Services**: PostgreSQL, RabbitMQ (with persistent data)
- **Stateless Services**: Control Plane, Frontend, Resume Service
- **Workers**: Assignment Gen Worker, Resume Worker (consume from RabbitMQ)
- **Init Jobs**: Frontend DB Push (one-time migration)
- **Storage Emulation**: LocalStack (replaced by Azure Blob Storage in production)

---

## Service-by-Service Translation

### 1. PostgreSQL (`postgres`)

**Docker Compose:**
```yaml
postgres:
  image: pgvector/pgvector:pg16
  ports: ["5432:5432"]
  volumes:
    - postgres_data:/data
    - ./docker/postgres/init.sql:/docker-entrypoint-initdb.d/01-pgvector.sql
  environment:
    POSTGRES_USER: studojo
    POSTGRES_PASSWORD: studojo
    POSTGRES_DB: postgres
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U studojo -d postgres"]
```

**Kubernetes Translation Options:**

**Option A: Azure Database for PostgreSQL (Recommended for Production)**
- Managed service, no Kubernetes manifests needed
- Connection string becomes: `postgresql://studojo:PASSWORD@psql-studojo-prod.postgres.database.azure.com:5432/postgres?sslmode=require`
- Store connection string in Secret: `app-secrets.database-url`
- **Learning Resources:**
  - [Azure Database for PostgreSQL Docs](https://learn.microsoft.com/en-us/azure/postgresql/)
  - [Connecting AKS to Azure Database](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-connect-kubernetes)

**Option B: In-Cluster PostgreSQL (for Development)**
- Use `StatefulSet` (not Deployment) for stateful workloads
- `PersistentVolumeClaim` for `postgres_data` volume
- `ConfigMap` for init script
- `Service` (ClusterIP) for internal access
- See `k8s/postgresql/postgresql.yaml` for reference

**Key Learning Points:**
- **StatefulSet vs Deployment**: StatefulSets maintain pod identity and ordered deployment
- **PersistentVolumes**: Azure Disk or Azure Files for persistent storage
- **Init Containers**: Can run init scripts before main container starts

---

### 2. RabbitMQ (`rabbitmq`)

**Docker Compose:**
```yaml
rabbitmq:
  image: rabbitmq:latest
  ports: ["5672:5672"]
  volumes:
    - rabbitmq_data:/data
  healthcheck:
    test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
```

**Kubernetes Translation Options:**

**Option A: Azure Service Bus (Recommended for Production)**
- Fully managed message broker
- Replace `RABBITMQ_URL` with Service Bus connection string
- Requires code changes to use Azure Service Bus SDK
- **Learning Resources:**
  - [Azure Service Bus Overview](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview)
  - [Service Bus vs RabbitMQ Comparison](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview)

**Option B: RabbitMQ Operator (In-Cluster)**
- Use RabbitMQ Kubernetes Operator for production-grade setup
- `StatefulSet` with persistent storage
- `Service` (ClusterIP) for internal access
- See `k8s/rabbitmq/rabbitmq.yaml` for reference
- **Learning Resources:**
  - [RabbitMQ Kubernetes Operator](https://www.rabbitmq.com/kubernetes/operator/operator-overview.html)

**Key Learning Points:**
- **Operators**: Kubernetes extensions that manage complex applications
- **Stateful Messaging**: RabbitMQ requires persistent storage for queues

---

### 3. Control Plane (`control-plane`)

**Docker Compose:**
```yaml
control-plane:
  build:
    context: ./services/control-plane
  ports: ["8080:8080"]
  environment:
    DATABASE_URL: postgresql://studojo:studojo@postgres:5432/postgres
    RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    JWKS_URL: http://frontend:3000/api/auth/jwks
  depends_on:
    postgres:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
```

**Kubernetes Translation:**

Already implemented in `k8s/control-plane/deployment.yaml`. Key concepts:

1. **Deployment**: Manages pod replicas (currently 2)
2. **Service**: ClusterIP for internal access (DNS: `control-plane.studiojo.svc.cluster.local`)
3. **Environment Variables**: 
   - Secrets: `DATABASE_URL`, `RABBITMQ_URL`, `JWKS_URL`, `RAZORPAY_*`
   - ConfigMaps: `HTTP_PORT`, `CORS_ORIGINS`
4. **Dependencies**: Handled via `readinessProbe` - pods wait until dependencies are ready
5. **Health Checks**: `livenessProbe` and `readinessProbe` replace Docker healthchecks

**Key Learning Points:**
- **Service DNS**: Services get DNS names: `<service-name>.<namespace>.svc.cluster.local`
- **Secrets**: Never commit secrets; use Kubernetes Secrets or Azure Key Vault
- **Readiness Probes**: Prevent traffic to pods that aren't ready
- **Liveness Probes**: Restart unhealthy pods

**Translation Notes:**
- `depends_on` → `readinessProbe` ensures dependencies are ready
- `build` → Build image, push to ACR, reference in `image:` field
- `ports` → `Service` exposes ports internally (use Ingress for external access)

---

### 4. Frontend (`frontend`)

**Docker Compose:**
```yaml
frontend:
  build:
    context: ./frontend
    args:
      VITE_CONTROL_PLANE_URL: http://localhost:8080
  ports: ["3000:3000"]
  env_file: ./frontend/.env.local
  environment:
    DATABASE_URL: postgresql://studojo:studojo@postgres:5432/postgres
  depends_on:
    postgres:
      condition: service_healthy
    frontend-db-push:
      condition: service_completed_successfully
```

**Kubernetes Translation:**

Already implemented in `k8s/frontend/deployment.yaml`. Key concepts:

1. **Build Args**: Passed during Docker build, baked into image
2. **Environment Variables**: Mix of Secrets and ConfigMaps
3. **Init Job Dependency**: `frontend-db-push` runs as a Job before Deployment starts

**Frontend DB Push (Init Job):**
```yaml
# This becomes a Kubernetes Job
apiVersion: batch/v1
kind: Job
metadata:
  name: frontend-db-push
  namespace: studojo
spec:
  template:
    spec:
      containers:
      - name: db-push
        image: acrstudojo.azurecr.io/frontend:latest
        command: ["npm", "run", "db:push"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
      restartPolicy: Never
```

**Key Learning Points:**
- **Jobs**: Run to completion (one-time tasks like migrations)
- **Init Containers**: Run before main container in same pod
- **Build-time vs Runtime**: `VITE_CONTROL_PLANE_URL` is build arg, not runtime env var

---

### 5. Assignment Gen Worker (`assignment-gen-worker`)

**Docker Compose:**
```yaml
assignment-gen-worker:
  build:
    context: ./services/assignment-gen-worker
  environment:
    RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
    USE_LOCALSTACK: "true"
    LOCALSTACK_ENDPOINT: http://localstack:4566
    AZURE_STORAGE_ACCOUNT_NAME: assignments
    OPENAI_API_KEY: ${OPENAI_API_KEY}
  volumes:
    - ./services/assignment-gen:/app/assignment-gen:ro
  depends_on:
    rabbitmq:
      condition: service_healthy
    assignment-gen:
      condition: service_started
    localstack:
      condition: service_healthy
```

**Kubernetes Translation:**

See `k8s/assignment-gen-worker/deployment.yaml`. Key changes:

1. **Volumes**: 
   - Docker Compose bind mount → **ConfigMap** or **Init Container** to copy files
   - Or bake files into Docker image (recommended)
2. **LocalStack Replacement**: 
   - `USE_LOCALSTACK: "false"` in ConfigMap
   - `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` from Secrets
   - Connect directly to Azure Blob Storage
3. **Dependencies**: Handled via `readinessProbe` on RabbitMQ service

**Key Learning Points:**
- **ConfigMaps as Volumes**: Can mount ConfigMap data as files
- **Init Containers**: Can copy files from one container to another
- **Azure Blob Storage**: Use Azure SDK with connection string or managed identity

---

### 6. Resume Service (`resume-service`)

**Docker Compose:**
```yaml
resume-service:
  build:
    context: ./services/resume-svc
  ports: ["8086:8086"]
  environment:
    PORT: "8086"
```

**Kubernetes Translation:**

See `k8s/resume-service/deployment.yaml`. Simple stateless service:
- `Deployment` with replicas
- `Service` (ClusterIP) for internal access
- Other services connect via DNS: `http://resume-service:8086`

---

### 7. LocalStack → Azure Blob Storage

**Docker Compose:**
```yaml
localstack:
  image: localstack/localstack:latest
  environment:
    SERVICES: s3
localstack-init:
  image: amazon/aws-cli:latest
  command: |
    aws --endpoint-url=http://localstack:4566 s3 mb s3://assignments
    aws --endpoint-url=http://localstack:4566 s3 mb s3://resumes
```

**Azure Replacement:**

1. **Create Azure Storage Account** (via Azure Portal or CLI)
2. **Create Containers**: `assignments` and `resumes`
3. **Update Workers**: 
   - Set `USE_LOCALSTACK: "false"`
   - Provide `AZURE_STORAGE_ACCOUNT_NAME` and `AZURE_STORAGE_ACCOUNT_KEY` in Secrets
4. **Remove LocalStack**: No Kubernetes manifests needed

**Learning Resources:**
- [Azure Blob Storage Docs](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage SDKs](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-go)

---

## Azure Services Integration

### Azure Container Registry (ACR)

**Purpose**: Store your Docker images

**Setup:**
```bash
az acr create --resource-group studojo-rg --name acrstudojo --sku Basic
az acr login --name acrstudojo
```

**Build and Push:**
```bash
# Build images
docker build -t acrstudojo.azurecr.io/control-plane:latest ./services/control-plane
docker build -t acrstudojo.azurecr.io/frontend:latest ./frontend

# Push to ACR
az acr push --name acrstudojo --image control-plane:latest
az acr push --name acrstudojo --image frontend:latest
```

**Kubernetes Integration:**
- Create `imagePullSecret` for ACR authentication
- Reference images as: `acrstudojo.azurecr.io/service-name:tag`
- See `k8s/secrets/acr-secret.yaml`

**Learning Resources:**
- [Azure Container Registry Docs](https://learn.microsoft.com/en-us/azure/container-registry/)
- [AKS with ACR Integration](https://learn.microsoft.com/en-us/azure/aks/cluster-container-registry-integration)

### Azure Database for PostgreSQL

**Setup:**
```bash
az postgres flexible-server create \
  --resource-group studojo-rg \
  --name psql-studojo-prod \
  --admin-user studojo \
  --admin-password YOUR_SECURE_PASSWORD \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 16 \
  --storage-size 32
```

**Enable pgvector Extension:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Connection String:**
```
postgresql://studojo:PASSWORD@psql-studojo-prod.postgres.database.azure.com:5432/postgres?sslmode=require
```

**Store in Secret:**
```bash
kubectl create secret generic app-secrets \
  --from-literal=database-url="postgresql://..." \
  --namespace=studojo
```

**Learning Resources:**
- [Azure Database for PostgreSQL Flexible Server](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/)
- [Enable pgvector Extension](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/how-to-use-pgvector)

### Azure Blob Storage

**Setup:**
```bash
az storage account create \
  --resource-group studojo-rg \
  --name studojostorage \
  --sku Standard_LRS \
  --location eastus

az storage container create \
  --account-name studojostorage \
  --name assignments \
  --auth-mode login

az storage container create \
  --account-name studojostorage \
  --name resumes \
  --auth-mode login
```

**Get Access Key:**
```bash
az storage account keys list \
  --resource-group studojo-rg \
  --account-name studojostorage
```

**Store in Secret:**
```bash
kubectl create secret generic app-secrets \
  --from-literal=azure-storage-account-name="studojostorage" \
  --from-literal=azure-storage-account-key="YOUR_KEY" \
  --namespace=studojo
```

**Learning Resources:**
- [Azure Blob Storage Docs](https://learn.microsoft.com/en-us/azure/storage/blobs/)
- [Azure Storage Go SDK](https://learn.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-go)

### Azure Kubernetes Service (AKS)

**Create Cluster:**
```bash
az aks create \
  --resource-group studojo-rg \
  --name studojo-aks \
  --node-count 3 \
  --node-vm-size Standard_B2s \
  --enable-managed-identity \
  --attach-acr acrstudojo
```

**Get Credentials:**
```bash
az aks get-credentials --resource-group studojo-rg --name studojo-aks
```

**Learning Resources:**
- [AKS Quickstart](https://learn.microsoft.com/en-us/azure/aks/learn/quick-kubernetes-deploy-portal)
- [AKS Architecture](https://learn.microsoft.com/en-us/azure/aks/concepts-clusters-workloads)

---

## Networking and Service Discovery

### Service Types

1. **ClusterIP** (Default): Internal access only
   - Used for: PostgreSQL, RabbitMQ, Control Plane, Resume Service
   - DNS: `service-name.namespace.svc.cluster.local`
   - Short form: `service-name` (within same namespace)

2. **LoadBalancer**: External IP (Azure Load Balancer)
   - Used for: External-facing services (if not using Ingress)

3. **NodePort**: Expose on node IP
   - Rarely used in production

### Ingress Controller

**Purpose**: Route external traffic to services (HTTP/HTTPS)

**Azure Application Gateway Ingress Controller (AGIC):**
```bash
# Install AGIC
helm repo add application-gateway-kubernetes-ingress https://appgwingress.blob.core.windows.net/ingress-azure-helm-charts/
helm install ingress-azure application-gateway-kubernetes-ingress/ingress-azure
```

**Ingress Resource** (see `k8s/ingress/ingress.yaml`):
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: studojo-ingress
  namespace: studojo
spec:
  rules:
  - host: studojo.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
  - host: api.studojo.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: control-plane
            port:
              number: 8080
```

**Learning Resources:**
- [Kubernetes Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/)
- [Azure Application Gateway Ingress Controller](https://learn.microsoft.com/en-us/azure/application-gateway/ingress-controller-overview)

---

## Configuration Management

### ConfigMaps vs Secrets

**ConfigMaps** (`k8s/configmaps/configmaps.yaml`):
- Non-sensitive configuration
- Examples: `HTTP_PORT`, `CORS_ORIGINS`, `NODE_ENV`
- Can be mounted as files or environment variables

**Secrets** (`k8s/secrets/secrets-template.yaml`):
- Sensitive data: passwords, API keys, connection strings
- Base64 encoded (not encrypted by default)
- **Production**: Use Azure Key Vault with CSI driver

**Example:**
```yaml
# ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
data:
  HTTP_PORT: "8080"
  CORS_ORIGINS: "https://studojo.com"

# Secret
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
type: Opaque
stringData:
  database-url: "postgresql://user:pass@host:5432/db"
  openai-api-key: "sk-..."
```

**Using in Pods:**
```yaml
env:
- name: HTTP_PORT
  valueFrom:
    configMapKeyRef:
      name: app-config
      key: HTTP_PORT
- name: DATABASE_URL
  valueFrom:
    secretKeyRef:
      name: app-secrets
      key: database-url
```

**Learning Resources:**
- [ConfigMaps](https://kubernetes.io/docs/concepts/configuration/configmap/)
- [Secrets](https://kubernetes.io/docs/concepts/configuration/secret/)
- [Azure Key Vault CSI Driver](https://learn.microsoft.com/en-us/azure/aks/csi-secrets-store-driver)

---

## Storage and Volumes

### PersistentVolumes for Stateful Services

**PostgreSQL** (if in-cluster):
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
  storageClassName: managed-csi  # Azure Disk
```

**RabbitMQ** (if in-cluster):
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: rabbitmq-data
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
```

**Mount in Pod:**
```yaml
volumes:
- name: postgres-data
  persistentVolumeClaim:
    claimName: postgres-data
containers:
- name: postgres
  volumeMounts:
  - name: postgres-data
    mountPath: /data
```

**Learning Resources:**
- [PersistentVolumes](https://kubernetes.io/docs/concepts/storage/persistent-volumes/)
- [Azure Disk CSI Driver](https://learn.microsoft.com/en-us/azure/aks/azure-disk-csi)

---

## Dependencies and Init Containers

### Handling `depends_on`

**Docker Compose:**
```yaml
control-plane:
  depends_on:
    postgres:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
```

**Kubernetes Approach:**

1. **Readiness Probes**: Ensure dependencies are ready
```yaml
readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

2. **Init Containers**: Run before main container
```yaml
initContainers:
- name: wait-for-postgres
  image: postgres:16
  command: ['sh', '-c', 'until pg_isready -h postgres -U studojo; do sleep 2; done']
```

3. **Jobs**: One-time dependencies (like `frontend-db-push`)
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: frontend-db-push
spec:
  template:
    spec:
      containers:
      - name: db-push
        image: acrstudojo.azurecr.io/frontend:latest
        command: ["npm", "run", "db:push"]
      restartPolicy: Never
```

**Learning Resources:**
- [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Jobs](https://kubernetes.io/docs/concepts/workloads/controllers/job/)

---

## Health Checks and Probes

### Translating Docker Healthchecks

**Docker Compose:**
```yaml
healthcheck:
  test: ["CMD-SHELL", "pg_isready -U studojo -d postgres"]
  interval: 5s
  timeout: 5s
  retries: 5
  start_period: 5s
```

**Kubernetes:**
```yaml
livenessProbe:
  exec:
    command:
    - pg_isready
    - -U
    - studojo
    - -d
    - postgres
  initialDelaySeconds: 5    # start_period
  periodSeconds: 5           # interval
  timeoutSeconds: 5          # timeout
  failureThreshold: 5        # retries

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 5
```

**Probe Types:**
- **livenessProbe**: Restart pod if unhealthy
- **readinessProbe**: Remove from Service endpoints if not ready
- **startupProbe**: For slow-starting containers

**Learning Resources:**
- [Configure Liveness, Readiness, Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

## Deployment Strategy

### Deployment Order

1. **Namespace**: `kubectl apply -f namespace/`
2. **Secrets & ConfigMaps**: `kubectl apply -f secrets/ configmaps/`
3. **Stateful Services**: `kubectl apply -f postgresql/ rabbitmq/` (or use Azure managed)
4. **Init Jobs**: `kubectl apply -f frontend-db-push-job.yaml` (wait for completion)
5. **Services**: `kubectl apply -f resume-service/ control-plane/ frontend/`
6. **Workers**: `kubectl apply -f assignment-gen-worker/ resume-worker/`
7. **Ingress**: `kubectl apply -f ingress/`

### Rolling Updates

Kubernetes Deployments support rolling updates automatically:
```yaml
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

**Update Process:**
```bash
# Update image
kubectl set image deployment/control-plane control-plane=acrstudojo.azurecr.io/control-plane:v2.0.0

# Watch rollout
kubectl rollout status deployment/control-plane

# Rollback if needed
kubectl rollout undo deployment/control-plane
```

**Learning Resources:**
- [Deployments](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Rolling Updates](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment)

---

## Step-by-Step Learning Path

### Phase 1: Kubernetes Fundamentals (Week 1)

**Day 1-2: Core Concepts**
1. Read: [Kubernetes Basics Tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
2. Practice: Deploy a simple app locally (minikube or kind)
3. Understand: Pods, Services, Deployments, ConfigMaps, Secrets

**Day 3-4: Docker Compose Translation**
1. Read: [Docker Compose to Kubernetes Guide](https://kubernetes.io/docs/tasks/configure-pod-container/translate-compose-kubernetes/)
2. Practice: Translate a simple 2-service compose file to Kubernetes
3. Understand: Service discovery, networking, volumes

**Day 5-7: Hands-On Practice**
1. Set up local Kubernetes cluster (minikube/kind)
2. Deploy PostgreSQL and a simple app
3. Practice: ConfigMaps, Secrets, Services, Deployments

**Resources:**
- [Kubernetes Concepts](https://kubernetes.io/docs/concepts/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)

### Phase 2: Azure-Specific (Week 2)

**Day 1-2: Azure Container Registry**
1. Create ACR: `az acr create`
2. Build and push images
3. Configure AKS to pull from ACR
4. **Practice**: Build and push your control-plane image

**Day 3-4: Azure Database for PostgreSQL**
1. Create Azure PostgreSQL Flexible Server
2. Enable pgvector extension
3. Configure firewall rules for AKS
4. **Practice**: Connect your control-plane to Azure DB

**Day 5-7: Azure Blob Storage**
1. Create Storage Account and containers
2. Get access keys
3. Update workers to use Azure Blob Storage
4. **Practice**: Replace LocalStack with Azure Blob Storage

**Resources:**
- [Azure Kubernetes Service Docs](https://learn.microsoft.com/en-us/azure/aks/)
- [Azure Container Registry Docs](https://learn.microsoft.com/en-us/azure/container-registry/)
- [Azure Database for PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/)

### Phase 3: Your Application Translation (Week 3)

**Day 1-2: Infrastructure Services**
1. Translate PostgreSQL (choose: Azure DB or in-cluster)
2. Translate RabbitMQ (choose: Service Bus or Operator)
3. Set up Azure Blob Storage
4. **Practice**: Deploy infrastructure layer

**Day 3-4: Application Services**
1. Translate Control Plane (already done - review and understand)
2. Translate Frontend (already done - review and understand)
3. Translate Resume Service
4. **Practice**: Deploy application layer

**Day 5-7: Workers and Jobs**
1. Translate Assignment Gen Worker
2. Translate Resume Worker
3. Create Frontend DB Push Job
4. **Practice**: Deploy workers and verify message flow

**Resources:**
- Review existing manifests in `k8s/` directory
- Compare with `docker-compose.yml` to understand translation

### Phase 4: Production Readiness (Week 4)

**Day 1-2: Networking and Ingress**
1. Set up Ingress Controller (AGIC or NGINX)
2. Configure SSL/TLS certificates (cert-manager + Let's Encrypt)
3. Set up DNS
4. **Practice**: Expose services via HTTPS

**Day 3-4: Monitoring and Logging**
1. Set up Azure Monitor for Containers
2. Configure log aggregation
3. Set up alerts
4. **Practice**: Monitor your deployed services

**Day 5-7: Security and Optimization**
1. Use Azure Key Vault for secrets
2. Configure network policies
3. Set up Horizontal Pod Autoscaling (HPA)
4. Review resource limits
5. **Practice**: Harden your deployment

**Resources:**
- [Azure Monitor for Containers](https://learn.microsoft.com/en-us/azure/azure-monitor/containers/)
- [AKS Security Best Practices](https://learn.microsoft.com/en-us/azure/aks/security-baseline)
- [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)

---

## Quick Reference: Translation Checklist

### For Each Service in docker-compose.yml:

- [ ] **Image**: Build and push to ACR, reference in `image:` field
- [ ] **Ports**: Create `Service` resource (ClusterIP for internal, LoadBalancer/Ingress for external)
- [ ] **Environment Variables**: 
  - [ ] Non-sensitive → `ConfigMap`
  - [ ] Sensitive → `Secret` (or Azure Key Vault)
- [ ] **Volumes**: 
  - [ ] Persistent data → `PersistentVolumeClaim`
  - [ ] Config files → `ConfigMap` mounted as volume
  - [ ] Code files → Bake into image or use Init Container
- [ ] **Health Checks**: Translate to `livenessProbe` and `readinessProbe`
- [ ] **Dependencies**: Use `readinessProbe` or `initContainers`
- [ ] **Replicas**: Set in `Deployment.spec.replicas`
- [ ] **Resources**: Set `requests` and `limits` for CPU/memory

### Infrastructure Decisions:

- [ ] **PostgreSQL**: Azure Database for PostgreSQL (managed) OR in-cluster StatefulSet
- [ ] **RabbitMQ**: Azure Service Bus (managed) OR RabbitMQ Operator (in-cluster)
- [ ] **Storage**: Azure Blob Storage (replace LocalStack)
- [ ] **Container Registry**: Azure Container Registry (ACR)
- [ ] **Kubernetes**: Azure Kubernetes Service (AKS)
- [ ] **Ingress**: Azure Application Gateway Ingress Controller OR NGINX Ingress
- [ ] **Secrets**: Kubernetes Secrets (dev) OR Azure Key Vault (production)

---

## Common Patterns in Your Stack

### Pattern 1: Stateless API Service (Control Plane, Resume Service)

```yaml
Deployment + Service (ClusterIP) + Ingress (for external access)
```

### Pattern 2: Worker Service (Assignment Gen Worker, Resume Worker)

```yaml
Deployment + Service (ClusterIP, optional) + ConfigMap + Secrets
- Workers consume from RabbitMQ, don't need external access
- Use ConfigMap for non-sensitive config
- Use Secrets for API keys and storage credentials
```

### Pattern 3: Frontend Application

```yaml
Deployment + Service (ClusterIP) + Ingress
- Build-time args baked into image
- Runtime env vars from ConfigMaps/Secrets
- Init Job for database migrations
```

### Pattern 4: Stateful Service (PostgreSQL, RabbitMQ - if in-cluster)

```yaml
StatefulSet + Service (ClusterIP) + PersistentVolumeClaim
- Maintains pod identity
- Ordered deployment
- Persistent storage
```

### Pattern 5: One-Time Job (Frontend DB Push)

```yaml
Job + Secrets
- Runs to completion
- No restart policy
- Can be used as dependency for other resources
```

---

## Next Steps

1. **Review Existing Manifests**: Study the manifests in `k8s/` directory
2. **Complete Missing Translations**: Finish translating any remaining services
3. **Set Up Azure Resources**: Use `azure-setup.sh` or create manually
4. **Deploy to AKS**: Follow `QUICK_START.md` for deployment steps
5. **Test End-to-End**: Verify all services communicate correctly
6. **Production Hardening**: Implement monitoring, logging, security best practices

---

## Additional Learning Resources

### Official Documentation
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Azure Kubernetes Service](https://learn.microsoft.com/en-us/azure/aks/)
- [Azure Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/)

### Interactive Learning
- [Kubernetes Basics Tutorial](https://kubernetes.io/docs/tutorials/kubernetes-basics/)
- [Play with Kubernetes](https://labs.play-with-k8s.com/)
- [Azure Learn - Kubernetes on Azure](https://learn.microsoft.com/en-us/training/paths/intro-to-kubernetes-on-azure/)

### Books
- "Kubernetes Up & Running" by Kelsey Hightower
- "The Kubernetes Book" by Nigel Poulton

### Video Courses
- Kubernetes course by TechWorld with Nana (YouTube)
- Microsoft Learn Azure Kubernetes Service modules

---

**Remember**: Start small, test incrementally, and gradually translate services one at a time. Your existing manifests in `k8s/` are a great starting point - study them to understand the patterns, then apply the same patterns to remaining services.
