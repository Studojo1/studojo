#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting Studojo v2 Kubernetes Deployment${NC}\n"

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}❌ kubectl is not installed or not in PATH${NC}"
    exit 1
fi

# Check if namespace exists
if ! kubectl get namespace studojo &> /dev/null; then
    echo -e "${YELLOW}📦 Creating namespace...${NC}"
    kubectl apply -f namespace.yaml
else
    echo -e "${GREEN}✓ Namespace already exists${NC}"
fi

# Check if secrets file exists
if [ ! -f "secrets/secrets.yml" ] && [ ! -f "secrets/secrets.yaml" ]; then
    echo -e "${RED}❌ secrets/secrets.yml not found!${NC}"
    echo -e "${YELLOW}Please copy secrets/secrets-template.yaml to secrets/secrets.yml and fill in your values${NC}"
    exit 1
fi

echo -e "${YELLOW}🔐 Applying secrets...${NC}"
if [ -f "secrets/secrets.yml" ]; then
    kubectl apply -f secrets/secrets.yml
else
kubectl apply -f secrets/secrets.yaml
fi

echo -e "${YELLOW}📋 Applying configmaps...${NC}"
kubectl apply -f configmaps/

# Check if ACR secret exists
if ! kubectl get secret acr-secret -n studojo &> /dev/null; then
    echo -e "${YELLOW}🔑 Creating ACR pull secret...${NC}"
    echo -e "${YELLOW}Please ensure you have Azure CLI configured and ACR credentials available${NC}"
    ACR_NAME="acrstudojo"
    ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv 2>/dev/null || echo "")
    if [ -z "$ACR_PASSWORD" ]; then
        echo -e "${RED}❌ Could not retrieve ACR password. Please create the secret manually:${NC}"
        echo "kubectl create secret docker-registry acr-secret \\"
        echo "  --docker-server=acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io \\"
        echo "  --docker-username=acrstudojo \\"
        echo "  --docker-password=<your-password> \\"
        echo "  --namespace=studojo"
        exit 1
    fi
    kubectl create secret docker-registry acr-secret \
      --docker-server=acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io \
      --docker-username=acrstudojo \
      --docker-password=$ACR_PASSWORD \
      --namespace=studojo \
      --dry-run=client -o yaml | kubectl apply -f -
else
    echo -e "${GREEN}✓ ACR secret already exists${NC}"
fi

# Check if infrastructure services exist
POSTGRES_EXISTS=$(kubectl get statefulset postgres -n studojo 2>/dev/null && echo "yes" || echo "no")
RABBITMQ_EXISTS=$(kubectl get statefulset rabbitmq -n studojo 2>/dev/null && echo "yes" || echo "no")

# Deploy infrastructure services if they don't exist
if [[ "$POSTGRES_EXISTS" == "no" ]] || [[ "$RABBITMQ_EXISTS" == "no" ]]; then
    if [[ "$POSTGRES_EXISTS" == "no" ]] && [[ "$RABBITMQ_EXISTS" == "no" ]]; then
read -p "Deploy in-cluster PostgreSQL and RabbitMQ? (y/N) " -n 1 -r
echo
        DEPLOY_INFRA=$REPLY
    else
        DEPLOY_INFRA="y"
    fi
    
    if [[ $DEPLOY_INFRA =~ ^[Yy]$ ]]; then
        if [[ "$POSTGRES_EXISTS" == "no" ]]; then
    echo -e "${YELLOW}🗄️  Deploying PostgreSQL...${NC}"
    kubectl apply -f postgresql/
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n studojo --timeout=300s || true
        else
            echo -e "${GREEN}✓ PostgreSQL already exists${NC}"
        fi
    
        if [[ "$RABBITMQ_EXISTS" == "no" ]]; then
    echo -e "${YELLOW}🐰 Deploying RabbitMQ...${NC}"
    kubectl apply -f rabbitmq/configmap.yaml
    kubectl apply -f rabbitmq/
    echo -e "${YELLOW}⏳ Waiting for RabbitMQ to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=rabbitmq -n studojo --timeout=300s || true
        else
            echo -e "${GREEN}✓ RabbitMQ already exists${NC}"
        fi
        
        # Deploy Redis for distributed verification storage
        REDIS_EXISTS=$(kubectl get statefulset redis -n studojo 2>/dev/null && echo "yes" || echo "no")
        if [[ "$REDIS_EXISTS" == "no" ]]; then
            echo -e "${YELLOW}🔴 Deploying Redis...${NC}"
            kubectl apply -f redis/
            echo -e "${YELLOW}⏳ Waiting for Redis to be ready...${NC}"
            kubectl wait --for=condition=ready pod -l app=redis -n studojo --timeout=300s || true
        else
            echo -e "${GREEN}✓ Redis already exists${NC}"
        fi
