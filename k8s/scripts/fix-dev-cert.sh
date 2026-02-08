#!/bin/bash
# Fix SSL certificate for dev.studojo.com
# This script ensures the certificate is properly configured and reloads the ingress

set -e

echo "🔧 Fixing SSL certificate for dev.studojo.com..."
echo ""

# 1. Verify certificate exists and is ready
echo "1. Checking certificate status..."
if kubectl get certificate dev-studojo-com-tls -n studojo &> /dev/null; then
    READY=$(kubectl get certificate dev-studojo-com-tls -n studojo -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    if [ "$READY" == "True" ]; then
        echo "   ✓ Certificate is ready"
    else
        echo "   ✗ Certificate is not ready"
        kubectl describe certificate dev-studojo-com-tls -n studojo | grep -A 5 "Conditions:"
        exit 1
    fi
else
    echo "   ✗ Certificate resource not found"
    exit 1
fi

# 2. Verify secret exists
echo "2. Checking TLS secret..."
if kubectl get secret dev-studojo-com-tls-secret -n studojo &> /dev/null; then
    echo "   ✓ TLS secret exists"
else
    echo "   ✗ TLS secret not found"
    exit 1
fi

# 3. Verify ingress includes dev.studojo.com in TLS
echo "3. Checking ingress TLS configuration..."
if kubectl get ingress studojo-ingress -n studojo -o jsonpath='{.spec.tls[*].hosts}' | grep -q "dev.studojo.com"; then
    echo "   ✓ dev.studojo.com found in ingress TLS config"
else
    echo "   ✗ dev.studojo.com NOT in ingress TLS config - updating..."
    kubectl apply -f ../ingress/ingress.yaml
    echo "   ✓ Ingress updated"
fi

# 4. Verify cert-manager annotation
echo "4. Checking cert-manager annotation..."
ANNOTATION=$(kubectl get ingress studojo-ingress -n studojo -o jsonpath='{.metadata.annotations.cert-manager\.io/cluster-issuer}')
if [ "$ANNOTATION" == "letsencrypt-prod" ]; then
    echo "   ✓ cert-manager annotation is correct"
else
    echo "   ⚠ Setting cert-manager annotation..."
    kubectl annotate ingress studojo-ingress -n studojo cert-manager.io/cluster-issuer=letsencrypt-prod --overwrite
    echo "   ✓ Annotation set"
fi

# 5. Restart ingress controller to pick up new certificate
echo "5. Restarting ingress controller..."
INGRESS_NS=$(kubectl get ingressclass nginx -o jsonpath='{.metadata.annotations.ingressclass\.kubernetes\.io/controller-namespace}' 2>/dev/null || echo "ingress-nginx")
echo "   Using namespace: $INGRESS_NS"
kubectl delete pod -n $INGRESS_NS -l app.kubernetes.io/component=controller --wait=false
echo "   ✓ Ingress controller pods restarted"

# 6. Wait for pods to be ready
echo "6. Waiting for ingress controller to be ready..."
sleep 5
kubectl wait --for=condition=ready pod -n $INGRESS_NS -l app.kubernetes.io/component=controller --timeout=60s || {
    echo "   ⚠ Ingress controller not ready yet, but continuing..."
}

echo ""
echo "✅ Certificate fix complete!"
echo ""
echo "Next steps:"
echo "  1. Wait 1-2 minutes for the ingress controller to fully reload"
echo "  2. Clear your browser cache or try incognito mode"
echo "  3. Verify with: curl -vI https://dev.studojo.com"
echo ""
echo "If issues persist, check:"
echo "  kubectl describe ingress studojo-ingress -n studojo"
echo "  kubectl logs -n $INGRESS_NS -l app.kubernetes.io/component=controller --tail=50"

