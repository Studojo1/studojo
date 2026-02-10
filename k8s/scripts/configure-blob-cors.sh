#!/bin/bash
# Configure CORS on Azure Blob Storage for direct frontend uploads
# This allows the frontend to upload files directly to Azure Blob Storage

set -e

echo "🔧 Configuring CORS on Azure Blob Storage..."

# Get storage account name from secrets
STORAGE_ACCOUNT=$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.azure-storage-account-name}' | base64 -d)

if [ -z "$STORAGE_ACCOUNT" ]; then
  echo "❌ Error: Could not retrieve storage account name from secrets"
  exit 1
fi

echo "📦 Storage Account: $STORAGE_ACCOUNT"
echo ""

# Configure CORS for Blob service
# Allow origins: https://studojo.com, https://www.studojo.com
# Allow methods: PUT, GET, HEAD, OPTIONS
# Allow headers: x-ms-blob-type, Content-Type, x-ms-version
# Max age: 3600 seconds (1 hour)

az storage cors add \
  --services b \
  --methods PUT GET HEAD OPTIONS \
  --origins "https://studojo.com" "https://www.studojo.com" \
  --allowed-headers "x-ms-blob-type" "Content-Type" "x-ms-version" "x-ms-date" "Authorization" \
  --exposed-headers "x-ms-request-id" "ETag" \
  --max-age 3600 \
  --account-name "$STORAGE_ACCOUNT" \
  --account-key "$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.azure-storage-account-key}' | base64 -d)"

echo ""
echo "✅ CORS configured successfully!"
echo ""
echo "Allowed origins:"
echo "  - https://studojo.com"
echo "  - https://www.studojo.com"
echo ""
echo "Allowed methods: PUT, GET, HEAD, OPTIONS"
echo "Max age: 3600 seconds"
echo ""
echo "To verify CORS settings:"
echo "  az storage cors list --services b --account-name $STORAGE_ACCOUNT --account-key \$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.azure-storage-account-key}' | base64 -d)"

