#!/bin/bash
# Script to set a user as admin in the Kubernetes PostgreSQL database
# Usage: ./k8s/scripts/set-admin-user-k8s.sh <user-email>
# Example: ./k8s/scripts/set-admin-user-k8s.sh hi@rithul.dev

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <user-email>"
    echo "Example: $0 hi@rithul.dev"
    exit 1
fi

USER_EMAIL="$1"
NAMESPACE="studojo"

echo "🔐 Setting user '$USER_EMAIL' as admin in Kubernetes PostgreSQL..."

# Get the PostgreSQL pod name
PG_POD=$(kubectl get pods -n "$NAMESPACE" -l app=postgres -o jsonpath='{.items[0].metadata.name}')

if [ -z "$PG_POD" ]; then
    echo "❌ PostgreSQL pod not found in namespace '$NAMESPACE'"
    echo "   Make sure PostgreSQL is deployed: kubectl get pods -n $NAMESPACE -l app=postgres"
    exit 1
fi

echo "📦 Found PostgreSQL pod: $PG_POD"

# Get the postgres password from the secret
POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n "$NAMESPACE" -o jsonpath='{.data.postgres-password}' | base64 -d)

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Could not retrieve postgres-password from app-secrets"
    exit 1
fi

# Execute the SQL command to set user as admin
echo "🔄 Updating user role to admin..."
kubectl exec -n "$NAMESPACE" "$PG_POD" -- \
    env PGPASSWORD="$POSTGRES_PASSWORD" \
    psql -U studojo -d postgres -c "UPDATE \"user\" SET role = 'admin' WHERE email = '$USER_EMAIL';"

if [ $? -eq 0 ]; then
    echo "✅ User '$USER_EMAIL' has been set as admin"
    echo ""
    echo "📋 Verifying admin users:"
    kubectl exec -n "$NAMESPACE" "$PG_POD" -- \
        env PGPASSWORD="$POSTGRES_PASSWORD" \
        psql -U studojo -d postgres -c "SELECT id, name, email, role FROM \"user\" WHERE role = 'admin';"
else
    echo "❌ Failed to set user as admin. Make sure the email exists in the database."
    exit 1
fi


























