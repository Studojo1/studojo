# CI/CD Setup Guide

This guide walks you through setting up automated builds and image pushes to Azure Container Registry (ACR) when you push to `master`/`main` branch.

## Overview

When you push changes to `services/` or `frontend/` directories on the `master` or `main` branch, GitHub Actions will:
1. Detect which services changed
2. Build Docker images for changed services
3. Push images to Azure Container Registry (ACR)
4. Tag images with both `latest` and commit SHA

## Prerequisites

1. **Azure Account** with:
   - Resource group created (`studojo-rg`)
   - Azure Container Registry created (`acrstudojo`)
   - Azure CLI installed locally

2. **GitHub Repository** with Actions enabled

## Step 1: Create Azure Service Principal

Run the setup script to create a service principal with proper IAM permissions:

```bash
cd k8s
./setup-ci-iam.sh
```

The script will:
- Create a service principal named `studojo-ci-cd`
- Assign `Contributor` role on the resource group
- Assign `AcrPush` role on the ACR (for pushing images)
- Output credentials you need to add to GitHub Secrets

**Alternative: Manual Setup**

If you prefer to set it up manually:

```bash
# Set variables
RESOURCE_GROUP="studojo-rg"
ACR_NAME="acrstudojo"
SP_NAME="studojo-ci-cd"
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

# Create service principal
az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role contributor \
  --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
  --sdk-auth

# Get ACR resource ID
ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv)

# Assign AcrPush role
SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv)
az role assignment create \
  --assignee "$SP_APP_ID" \
  --role AcrPush \
  --scope "$ACR_ID"
```

## Step 2: Add GitHub Secrets

Go to your GitHub repository:
1. **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `AZURE_CLIENT_ID` | Service principal App ID | From Step 1 output |
| `AZURE_TENANT_ID` | Azure tenant ID | From Step 1 output |
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | From Step 1 output |
| `AZURE_CLIENT_SECRET` | Service principal password | From Step 1 output |
| `VITE_CONTROL_PLANE_URL` | `https://api.studojo.com` | (Optional) Control plane URL for frontend build |

**Important**: The `AZURE_CLIENT_SECRET` is only shown once when creating the service principal. If you lose it, you'll need to reset it:

```bash
az ad sp credential reset --id <SP_APP_ID>
```

## Step 3: Choose Workflow File

We provide two workflow files:

### Option A: `build-and-push-simple.yml` (Recommended)
- Uses `dorny/paths-filter` to detect which services changed
- Only builds images for services that actually changed
- More efficient and faster

### Option B: `build-and-push.yml`
- Simpler logic, builds all services if any service changes
- No external dependencies

**To use Option A** (recommended), rename the file:
```bash
mv .github/workflows/build-and-push-simple.yml .github/workflows/build-and-push.yml
# Delete the old one if you want
rm .github/workflows/build-and-push-simple.yml
```

## Step 4: Test the Workflow

1. Make a change to any file in `services/` or `frontend/`
2. Commit and push to `master` or `main`:
   ```bash
   git add .
   git commit -m "Test CI/CD"
   git push origin master
   ```
3. Go to **Actions** tab in GitHub to see the workflow run
4. Verify images are pushed to ACR:
   ```bash
   az acr repository list --name acrstudojo
   az acr repository show-tags --name acrstudojo --repository control-plane
   ```

## Workflow Details

### Trigger Conditions
- Pushes to `master` or `main` branch
- Changes in `services/**` or `frontend/**` directories
- Changes to the workflow file itself

### Image Tags
Each image is tagged with:
- `latest` - Always points to the most recent build
- `<commit-sha>` - Specific commit SHA for versioning

Example:
- `acrstudojo.azurecr.io/control-plane:latest`
- `acrstudojo.azurecr.io/control-plane:abc123def456`

### Build Contexts
- **Control Plane**: `./services/control-plane`
- **Resume Service**: `./services/resume-svc`
- **Assignment Gen Worker**: `./services/assignment-gen-worker`
- **Resume Worker**: `./services/resume-worker`
- **Frontend**: `./frontend` (with build arg `VITE_CONTROL_PLANE_URL`)

## Troubleshooting

### Workflow fails with "Authentication failed"
- Verify all GitHub secrets are set correctly
- Check that service principal has `AcrPush` role on ACR
- Verify subscription ID matches your Azure account

### Images not building
- Check workflow logs in GitHub Actions
- Verify Dockerfile exists in the service directory
- Check that paths in workflow match your directory structure

### Frontend build fails
- Verify `VITE_CONTROL_PLANE_URL` secret is set (or uses default)
- Check that the control plane API URL is accessible

### Service principal permissions
If you need to check or update permissions:

```bash
# Check current role assignments
az role assignment list --assignee <SP_APP_ID> --scope <ACR_ID>

# Add AcrPush role if missing
az role assignment create \
  --assignee <SP_APP_ID> \
  --role AcrPush \
  --scope <ACR_ID>
```

## Security Best Practices

1. **Never commit secrets** - Always use GitHub Secrets
2. **Rotate credentials regularly** - Reset service principal password periodically
3. **Use least privilege** - Service principal only needs `AcrPush` on ACR, not full contributor access
4. **Monitor access** - Review Azure AD logs for service principal activity

## Next Steps

After CI/CD is set up:
1. Update Kubernetes deployments to use new images
2. Set up automated deployments (GitOps, ArgoCD, etc.)
3. Add image scanning for security vulnerabilities
4. Set up notifications for build failures

## References

- [Azure Service Principals](https://docs.microsoft.com/en-us/azure/active-directory/develop/app-objects-and-service-principals)
- [ACR Authentication](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication)
- [GitHub Actions](https://docs.github.com/en/actions)

