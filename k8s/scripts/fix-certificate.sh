#!/bin/bash
# Script to check and fix certificate issues for studojo.com
# This will check certificate status and force re-issuance if needed

set -e

CERT_NAME="studojo-main-tls"
NAMESPACE="studojo"

echo "🔍 Checking certificate status for studojo.com..."

# Check if certificate exists
if ! kubectl get certificate $CERT_NAME -n $NAMESPACE &>/dev/null; then
    echo "❌ Certificate $CERT_NAME not found. Creating it..."
    kubectl apply -f k8s/cert-manager/certificate.yaml
    echo "✅ Certificate created. Waiting for issuance..."
    sleep 5
fi

# Check certificate status
echo ""
echo "📋 Current certificate status:"
kubectl get certificate $CERT_NAME -n $NAMESPACE -o yaml | grep -A 10 "status:" || echo "No status yet"

# Check certificate conditions
echo ""
echo "📊 Certificate conditions:"
kubectl get certificate $CERT_NAME -n $NAMESPACE -o jsonpath='{.status.conditions[*]}' 2>/dev/null || echo "No conditions yet"
echo ""

# Check if certificate is ready
READY=$(kubectl get certificate $CERT_NAME -n $NAMESPACE -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}' 2>/dev/null || echo "Unknown")

if [ "$READY" == "True" ]; then
    echo "✅ Certificate is ready!"
    
    # Check the secret
    echo ""
    echo "🔐 Checking TLS secret..."
    if kubectl get secret studojo-tls-secret -n $NAMESPACE &>/dev/null; then
        echo "✅ TLS secret exists"
        
        # Show certificate expiry
        echo ""
        echo "📅 Certificate expiry:"
        kubectl get certificate $CERT_NAME -n $NAMESPACE -o jsonpath='{.status.notAfter}' 2>/dev/null || echo "Not available"
        echo ""
    else
        echo "⚠️  TLS secret not found. Certificate may still be provisioning..."
    fi
else
    echo "⚠️  Certificate is not ready. Status: $READY"
    echo ""
    echo "🔧 Attempting to fix..."
    
    # Check for certificate request
    echo "Checking CertificateRequest..."
    kubectl get certificaterequest -n $NAMESPACE | grep $CERT_NAME || echo "No CertificateRequest found"
    
    # Check for challenge
    echo ""
    echo "Checking ACME challenges..."
    kubectl get challenge -n $NAMESPACE 2>/dev/null | head -5 || echo "No challenges found"
    
    # Delete and recreate certificate to force re-issuance
    echo ""
    read -p "Do you want to delete and recreate the certificate to force re-issuance? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting certificate..."
        kubectl delete certificate $CERT_NAME -n $NAMESPACE --ignore-not-found=true
        
        echo "⏳ Waiting 5 seconds..."
        sleep 5
        
        echo "🆕 Recreating certificate..."
        kubectl apply -f k8s/cert-manager/certificate.yaml
        
        echo "✅ Certificate recreated. It may take a few minutes to issue."
        echo ""
        echo "📊 Monitor progress with:"
        echo "  kubectl get certificate $CERT_NAME -n $NAMESPACE -w"
        echo ""
        echo "  kubectl describe certificate $CERT_NAME -n $NAMESPACE"
    fi
fi

echo ""
echo "🔍 Checking ingress TLS configuration..."
kubectl get ingress studojo-ingress -n $NAMESPACE -o yaml | grep -A 5 "tls:" || echo "No TLS config found in ingress"

echo ""
echo "💡 Useful commands:"
echo "  kubectl get certificate $CERT_NAME -n $NAMESPACE"
echo "  kubectl describe certificate $CERT_NAME -n $NAMESPACE"
echo "  kubectl get certificaterequest -n $NAMESPACE"
echo "  kubectl get challenge -n $NAMESPACE"
echo "  kubectl logs -n cert-manager -l app=cert-manager --tail=50"

