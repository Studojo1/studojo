#!/bin/bash
# Verify SSL certificate for dev.studojo.com

echo "🔍 Verifying SSL certificate for dev.studojo.com"
echo "================================================"
echo ""

# Check certificate resource
echo "1. Certificate Resource:"
kubectl get certificate dev-studojo-com-tls -n studojo
echo ""

# Check secret
echo "2. TLS Secret:"
kubectl get secret dev-studojo-com-tls-secret -n studojo
echo ""

# Check ingress TLS config
echo "3. Ingress TLS Configuration:"
kubectl get ingress studojo-ingress -n studojo -o jsonpath='{.spec.tls[*]}' | jq -r 'select(.hosts[]? == "dev.studojo.com")'
echo ""

# Check ingress rules
echo "4. Ingress Rules for dev.studojo.com:"
kubectl get ingress studojo-ingress -n studojo -o jsonpath='{.spec.rules[?(@.host=="dev.studojo.com")]}' | jq .
echo ""

# Check certificate details
echo "5. Certificate Details:"
kubectl get secret dev-studojo-com-tls-secret -n studojo -o jsonpath='{.data.tls\.crt}' | base64 -d | openssl x509 -noout -subject -issuer -dates 2>/dev/null || echo "Failed to read certificate"
echo ""

# Test from cluster
echo "6. Testing HTTPS connection (from cluster):"
INGRESS_IP=$(kubectl get ingress studojo-ingress -n studojo -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null)
INGRESS_HOSTNAME=$(kubectl get ingress studojo-ingress -n studojo -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null)

if [ -n "$INGRESS_IP" ] || [ -n "$INGRESS_HOSTNAME" ]; then
    echo "   Ingress IP/Hostname: $INGRESS_IP$INGRESS_HOSTNAME"
    echo "   Run this from your local machine:"
    echo "   curl -vI https://dev.studojo.com"
else
    echo "   ⚠ Could not determine ingress IP/hostname"
fi

echo ""
echo "✅ Verification complete!"
echo ""
echo "If certificate errors persist:"
echo "  1. Clear browser cache or use incognito mode"
echo "  2. Wait 2-3 minutes for changes to propagate"
echo "  3. Check DNS: dig dev.studojo.com"
echo "  4. Verify DNS points to ingress IP: $INGRESS_IP$INGRESS_HOSTNAME"

