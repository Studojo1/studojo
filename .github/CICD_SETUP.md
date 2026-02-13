# CI/CD Setup Guide

This document describes the GitHub Actions CI/CD setup for all Studojo services and applications.

## Overview

Each service and application repository has its own `.github/workflows/deploy.yml` file that automatically builds Docker images and deploys to Azure Kubernetes Service (AKS) when code is pushed to the `main` branch.

## Architecture

```
GitHub Push (main branch)
    ↓
GitHub Actions Workflow
    ├─ Build Docker Image
    ├─ Push to ACR (acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io)
    ├─ Deploy to AKS (namespace: studojo)
    └─ Record Deployment (POST to control-plane /v1/dev/deployments)
```

## Required GitHub Secrets

Each repository needs the following secrets configured in GitHub Settings → Secrets and variables → Actions:

### Azure Authentication

- **`AZURE_CREDENTIALS`** (required)
  - JSON credentials for Azure service principal
  - Format: `{"clientId":"...","clientSecret":"...","subscriptionId":"...","tenantId":"..."}`
  - Can be created using: `az ad sp create-for-rbac --name "github-actions" --role contributor --scopes /subscriptions/{subscription-id} --sdk-auth`

### Azure Container Registry (ACR)

- **`AZURE_CLIENT_ID`** (required)
  - Azure service principal client ID for ACR authentication

- **`AZURE_CLIENT_SECRET`** (required)
  - Azure service principal client secret for ACR authentication

### Azure Kubernetes Service (AKS)

- **`AKS_RESOURCE_GROUP`** (required)
  - Resource group name containing the AKS cluster
  - Example: `studojo-rg`

- **`AKS_CLUSTER_NAME`** (required)
  - Name of the AKS cluster
  - Example: `studojo-aks`

## Setting Up Secrets

### Option 1: Using Azure CLI

1. Create a service principal:
```bash
az ad sp create-for-rbac --name "github-actions-studojo" \
  --role contributor \
  --scopes /subscriptions/{subscription-id} \
  --sdk-auth
```

2. Copy the JSON output and add it as `AZURE_CREDENTIALS` secret in GitHub

3. Get ACR credentials:
```bash
az acr credential show --name acrstudojo-dhfsdrfhf6a6bbg2
```

4. Add `AZURE_CLIENT_ID` and `AZURE_CLIENT_SECRET` from the output

5. Set AKS details:
```bash
az aks list --query "[].{name:name, resourceGroup:resourceGroup}" -o table
```

### Option 2: Using GitHub Actions Secrets UI

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add each secret individually:
   - `AZURE_CREDENTIALS` (JSON format)
   - `AZURE_CLIENT_ID`
   - `AZURE_CLIENT_SECRET`
   - `AKS_RESOURCE_GROUP`
   - `AKS_CLUSTER_NAME`

## Workflow Behavior

### Build Job

- Triggers on push to `main` branch
- Builds Docker image using the repository's Dockerfile
- Tags image with:
  - Commit SHA: `{registry}/{service-name}:{sha}`
  - Latest: `{registry}/{service-name}:latest`
- Pushes to Azure Container Registry

### Deploy Job

- Runs after successful build
- Authenticates to Azure and AKS
- Updates Kubernetes deployment with new image tag
- Waits for rollout to complete (5 minute timeout)
- Records deployment in control-plane API

## Image Naming Convention

Images are named: `{registry}/{service-name}:{tag}`

Examples:
- `acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io/control-plane:abc123`
- `acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io/frontend:latest`

## Deployment Tracking

After successful deployment, workflows automatically record the deployment in the control-plane API:

```json
{
  "service": "{service-name}",
  "version": "{commit-sha}",
  "deployed_at": "{iso-timestamp}",
  "deployed_by": "{github-actor}",
  "status": "success",
  "workflow_run": {run-id}
}
```

This data is visible in the Dev Panel at `https://dev.studojo.com`.

## Troubleshooting

### Build Failures

- Check Dockerfile syntax and dependencies
- Verify ACR credentials are correct
- Check GitHub Actions logs for detailed error messages

### Deployment Failures

- Verify AKS credentials and cluster access
- Check if the deployment exists in Kubernetes: `kubectl get deployment {service-name} -n studojo`
- Verify image exists in ACR: `az acr repository show-tags --name acrstudojo-dhfsdrfhf6a6bbg2 --repository {service-name}`

### Permission Issues

- Ensure service principal has `Contributor` role on subscription
- Verify ACR pull permissions
- Check AKS cluster access permissions

## Manual Deployment

If you need to deploy manually:

```bash
# Build and push image
docker build -t acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io/{service-name}:{tag} .
docker push acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io/{service-name}:{tag}

# Deploy to Kubernetes
kubectl set image deployment/{service-name} {service-name}=acrstudojo-dhfsdrfhf6a6bbg2.azurecr.io/{service-name}:{tag} -n studojo
kubectl rollout status deployment/{service-name} -n studojo
```

## Services and Apps

### Services (Backend)
- `control-plane` (Go)
- `emailer-service` (Go)
- `resume-svc` (Go)
- `humanizer-svc` (Python)
- `assignment-gen` (Python)
- `assignment-gen-worker` (Go)
- `resume-worker` (Go)
- `humanizer-worker` (Go)

### Apps (Frontend)
- `frontend` (Node.js/Bun)
- `admin-panel` (Node.js)
- `dev-panel` (Node.js)
- `maverick` (Node.js)
- `partner-panel` (Node.js)

Each repository has its own workflow file at `.github/workflows/deploy.yml`.

