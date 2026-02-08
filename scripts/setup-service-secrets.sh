#!/bin/bash
# Setup secrets for services via Azure Key Vault and GitHub
# Usage: ./setup-service-secrets.sh <service-name> <key-vault-name> <github-repo>

set -e

SERVICE_NAME=$1
KEY_VAULT_NAME=$2
GITHUB_REPO=$3
GITHUB_TOKEN=${GITHUB_TOKEN:-""}

if [ -z "$SERVICE_NAME" ] || [ -z "$KEY_VAULT_NAME" ] || [ -z "$GITHUB_REPO" ]; then
    echo "Usage: $0 <service-name> <key-vault-name> <github-repo>"
    echo "Example: $0 frontend studojo-kv owner/repo"
    exit 1
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Warning: GITHUB_TOKEN not set. GitHub secrets will not be updated."
    echo "Set GITHUB_TOKEN environment variable to enable GitHub secret updates."
fi

echo "Setting up secrets for service: $SERVICE_NAME"
echo "Key Vault: $KEY_VAULT_NAME"
echo "GitHub Repo: $GITHUB_REPO"

# Common secrets that all services need
COMMON_SECRETS=(
    "AZURE_CLIENT_ID"
    "AZURE_TENANT_ID"
    "AZURE_SUBSCRIPTION_ID"
    "AZURE_CLIENT_SECRET"
    "KUBECONFIG"
)

# Service-specific secrets
declare -A SERVICE_SECRETS
SERVICE_SECRETS[frontend]="VITE_CONTROL_PLANE_URL"
SERVICE_SECRETS[control-plane]="DATABASE_URL RABBITMQ_URL JWKS_URL CORS_ORIGINS RAZORPAY_KEY_ID RAZORPAY_KEY_SECRET"
SERVICE_SECRETS[emailer-service]="DATABASE_URL RABBITMQ_URL AZURE_COMMUNICATION_SERVICE_CONNECTION_STRING AZURE_EMAIL_SENDER_ADDRESS FRONTEND_URL"
SERVICE_SECRETS[resume-service]=""
SERVICE_SECRETS[assignment-gen-worker]="RABBITMQ_URL RESULTS_EXCHANGE AZURE_STORAGE_ACCOUNT_NAME AZURE_STORAGE_ACCOUNT_KEY OPENAI_API_KEY ANTHROPIC_API_KEY REPHRASY_API_KEY"
SERVICE_SECRETS[resume-worker]="RABBITMQ_URL RESULTS_EXCHANGE AZURE_STORAGE_ACCOUNT_NAME AZURE_STORAGE_ACCOUNT_KEY RESUME_SERVICE_URL"
SERVICE_SECRETS[humanizer-svc]="REPHRASY_API_KEY OPENAI_API_KEY AZURE_STORAGE_ACCOUNT_NAME AZURE_STORAGE_ACCOUNT_KEY REDIS_PASSWORD"
SERVICE_SECRETS[humanizer-worker]="RABBITMQ_URL RESULTS_EXCHANGE AZURE_STORAGE_ACCOUNT_NAME AZURE_STORAGE_ACCOUNT_KEY HUMANIZER_SERVICE_URL"

# Function to set secret in Azure Key Vault
set_keyvault_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$secret_value" ]; then
        echo "Warning: $secret_name is empty, skipping Key Vault"
        return
    fi
    
    echo "Setting $secret_name in Key Vault..."
    az keyvault secret set \
        --vault-name "$KEY_VAULT_NAME" \
        --name "${SERVICE_NAME}-${secret_name}" \
        --value "$secret_value" \
        --output none || echo "Failed to set $secret_name in Key Vault"
}

# Function to set secret in GitHub
set_github_secret() {
    local secret_name=$1
    local secret_value=$2
    
    if [ -z "$GITHUB_TOKEN" ] || [ -z "$secret_value" ]; then
        return
    fi
    
    echo "Setting $secret_name in GitHub..."
    
    # Get public key for encryption
    PUBLIC_KEY_RESPONSE=$(curl -s -H "Authorization: token $GITHUB_TOKEN" \
        "https://api.github.com/repos/$GITHUB_REPO/actions/secrets/public-key")
    
    KEY_ID=$(echo "$PUBLIC_KEY_RESPONSE" | jq -r '.key_id')
    PUBLIC_KEY=$(echo "$PUBLIC_KEY_RESPONSE" | jq -r '.key')
    
    if [ "$KEY_ID" == "null" ] || [ -z "$PUBLIC_KEY" ]; then
        echo "Failed to get GitHub public key"
        return
    fi
    
    # Encrypt secret using libsodium
    ENCRYPTED_VALUE=$(echo -n "$secret_value" | \
        openssl enc -base64 -A | \
        python3 -c "import sys, base64; from nacl import encoding, public; pubkey = public.PublicKey(base64.b64decode(sys.stdin.read().strip())); sealed = public.SealedBox(pubkey).encrypt(sys.stdin.buffer.read()); print(base64.b64encode(sealed).decode())" 2>/dev/null || \
        echo "Note: Install python3-nacl for GitHub secret encryption")
    
    if [ -z "$ENCRYPTED_VALUE" ] || [ "$ENCRYPTED_VALUE" == "Note: Install python3-nacl for GitHub secret encryption" ]; then
        echo "Warning: Cannot encrypt secret for GitHub. Install python3-nacl or set manually."
        return
    fi
    
    # Set secret via GitHub API
    curl -X PUT \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.github.com/repos/$GITHUB_REPO/actions/secrets/$secret_name" \
        -d "{\"encrypted_value\":\"$ENCRYPTED_VALUE\",\"key_id\":\"$KEY_ID\"}" \
        --silent --output /dev/null --write-out "%{http_code}" | grep -q "201\|204" && \
        echo "✓ Set $secret_name in GitHub" || \
        echo "✗ Failed to set $secret_name in GitHub"
}

# Set common secrets
echo ""
echo "=== Setting Common Secrets ==="
for secret in "${COMMON_SECRETS[@]}"; do
    read -sp "Enter value for $secret: " secret_value
    echo ""
    
    set_keyvault_secret "$secret" "$secret_value"
    set_github_secret "$secret" "$secret_value"
done

# Set service-specific secrets
SERVICE_SPECIFIC=${SERVICE_SECRETS[$SERVICE_NAME]}
if [ -n "$SERVICE_SPECIFIC" ]; then
    echo ""
    echo "=== Setting Service-Specific Secrets ==="
    for secret in $SERVICE_SPECIFIC; do
        read -sp "Enter value for $secret: " secret_value
        echo ""
        
        set_keyvault_secret "$secret" "$secret_value"
        set_github_secret "$secret" "$secret_value"
    done
fi

echo ""
echo "=== Optional: Dev Panel Webhook ==="
read -p "Enter Dev Panel webhook URL (optional): " webhook_url
if [ -n "$webhook_url" ]; then
    set_github_secret "DEV_PANEL_WEBHOOK_URL" "$webhook_url"
fi

echo ""
echo "✓ Secret setup complete for $SERVICE_NAME"
echo ""
echo "Note: Some secrets may need to be set manually in GitHub if encryption failed."
echo "You can also retrieve secrets from Key Vault:"
echo "  az keyvault secret show --vault-name $KEY_VAULT_NAME --name ${SERVICE_NAME}-<SECRET_NAME>"

