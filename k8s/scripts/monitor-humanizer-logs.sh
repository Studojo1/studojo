#!/bin/bash
# Monitor humanizer service logs in real-time
# Usage: ./monitor-humanizer-logs.sh [service]
#   service: svc, worker, or all (default: all)

set -e

SERVICE=${1:-all}

case $SERVICE in
  svc)
    echo "📋 Monitoring Humanizer Service logs..."
    kubectl logs -n studojo -l app=humanizer-svc -f
    ;;
  worker)
    echo "📋 Monitoring Humanizer Worker logs..."
    kubectl logs -n studojo -l app=humanizer-worker -f
    ;;
  all)
    echo "📋 Monitoring all Humanizer logs..."
    kubectl logs -n studojo -l 'app in (humanizer-svc,humanizer-worker)' -f
    ;;
  *)
    echo "Usage: $0 [svc|worker|all]"
    echo "  svc    - Monitor humanizer-svc only"
    echo "  worker - Monitor humanizer-worker only"
    echo "  all    - Monitor both services (default)"
    exit 1
    ;;
esac

