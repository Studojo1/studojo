#!/bin/bash
# Quick script to monitor humanizer service logs

NAMESPACE="studojo"
SERVICE_LABEL="app=humanizer-svc"
WORKER_LABEL="app=humanizer-worker"

case "$1" in
  service|svc)
    echo "Monitoring humanizer service logs (Ctrl+C to exit)..."
    kubectl logs -n "$NAMESPACE" -l "$SERVICE_LABEL" -f --tail=100
    ;;
  worker|w)
    echo "Monitoring humanizer worker logs (Ctrl+C to exit)..."
    kubectl logs -n "$NAMESPACE" -l "$WORKER_LABEL" -f --tail=100
    ;;
  both|all)
    echo "Monitoring both service and worker logs (Ctrl+C to exit)..."
    kubectl logs -n "$NAMESPACE" -l "$SERVICE_LABEL" -f --tail=50 &
    kubectl logs -n "$NAMESPACE" -l "$WORKER_LABEL" -f --tail=50 &
    wait
    ;;
  errors|err)
    echo "Showing recent errors..."
    kubectl logs -n "$NAMESPACE" -l "$SERVICE_LABEL" --tail=1000 | grep -E "ERROR|Exception|Traceback|failed|Failed" | tail -50
    kubectl logs -n "$NAMESPACE" -l "$WORKER_LABEL" --tail=1000 | grep -E "ERROR|Exception|Traceback|failed|Failed" | tail -50
    ;;
  job)
    if [ -z "$2" ]; then
      echo "Usage: $0 job <job_id>"
      exit 1
    fi
    echo "Searching for job: $2"
    kubectl logs -n "$NAMESPACE" -l "$SERVICE_LABEL" --tail=5000 | grep "$2"
    kubectl logs -n "$NAMESPACE" -l "$WORKER_LABEL" --tail=5000 | grep "$2"
    ;;
  *)
    echo "Usage: $0 {service|worker|both|errors|job <job_id>}"
    echo ""
    echo "Examples:"
    echo "  $0 service    - Monitor service logs"
    echo "  $0 worker      - Monitor worker logs"
    echo "  $0 both        - Monitor both service and worker"
    echo "  $0 errors      - Show recent errors"
    echo "  $0 job abc123  - Search for specific job ID"
    exit 1
    ;;
esac

