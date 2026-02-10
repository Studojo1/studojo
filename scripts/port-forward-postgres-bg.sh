#!/bin/bash
# Script to port-forward PostgreSQL from Kubernetes cluster to local machine (background mode)
# This allows you to connect to the K8s PostgreSQL database using local database viewers
# Usage: ./scripts/port-forward-postgres-bg.sh [local-port]
# Example: ./scripts/port-forward-postgres-bg.sh 5432
# 
# To stop: pkill -f "kubectl port-forward.*postgres" or kill the PID shown

set -e

NAMESPACE="studojo"
SERVICE_NAME="postgres"
LOCAL_PORT="${1:-5432}"
REMOTE_PORT="5432"

echo "🔌 Setting up port-forward for PostgreSQL (background mode)..."
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

# Check if port-forward is already running
EXISTING_PF=$(pgrep -f "kubectl port-forward.*$SERVICE_NAME" || true)
if [ -n "$EXISTING_PF" ]; then
    echo "⚠️  Port-forward already running (PID: $EXISTING_PF)"
    echo "   Stopping existing port-forward..."
    pkill -f "kubectl port-forward.*$SERVICE_NAME" || true
    sleep 1
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

# Start port-forwarding in background
echo "🚀 Starting port-forward in background..."
kubectl port-forward -n "$NAMESPACE" "service/$SERVICE_NAME" "$LOCAL_PORT:$REMOTE_PORT" > /tmp/postgres-port-forward.log 2>&1 &
PF_PID=$!

# Wait a moment to check if it started successfully
sleep 2

if ps -p $PF_PID > /dev/null; then
    echo "✅ Port-forward started successfully (PID: $PF_PID)"
    echo ""
    echo "📝 Logs are being written to: /tmp/postgres-port-forward.log"
    echo ""
    echo "🛑 To stop the port-forward, run:"
    echo "   kill $PF_PID"
    echo "   or"
    echo "   pkill -f 'kubectl port-forward.*postgres'"
    echo ""
    echo "💡 You can now connect to PostgreSQL using your local database viewer!"
else
    echo "❌ Failed to start port-forward. Check logs:"
    cat /tmp/postgres-port-forward.log
    exit 1
fi









