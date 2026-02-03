#!/bin/bash
# Force certificate renewal by cleaning up stuck challenges and certificate requests
# Use this if certificates are stuck in pending state

set -e

CERT_NAME="studojo-main-tls"
NAMESPACE="studojo"

echo "🔧 Forcing certificate renewal for studojo.com..."
echo ""

# Step 1: Delete stuck challenges
echo "🗑️  Cleaning up stuck ACME challenges..."
kubectl delete challenge -n $NAMESPACE --all --ignore-not-found=true
echo "✅ Challenges deleted"
echo ""

# Step 2: Delete certificate requests (cert-manager will recreate them)
echo "🗑️  Cleaning up certificate requests..."
kubectl delete certificaterequest -n $NAMESPACE --all --ignore-not-found=true
echo "✅ Certificate requests deleted"
echo ""

# Step 3: Delete the certificate to force complete re-issuance
echo "🗑️  Deleting certificate to force re-issuance..."
kubectl delete certificate $CERT_NAME -n $NAMESPACE --ignore-not-found=true
echo "✅ Certificate deleted"
echo ""

# Step 4: Wait a moment
echo "⏳ Waiting 10 seconds for cleanup..."
sleep 10
echo ""

# Step 5: Recreate the certificate
echo "🆕 Recreating certificate..."
kubectl apply -f k8s/cert-manager/certificate.yaml
echo "✅ Certificate recreated"
echo ""

# Step 6: Show status
echo "📊 Certificate status:"
kubectl get certificate $CERT_NAME -n $NAMESPACE
echo ""

echo "⏳ Waiting 30 seconds for cert-manager to start processing..."
sleep 30

echo ""
echo "📋 Current challenges:"
kubectl get challenge -n $NAMESPACE 2>/dev/null | head -10 || echo "No challenges yet (this is normal, they'll appear shortly)"
echo ""

echo "📋 Current certificate requests:"
kubectl get certificaterequest -n $NAMESPACE 2>/dev/null | grep $CERT_NAME || echo "No certificate requests yet"
echo ""

echo "✅ Certificate renewal initiated!"
echo ""
echo "💡 Monitor progress with:"
echo "  kubectl get certificate $CERT_NAME -n $NAMESPACE -w"
echo "  kubectl get challenge -n $NAMESPACE -w"
echo "  kubectl describe certificate $CERT_NAME -n $NAMESPACE"
echo ""
echo "⚠️  Note: Certificates will only be issued if:"
echo "  1. DNS for studojo.com points to your ingress"
echo "  2. The ingress can be reached from the internet"
echo "  3. Let's Encrypt can complete the HTTP-01 challenge"

