#!/bin/bash
set -e

# Script to create Azure Service Principal for CI/CD with proper IAM permissions
# This service principal will be used by GitHub Actions to push images to ACR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Setting up Azure Service Principal for CI/CD${NC}\n"

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-studojo-rg}"
ACR_NAME="${ACR_NAME:-acrstudojo}"
SP_NAME="${SP_NAME:-studojo-ci-cd}"
SUBSCRIPTION_ID="${SUBSCRIPTION_ID:-}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Logging in...${NC}"
    az login
fi

# Get subscription ID if not provided
if [ -z "$SUBSCRIPTION_ID" ]; then
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    echo -e "${GREEN}✓ Using subscription: $SUBSCRIPTION_ID${NC}"
else
    az account set --subscription "$SUBSCRIPTION_ID"
fi

# Check if resource group exists
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}⚠️  Resource group '$RESOURCE_GROUP' does not exist.${NC}"
    echo -e "${YELLOW}📋 Available resource groups you have access to:${NC}"
    az group list --query "[].{Name:name, Location:location}" -o table 2>/dev/null || echo "Unable to list resource groups"
    echo ""
    read -p "Use an existing resource group? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter resource group name: " RESOURCE_GROUP
        if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
            echo -e "${RED}❌ Resource group '$RESOURCE_GROUP' not found or you don't have access.${NC}"
            exit 1
        fi
        echo -e "${GREEN}✓ Using resource group: $RESOURCE_GROUP${NC}"
    else
        echo -e "${YELLOW}⚠️  Cannot create resource group (insufficient permissions).${NC}"
        echo -e "${YELLOW}💡 Options:${NC}"
        echo -e "   1. Ask an admin to create '$RESOURCE_GROUP'"
        echo -e "   2. Use an existing resource group you have access to"
        echo -e "   3. Continue anyway if resource group will be created separately"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        echo -e "${YELLOW}⚠️  Continuing without verifying resource group exists.${NC}"
        echo -e "${YELLOW}   Make sure '$RESOURCE_GROUP' exists before proceeding.${NC}"
    fi
else
    echo -e "${GREEN}✓ Resource group '$RESOURCE_GROUP' exists${NC}"
fi

# Check if ACR exists
if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}⚠️  ACR '$ACR_NAME' does not exist in resource group '$RESOURCE_GROUP'.${NC}"
    read -p "Create it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        az acr create --resource-group "$RESOURCE_GROUP" --name "$ACR_NAME" --sku Basic
    else
        echo -e "${RED}❌ Exiting. Please create the ACR first.${NC}"
        exit 1
    fi
fi

# Check if service principal already exists
SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$SP_APP_ID" ] && [ "$SP_APP_ID" != "null" ]; then
    echo -e "${YELLOW}⚠️  Service principal '$SP_NAME' already exists.${NC}"
    read -p "Delete and recreate? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}🗑️  Deleting existing service principal...${NC}"
        az ad sp delete --id "$SP_APP_ID" || true
        SP_APP_ID=""
    else
        echo -e "${GREEN}✓ Using existing service principal${NC}"
    fi
fi

# Create service principal if it doesn't exist
if [ -z "$SP_APP_ID" ] || [ "$SP_APP_ID" == "null" ]; then
    echo -e "${YELLOW}📝 Creating service principal '$SP_NAME'...${NC}"
    
    # Try to create with resource group scope first
    if az group show --name "$RESOURCE_GROUP" &> /dev/null; then
        echo -e "${YELLOW}   Using resource group scope...${NC}"
        SP_OUTPUT=$(az ad sp create-for-rbac \
            --name "$SP_NAME" \
            --role contributor \
            --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
            --sdk-auth 2>&1)
    else
        # Fallback: create without scope, assign roles later
        echo -e "${YELLOW}   Creating without initial scope (will assign roles after)...${NC}"
        SP_OUTPUT=$(az ad sp create-for-rbac \
            --name "$SP_NAME" \
            --skip-assignment \
            --sdk-auth 2>&1)
    fi
    
    # Check if creation succeeded
    if echo "$SP_OUTPUT" | grep -q "clientId"; then
        SP_APP_ID=$(echo "$SP_OUTPUT" | grep -o '"clientId": "[^"]*' | cut -d'"' -f4)
        SP_PASSWORD=$(echo "$SP_OUTPUT" | grep -o '"clientSecret": "[^"]*' | cut -d'"' -f4)
        TENANT_ID=$(echo "$SP_OUTPUT" | grep -o '"tenantId": "[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Service principal created${NC}"
    else
        echo -e "${RED}❌ Failed to create service principal:${NC}"
        echo "$SP_OUTPUT"
        echo -e "\n${YELLOW}💡 You may need:${NC}"
        echo -e "   - 'Application Administrator' or 'Global Administrator' role in Azure AD"
        echo -e "   - Or ask an admin to create the service principal for you"
        exit 1
    fi
else
    # Get existing service principal details
    echo -e "${YELLOW}📝 Getting existing service principal details...${NC}"
    TENANT_ID=$(az account show --query tenantId -o tsv)
    
    # Reset password for existing SP
    read -p "Reset password for existing service principal? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SP_PASSWORD=$(az ad sp credential reset --id "$SP_APP_ID" --query password -o tsv)
        echo -e "${GREEN}✓ Password reset${NC}"
    else
        echo -e "${YELLOW}⚠️  Using existing password (you'll need to retrieve it manually)${NC}"
        SP_PASSWORD="<EXISTING_PASSWORD>"
    fi
fi

# Assign AcrPush role to service principal for ACR
echo -e "${YELLOW}🔑 Assigning AcrPush role to service principal...${NC}"
ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv 2>/dev/null)

