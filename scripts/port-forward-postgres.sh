#!/bin/bash
# Script to port-forward PostgreSQL from Kubernetes cluster to local machine
# This allows you to connect to the K8s PostgreSQL database using local database viewers
# Usage: ./scripts/port-forward-postgres.sh [local-port]
# Example: ./scripts/port-forward-postgres.sh 5432

set -e

NAMESPACE="studojo"
SERVICE_NAME="postgres"
LOCAL_PORT="${1:-5432}"
REMOTE_PORT="5432"

echo "🔌 Setting up port-forward for PostgreSQL..."
echo "   Namespace: $NAMESPACE"
echo "   Service: $SERVICE_NAME"
echo "   Local port: $LOCAL_PORT"
echo "   Remote port: $REMOTE_PORT"
echo ""

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed or not in PATH"
    exit 1
fi

# Check if the service exists
if ! kubectl get service "$SERVICE_NAME" -n "$NAMESPACE" &> /dev/null; then
    echo "❌ Service '$SERVICE_NAME' not found in namespace '$NAMESPACE'"
    echo "   Make sure PostgreSQL is deployed: kubectl get svc -n $NAMESPACE"
    exit 1
fi

# Get the postgres password from the secret (optional, for display)
POSTGRES_PASSWORD=""
if kubectl get secret app-secrets -n "$NAMESPACE" &> /dev/null; then
    POSTGRES_PASSWORD=$(kubectl get secret app-secrets -n "$NAMESPACE" -o jsonpath='{.data.postgres-password}' 2>/dev/null | base64 -d 2>/dev/null || echo "")
fi

echo "✅ Service found!"
echo ""
echo "📋 Connection details:"
echo "   Host: localhost"
echo "   Port: $LOCAL_PORT"
echo "   Database: postgres"
echo "   User: studojo"
if [ -n "$POSTGRES_PASSWORD" ]; then
    echo "   Password: $POSTGRES_PASSWORD"
else
    echo "   Password: (retrieve from secret: kubectl get secret app-secrets -n $NAMESPACE -o jsonpath='{.data.postgres-password}' | base64 -d)"
fi
echo ""
echo "🔗 Connection string:"
if [ -n "$POSTGRES_PASSWORD" ]; then
    echo "   postgresql://studojo:$POSTGRES_PASSWORD@localhost:$LOCAL_PORT/postgres"
else
    echo "   postgresql://studojo:<password>@localhost:$LOCAL_PORT/postgres"
fi
echo ""
echo "🚀 Starting port-forward..."
echo "   Press Ctrl+C to stop"
echo ""

# Start port-forwarding
kubectl port-forward -n "$NAMESPACE" "service/$SERVICE_NAME" "$LOCAL_PORT:$REMOTE_PORT"

