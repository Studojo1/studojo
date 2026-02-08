#!/bin/bash
# Check certificate status for dev.studojo.com

CERT_NAME="dev-studojo-com-tls"
NAMESPACE="studojo"

echo "📋 Certificate Status for dev.studojo.com"
echo "=========================================="
echo ""

echo "Certificate Resource:"
kubectl get certificate $CERT_NAME -n $NAMESPACE
echo ""

echo "Certificate Details:"
kubectl describe certificate $CERT_NAME -n $NAMESPACE
echo ""

echo "TLS Secret:"
kubectl get secret dev-studojo-com-tls-secret -n $NAMESPACE
echo ""

echo "Certificate Requests:"
kubectl get certificaterequest -n $NAMESPACE | grep dev
echo ""

echo "ACME Challenges:"
kubectl get challenge -n $NAMESPACE | grep dev || echo "No challenges found"
echo ""

echo "Ingress Status:"
kubectl get ingress studojo-ingress -n $NAMESPACE -o jsonpath='{.spec.tls[*].hosts}' | grep -q dev && echo "✓ dev.studojo.com found in ingress TLS config" || echo "✗ dev.studojo.com NOT found in ingress TLS config"

