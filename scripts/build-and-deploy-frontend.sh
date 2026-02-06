#!/bin/bash
# Build and deploy Frontend application
# This script builds the Docker image, pushes it to ACR, and deploys to Kubernetes

set -e

ACR_NAME="acrstudojo"
ACR_REGISTRY="acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io"
IMAGE_NAME="frontend"
IMAGE_TAG="${1:-latest}"

echo "🏗️  Building and deploying Frontend..."

# Check if Azure CLI is logged in
if ! az account show &> /dev/null; then
    echo "❌ Not logged into Azure CLI. Please run: az login"
    exit 1
fi

# Login to ACR
echo "🔐 Logging into ACR..."
az acr login --name "$ACR_NAME"

# Build and push image
echo "🔨 Building Docker image..."
cd apps/frontend
docker build -t "${ACR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" .
docker tag "${ACR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}" "${ACR_REGISTRY}/${IMAGE_NAME}:latest"

echo "📤 Pushing image to ACR..."
docker push "${ACR_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"
docker push "${ACR_REGISTRY}/${IMAGE_NAME}:latest"

cd ../..

# Apply database migration (if not already done)
echo "📊 Checking database migration..."
if ! kubectl get job frontend-db-push -n studojo &> /dev/null || [ "$(kubectl get job frontend-db-push -n studojo -o jsonpath='{.status.conditions[?(@.type=="Complete")].status}')" != "True" ]; then
    echo "🔄 Running database migration..."
    kubectl apply -f k8s/frontend/job-db-push.yaml
    echo "⏳ Waiting for migration to complete..."
    kubectl wait --for=condition=complete job/frontend-db-push -n studojo --timeout=300s || {
        echo "⚠️  Migration job still running or failed. Check logs:"
        echo "kubectl logs job/frontend-db-push -n studojo"
        read -p "Continue with deployment anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
else
    echo "✅ Database migration already completed"
fi

# Deploy Frontend
echo "🚀 Deploying Frontend..."
kubectl apply -f k8s/frontend/

# Wait for deployment to be ready
echo "⏳ Waiting for Frontend to be ready..."
kubectl rollout status deployment/frontend -n studojo --timeout=300s || {
    echo "⚠️  Deployment may still be starting. Check status:"
    echo "kubectl get pods -n studojo -l app=frontend"
}

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Check Frontend status:"
echo "   kubectl get pods -n studojo -l app=frontend"
echo "   kubectl logs -n studojo -l app=frontend"
echo ""
echo "🌐 Frontend should be available at: https://studojo.pro"