else
    echo -e "${GREEN}✓ Skipping in-cluster infrastructure (assuming Azure managed services)${NC}"
fi
else
    echo -e "${GREEN}✓ Infrastructure services already exist${NC}"
fi

# Run database migration (only if job doesn't exist or failed)
DB_JOB_EXISTS=$(kubectl get job frontend-db-push -n studojo 2>/dev/null && echo "yes" || echo "no")
DB_JOB_COMPLETE=$(kubectl get job frontend-db-push -n studojo -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}' 2>/dev/null || echo "False")

if [[ "$DB_JOB_EXISTS" == "no" ]] || [[ "$DB_JOB_COMPLETE" != "True" ]]; then
    if [[ "$DB_JOB_EXISTS" == "yes" ]] && [[ "$DB_JOB_COMPLETE" != "True" ]]; then
        echo -e "${YELLOW}🔄 Previous migration job exists but incomplete. Deleting and recreating...${NC}"
        kubectl delete job frontend-db-push -n studojo --ignore-not-found=true
        sleep 2
    fi
    
echo -e "${YELLOW}🔄 Running database migration job...${NC}"
kubectl apply -f frontend/job-db-push.yaml
echo -e "${YELLOW}⏳ Waiting for DB push job to complete...${NC}"
if kubectl wait --for=condition=complete job/frontend-db-push -n studojo --timeout=300s; then
    echo -e "${GREEN}✓ Database migration completed${NC}"
else
    echo -e "${RED}❌ Database migration failed. Check logs:${NC}"
    echo "kubectl logs job/frontend-db-push -n studojo"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    fi
else
    echo -e "${GREEN}✓ Database migration already completed${NC}"
fi

# Deploy application services (idempotent - kubectl apply is safe to run multiple times)
echo -e "${YELLOW}🚀 Deploying Control Plane...${NC}"
kubectl apply -f control-plane/

echo -e "${YELLOW}🌐 Deploying Frontend...${NC}"
kubectl apply -f frontend/

echo -e "${YELLOW}✍️  Deploying Maverick...${NC}"
kubectl apply -f maverick/

echo -e "${YELLOW}📋 Deploying Admin Panel...${NC}"
kubectl apply -f admin-panel/

echo -e "${YELLOW}📄 Deploying Resume Service...${NC}"
kubectl apply -f resume-service/

# Deploy workers
echo -e "${YELLOW}⚙️  Deploying Assignment Gen Worker...${NC}"
kubectl apply -f assignment-gen-worker/

echo -e "${YELLOW}⚙️  Deploying Resume Worker...${NC}"
kubectl apply -f resume-worker/

echo -e "${YELLOW}🤖 Deploying Humanizer Service...${NC}"
kubectl apply -f humanizer-svc/

echo -e "${YELLOW}🤖 Deploying Humanizer Worker...${NC}"
kubectl apply -f humanizer-worker/

# Deploy ingress
echo -e "${YELLOW}🌍 Configuring Ingress...${NC}"
kubectl apply -f ingress/

echo -e "\n${GREEN}✅ Deployment complete!${NC}\n"

echo -e "${YELLOW}📊 Checking deployment status...${NC}"
kubectl get pods -n studojo

echo -e "\n${GREEN}🎉 All done!${NC}"
echo -e "${YELLOW}To check status: kubectl get pods -n studojo${NC}"
echo -e "${YELLOW}To view logs: kubectl logs -n studojo <pod-name>${NC}"
echo -e "${YELLOW}To check services: kubectl get svc -n studojo${NC}"
echo -e "${YELLOW}To check ingress: kubectl get ingress -n studojo${NC}"

