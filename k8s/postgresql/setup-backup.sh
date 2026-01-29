#!/bin/bash
# Setup PostgreSQL backup CronJob
# This script populates the backup secret with values from app-secrets

set -e

echo "🔧 Setting up PostgreSQL backup..."

# Get values from app-secrets
echo "📋 Retrieving secrets from app-secrets..."

POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.postgres-password}' | base64 -d)
AZURE_STORAGE_KEY=$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.azure-storage-account-key}' | base64 -d)

if [ -z "$POSTGRES_PASSWORD" ] || [ -z "$AZURE_STORAGE_KEY" ]; then
  echo "❌ Error: Could not retrieve secrets from app-secrets"
  exit 1
fi

# Create or update backup secret
echo "🔐 Creating backup secret..."

kubectl create secret generic postgres-backup-secret \
  --from-literal=AZURE_STORAGE_ACCOUNT_NAME=studojostorage \
  --from-literal=AZURE_STORAGE_ACCOUNT_KEY="$AZURE_STORAGE_KEY" \
  --from-literal=POSTGRES_HOST=postgres.studojo.svc.cluster.local \
  --from-literal=POSTGRES_PORT=5432 \
  --from-literal=POSTGRES_USER=studojo \
  --from-literal=POSTGRES_DB=postgres \
  --from-literal=POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  --namespace=studojo \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply CronJob
echo "📅 Applying backup CronJob..."
kubectl apply -f backup-cronjob.yaml

echo "✅ Backup setup complete!"
echo ""
echo "📊 Backup schedule: Daily at 2 AM UTC (7:30 AM IST)"
echo "💾 Backups stored in: Azure Blob Storage container 'postgres-backups'"
echo "🗑️  Retention: 30 days"
echo ""
echo "To test backup manually:"
echo "  kubectl create job --from=cronjob/postgres-backup postgres-backup-test-$(date +%s) -n studojo"
echo ""
echo "To view backups:"
echo "  az storage blob list --account-name studojostorage --container-name postgres-backups --auth-mode key"