if [ -z "$ACR_ID" ]; then
    echo -e "${RED}❌ ACR '$ACR_NAME' not found in resource group '$RESOURCE_GROUP'.${NC}"
    echo -e "${YELLOW}💡 Make sure ACR exists or create it first:${NC}"
    echo -e "   az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic"
    exit 1
fi

# Try to assign AcrPush role
if az role assignment create \
    --assignee "$SP_APP_ID" \
    --role AcrPush \
    --scope "$ACR_ID" \
    --output none 2>/dev/null; then
    echo -e "${GREEN}✓ AcrPush role assigned${NC}"
else
    ASSIGNMENT_EXISTS=$(az role assignment list \
        --assignee "$SP_APP_ID" \
        --scope "$ACR_ID" \
        --role AcrPush \
        --query "[].id" -o tsv 2>/dev/null)
    
    if [ -n "$ASSIGNMENT_EXISTS" ]; then
        echo -e "${GREEN}✓ AcrPush role already assigned${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not assign AcrPush role. You may need:${NC}"
        echo -e "   - 'User Access Administrator' or 'Owner' role on the ACR"
        echo -e "   - Or ask an admin to assign the role:"
        echo -e "     az role assignment create \\"
        echo -e "       --assignee $SP_APP_ID \\"
        echo -e "       --role AcrPush \\"
        echo -e "       --scope $ACR_ID"
        echo ""
        read -p "Continue anyway? (y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Output credentials
echo -e "\n${GREEN}✅ Setup complete!${NC}\n"
echo -e "${YELLOW}📋 Add these secrets to your GitHub repository:${NC}\n"
echo -e "Repository Settings → Secrets and variables → Actions → New repository secret\n"
echo -e "${GREEN}AZURE_CLIENT_ID${NC}=$SP_APP_ID"
echo -e "${GREEN}AZURE_TENANT_ID${NC}=$TENANT_ID"
echo -e "${GREEN}AZURE_SUBSCRIPTION_ID${NC}=$SUBSCRIPTION_ID"
if [ "$SP_PASSWORD" != "<EXISTING_PASSWORD>" ]; then
    echo -e "${GREEN}AZURE_CLIENT_SECRET${NC}=$SP_PASSWORD"
fi
echo -e "\n${YELLOW}Optional (for frontend build):${NC}"
echo -e "${GREEN}VITE_CONTROL_PLANE_URL${NC}=https://api.studojo.com"
echo -e "\n${YELLOW}⚠️  IMPORTANT: Save the AZURE_CLIENT_SECRET now - you won't be able to retrieve it later!${NC}\n"

# Save to file (optional, user can choose)
read -p "Save credentials to .env file? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ENV_FILE=".github/.env.ci"
    mkdir -p .github
    cat > "$ENV_FILE" <<EOF
# Azure Service Principal Credentials for CI/CD
# DO NOT COMMIT THIS FILE TO GIT
AZURE_CLIENT_ID=$SP_APP_ID
AZURE_TENANT_ID=$TENANT_ID
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_CLIENT_SECRET=$SP_PASSWORD
VITE_CONTROL_PLANE_URL=https://api.studojo.com
EOF
    echo -e "${GREEN}✓ Credentials saved to $ENV_FILE${NC}"
    echo -e "${RED}⚠️  Make sure $ENV_FILE is in .gitignore!${NC}"
fi

echo -e "\n${GREEN}🎉 Done! Your CI/CD is ready to use.${NC}"

