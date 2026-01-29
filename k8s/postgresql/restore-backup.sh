#!/bin/bash
# Restore PostgreSQL from backup stored in Azure Blob Storage
# Usage: ./restore-backup.sh <backup-filename.sql.gz>

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <backup-filename.sql.gz>"
  echo ""
  echo "Available backups:"
  az storage blob list \
    --account-name studojostorage \
    --container-name postgres-backups \
    --auth-mode key \
    --query "[].name" -o table
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="postgres-backups"

echo "🔄 Restoring from backup: $BACKUP_FILE"
echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 1
fi

# Get storage account key
AZURE_STORAGE_KEY=$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.azure-storage-account-key}' | base64 -d)
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n studojo -o jsonpath='{.data.postgres-password}' | base64 -d)

# Download backup
echo "📥 Downloading backup..."
TEMP_FILE="/tmp/restore-$(date +%s).sql.gz"
az storage blob download \
  --account-name studojostorage \
  --account-key "$AZURE_STORAGE_KEY" \
  --container-name "$CONTAINER_NAME" \
  --name "$BACKUP_FILE" \
  --file "$TEMP_FILE" \
  --auth-mode key

echo "📦 Extracting backup..."
gunzip "$TEMP_FILE"
SQL_FILE="${TEMP_FILE%.gz}"

# Get PostgreSQL pod name
PG_POD=$(kubectl get pods -n studojo -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$PG_POD" ]; then
  echo "❌ PostgreSQL pod not found"
  exit 1
fi

echo "🗄️  Restoring to PostgreSQL..."
# Copy SQL file to pod
kubectl cp "$SQL_FILE" "studojo/$PG_POD:/tmp/restore.sql"

# Restore database
kubectl exec -n studojo "$PG_POD" -- bash -c "
  PGPASSWORD='$POSTGRES_PASSWORD' psql -U studojo -d postgres < /tmp/restore.sql
"

# Cleanup
kubectl exec -n studojo "$PG_POD" -- rm /tmp/restore.sql
rm -f "$SQL_FILE"

echo "✅ Restore completed successfully!"

