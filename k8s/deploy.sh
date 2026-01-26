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
if [ ! -f "secrets/secrets.yaml" ]; then
    echo -e "${RED}❌ secrets/secrets.yaml not found!${NC}"
    echo -e "${YELLOW}Please copy secrets/secrets-template.yaml to secrets/secrets.yaml and fill in your values${NC}"
    exit 1
fi

echo -e "${YELLOW}🔐 Applying secrets...${NC}"
kubectl apply -f secrets/secrets.yaml

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
        echo "  --docker-server=acrstudojo.azurecr.io \\"
        echo "  --docker-username=acrstudojo \\"
        echo "  --docker-password=<your-password> \\"
        echo "  --namespace=studojo"
        exit 1
    fi
    kubectl create secret docker-registry acr-secret \
      --docker-server=acrstudojo.azurecr.io \
      --docker-username=acrstudojo \
      --docker-password=$ACR_PASSWORD \
      --namespace=studojo \
      --dry-run=client -o yaml | kubectl apply -f -
else
    echo -e "${GREEN}✓ ACR secret already exists${NC}"
fi

# Ask about infrastructure services
read -p "Deploy in-cluster PostgreSQL and RabbitMQ? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗄️  Deploying PostgreSQL...${NC}"
    kubectl apply -f postgresql/
    echo -e "${YELLOW}⏳ Waiting for PostgreSQL to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=postgres -n studojo --timeout=300s || true
    
    echo -e "${YELLOW}🐰 Deploying RabbitMQ...${NC}"
    kubectl apply -f rabbitmq/configmap.yaml
    kubectl apply -f rabbitmq/
    echo -e "${YELLOW}⏳ Waiting for RabbitMQ to be ready...${NC}"
    kubectl wait --for=condition=ready pod -l app=rabbitmq -n studojo --timeout=300s || true
else
    echo -e "${GREEN}✓ Skipping in-cluster infrastructure (assuming Azure managed services)${NC}"
fi

# Run database migration
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

# Deploy application services
echo -e "${YELLOW}🚀 Deploying Control Plane...${NC}"
kubectl apply -f control-plane/

echo -e "${YELLOW}🌐 Deploying Frontend...${NC}"
kubectl apply -f frontend/

echo -e "${YELLOW}📄 Deploying Resume Service...${NC}"
kubectl apply -f resume-service/

# Deploy workers
echo -e "${YELLOW}⚙️  Deploying Assignment Gen Worker...${NC}"
kubectl apply -f assignment-gen-worker/

echo -e "${YELLOW}⚙️  Deploying Resume Worker...${NC}"
kubectl apply -f resume-worker/

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
