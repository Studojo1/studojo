#!/bin/bash
set -e

# Manual setup script for Azure Service Principal when you have limited IAM permissions
# This script guides you through creating a service principal with minimal permissions

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔐 Manual Azure Service Principal Setup for CI/CD${NC}\n"
echo -e "${YELLOW}This script works around IAM permission limitations.${NC}\n"

# Configuration
RESOURCE_GROUP="${RESOURCE_GROUP:-studojo-rg}"
ACR_NAME="${ACR_NAME:-acrstudojo}"
SP_NAME="${SP_NAME:-studojo-ci-cd}"

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed.${NC}"
    exit 1
fi

# Check if logged in
if ! az account show &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Azure. Logging in...${NC}"
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
TENANT_ID=$(az account show --query tenantId -o tsv)

echo -e "${GREEN}✓ Subscription: $SUBSCRIPTION_ID${NC}"
echo -e "${GREEN}✓ Tenant: $TENANT_ID${NC}\n"

# List available resource groups
echo -e "${BLUE}📋 Resource groups you have access to:${NC}"
az group list --query "[].{Name:name, Location:location}" -o table
echo ""

# Ask for resource group
read -p "Enter resource group name (or press Enter for '$RESOURCE_GROUP'): " INPUT_RG
if [ -n "$INPUT_RG" ]; then
    RESOURCE_GROUP="$INPUT_RG"
fi

# Verify resource group exists
if ! az group show --name "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${RED}❌ Resource group '$RESOURCE_GROUP' not found or no access.${NC}"
    echo -e "${YELLOW}💡 Ask an admin to create it or use an existing one from the list above.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using resource group: $RESOURCE_GROUP${NC}\n"

# Check ACR
read -p "Enter ACR name (or press Enter for '$ACR_NAME'): " INPUT_ACR
if [ -n "$INPUT_ACR" ]; then
    ACR_NAME="$INPUT_ACR"
fi

if ! az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" &> /dev/null; then
    echo -e "${YELLOW}⚠️  ACR '$ACR_NAME' not found in '$RESOURCE_GROUP'.${NC}"
    echo -e "${YELLOW}💡 Ask an admin to create it:${NC}"
    echo -e "   az acr create --resource-group $RESOURCE_GROUP --name $ACR_NAME --sku Basic"
    exit 1
fi

ACR_ID=$(az acr show --name "$ACR_NAME" --resource-group "$RESOURCE_GROUP" --query id -o tsv)
echo -e "${GREEN}✓ ACR found: $ACR_NAME${NC}\n"

# Check if service principal exists
SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv 2>/dev/null || echo "")

if [ -n "$SP_APP_ID" ] && [ "$SP_APP_ID" != "null" ]; then
    echo -e "${YELLOW}⚠️  Service principal '$SP_NAME' already exists.${NC}"
    read -p "Use existing? (Y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Nn]$ ]]; then
        read -p "Enter new service principal name: " SP_NAME
        SP_APP_ID=""
    fi
fi

# Create service principal
if [ -z "$SP_APP_ID" ] || [ "$SP_APP_ID" == "null" ]; then
    echo -e "${YELLOW}📝 Creating service principal '$SP_NAME'...${NC}"
    
    # Try creating with skip-assignment (minimal permissions needed)
    SP_OUTPUT=$(az ad sp create-for-rbac \
        --name "$SP_NAME" \
        --skip-assignment \
        --sdk-auth 2>&1)
    
    if echo "$SP_OUTPUT" | grep -q "clientId"; then
        SP_APP_ID=$(echo "$SP_OUTPUT" | grep -o '"clientId": "[^"]*' | cut -d'"' -f4)
        SP_PASSWORD=$(echo "$SP_OUTPUT" | grep -o '"clientSecret": "[^"]*' | cut -d'"' -f4)
        echo -e "${GREEN}✓ Service principal created${NC}"
    else
        echo -e "${RED}❌ Failed to create service principal:${NC}"
        echo "$SP_OUTPUT"
        echo -e "\n${YELLOW}💡 You may need 'Application Administrator' role in Azure AD.${NC}"
        echo -e "${YELLOW}   Or ask an admin to run:${NC}"
        echo -e "   az ad sp create-for-rbac --name $SP_NAME --skip-assignment"
        exit 1
    fi
else
    echo -e "${GREEN}✓ Using existing service principal${NC}"
    SP_APP_ID=$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv)
    
    read -p "Reset password? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        SP_PASSWORD=$(az ad sp credential reset --id "$SP_APP_ID" --query password -o tsv)
        echo -e "${GREEN}✓ Password reset${NC}"
    else
        SP_PASSWORD="<EXISTING_PASSWORD>"
        echo -e "${YELLOW}⚠️  You'll need to retrieve the password manually if needed.${NC}"
    fi
fi

echo -e "\n${YELLOW}🔑 Assigning AcrPush role...${NC}"

# Try to assign AcrPush role
if az role assignment create \
    --assignee "$SP_APP_ID" \
    --role AcrPush \
    --scope "$ACR_ID" \
    --output none 2>/dev/null; then
    echo -e "${GREEN}✓ AcrPush role assigned${NC}"
else
    # Check if already assigned
    ASSIGNMENT=$(az role assignment list \
        --assignee "$SP_APP_ID" \
        --scope "$ACR_ID" \
        --role AcrPush \
        --query "[].id" -o tsv 2>/dev/null)
    
    if [ -n "$ASSIGNMENT" ]; then
        echo -e "${GREEN}✓ AcrPush role already assigned${NC}"
    else
        echo -e "${YELLOW}⚠️  Could not assign AcrPush role automatically.${NC}"
        echo -e "${BLUE}📋 Run this command (or ask an admin):${NC}"
        echo ""
        echo -e "az role assignment create \\"
        echo -e "  --assignee $SP_APP_ID \\"
        echo -e "  --role AcrPush \\"
        echo -e "  --scope $ACR_ID"
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
echo -e "${YELLOW}📋 Add these secrets to GitHub:${NC}"
echo -e "   Repository Settings → Secrets and variables → Actions\n"
echo -e "${GREEN}AZURE_CLIENT_ID${NC}=$SP_APP_ID"
echo -e "${GREEN}AZURE_TENANT_ID${NC}=$TENANT_ID"
echo -e "${GREEN}AZURE_SUBSCRIPTION_ID${NC}=$SUBSCRIPTION_ID"
if [ "$SP_PASSWORD" != "<EXISTING_PASSWORD>" ]; then
    echo -e "${GREEN}AZURE_CLIENT_SECRET${NC}=$SP_PASSWORD"
fi
echo -e "\n${YELLOW}Optional:${NC}"
echo -e "${GREEN}VITE_CONTROL_PLANE_URL${NC}=https://api.studojo.com"
echo -e "\n${RED}⚠️  IMPORTANT: Save AZURE_CLIENT_SECRET now!${NC}\n"

# Save to file
read -p "Save credentials to .github/.env.ci? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    mkdir -p .github
    cat > .github/.env.ci <<EOF
# Azure Service Principal Credentials for CI/CD
# DO NOT COMMIT THIS FILE TO GIT
AZURE_CLIENT_ID=$SP_APP_ID
AZURE_TENANT_ID=$TENANT_ID
AZURE_SUBSCRIPTION_ID=$SUBSCRIPTION_ID
AZURE_CLIENT_SECRET=$SP_PASSWORD
VITE_CONTROL_PLANE_URL=https://api.studojo.com
EOF
    echo -e "${GREEN}✓ Saved to .github/.env.ci${NC}"
fi

echo -e "\n${GREEN}🎉 Done!${NC}"

