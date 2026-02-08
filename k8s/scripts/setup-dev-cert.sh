#!/bin/bash
# Setup SSL certificate for dev.studojo.com
# This script applies the cert-manager Certificate resource

set -e

echo "🔐 Setting up SSL certificate for dev.studojo.com..."

# Check if cert-manager is installed
if ! kubectl get crd certificates.cert-manager.io &> /dev/null; then
    echo "❌ cert-manager is not installed. Please install it first:"
    echo "   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml"
    exit 1
fi

# Apply the certificate resource
echo "📝 Applying Certificate resource..."
kubectl apply -f ../cert-manager/certificate.yaml

# Wait for certificate to be ready
echo "⏳ Waiting for certificate to be issued (this may take a few minutes)..."
kubectl wait --for=condition=Ready certificate/dev-studojo-com-tls -n studojo --timeout=5m || {
    echo "⚠️  Certificate not ready yet. Check status with:"
    echo "   kubectl describe certificate dev-studojo-com-tls -n studojo"
    echo "   kubectl get certificaterequest -n studojo"
    echo "   kubectl get challenge -n studojo"
    exit 1
}

echo "✅ Certificate is ready!"
echo ""
echo "Verify with:"
echo "  kubectl get certificate dev-studojo-com-tls -n studojo"
echo "  kubectl get secret dev-studojo-com-tls-secret -n studojo"
echo ""
echo "Check certificate details:"
echo "  kubectl describe certificate dev-studojo-com-tls -n studojo"

