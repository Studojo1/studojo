# Observability Guide

This guide covers logging, metrics, and monitoring setup for Studojo services.

## Overview

Studojo uses Azure Monitor for comprehensive observability:
- **Logs**: Azure Monitor Log Analytics for log aggregation
- **Metrics**: Azure Monitor Metrics and Prometheus-compatible endpoints
- **Traces**: Application Insights for distributed tracing (future)

## Logging Standards

### Structured Logging

All services should emit structured JSON logs with the following fields:

```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info|warn|error|debug",
  "service": "service-name",
  "message": "Human-readable message",
  "correlation_id": "unique-request-id",
  "user_id": "user-id-if-applicable",
  "job_id": "job-id-if-applicable",
  "error": "error-details-if-applicable"
}
```

### Log Levels

- **DEBUG**: Detailed information for debugging
- **INFO**: General informational messages
- **WARN**: Warning messages for potential issues
- **ERROR**: Error messages that need attention

### Correlation IDs

All log entries should include a correlation ID to trace requests across services:
- Extract from `X-Correlation-ID` header if present
- Generate new UUID if not present
- Include in all log entries for the request lifecycle

### Go Services

Use structured logging with `log/slog`:

```go
import "log/slog"

slog.Info("job created",
    "job_id", jobID,
    "user_id", userID,
    "type", jobType,
    "correlation_id", correlationID,
)
```

### Python Services

Use structured logging with Python's `logging` module:

```python
import logging
import json

logger = logging.getLogger(__name__)
logger.info(json.dumps({
    "level": "info",
    "service": "humanizer-svc",
    "message": "Processing request",
    "correlation_id": correlation_id,
}))
```

## Metrics Collection

### Prometheus-Compatible Endpoints

All services should expose a `/metrics` endpoint with Prometheus-compatible metrics:

```go
import (
    "net/http"
    "github.com/prometheus/client_golang/prometheus"
    "github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"method", "endpoint", "status"},
    )
)

func init() {
    prometheus.MustRegister(requestsTotal)
}

func metricsHandler(w http.ResponseWriter, r *http.Request) {
    promhttp.Handler().ServeHTTP(w, r)
}
```

### Key Metrics

All services should expose:

- **Request Rate**: `http_requests_total` - Total HTTP requests
- **Error Rate**: `http_requests_total{status="5xx"}` - Failed requests
- **Latency**: `http_request_duration_seconds` - Request duration
- **Job Processing**: `jobs_processed_total` - Total jobs processed (workers)
- **Job Duration**: `job_duration_seconds` - Job processing time (workers)

### Azure Monitor Integration

Azure Monitor Agent collects:
- Container logs from `/var/log/pods`
- Prometheus metrics from `/metrics` endpoints
- Application Insights telemetry (if configured)

## Azure Monitor Setup

### Prerequisites

1. Azure Log Analytics workspace
2. Azure Monitor Agent DaemonSet deployed
3. Service annotations for log collection

### Deployment

```bash
kubectl apply -f k8s/azure-monitor/
```

### Configuration

1. Create Azure Monitor secrets:
```bash
kubectl create secret generic azure-monitor-secrets \
  --from-literal=workspace-id=<workspace-id> \
  --from-literal=workspace-key=<workspace-key> \
  -n studojo
```

2. Update ConfigMap with cluster name:
```bash
kubectl edit configmap azure-monitor-config -n studojo
```

### Querying Logs

Use KQL (Kusto Query Language) in Azure Portal:

```kql
// All logs from a service
ContainerLog
| where ContainerName == "control-plane"
| order by TimeGenerated desc

// Error logs
ContainerLog
| where LogEntry contains "error" or LogEntry contains "ERROR"
| order by TimeGenerated desc

// Logs by correlation ID
ContainerLog
| where LogEntry contains "correlation_id:abc123"
| order by TimeGenerated desc
```

### Querying Metrics

```kql
// Request rate
Perf
| where ObjectName == "HTTP"
| where CounterName == "Requests/sec"
| summarize avg(CounterValue) by bin(TimeGenerated, 1m)

// Error rate
Perf
| where ObjectName == "HTTP"
| where CounterName == "Errors/sec"
| summarize avg(CounterValue) by bin(TimeGenerated, 1m)
```

## Best Practices

1. **Always include correlation IDs** in logs for request tracing
2. **Use structured logging** - JSON format for easy parsing
3. **Set appropriate log levels** - Don't log sensitive data
4. **Include context** - Service name, user ID, job ID where applicable
5. **Monitor error rates** - Set up alerts for high error rates
6. **Track key metrics** - Request rate, latency, job processing time
7. **Use Azure Monitor dashboards** - Create custom dashboards for visibility

## Troubleshooting

### Logs Not Appearing

1. Check Azure Monitor Agent is running: `kubectl get pods -n studojo | grep azure-monitor`
2. Verify service annotations are set
3. Check Log Analytics workspace configuration
4. Verify workspace ID and key in secrets

### Metrics Not Collected

1. Verify `/metrics` endpoint is accessible
2. Check Prometheus annotations on deployments
3. Verify Azure Monitor Agent can scrape endpoints
4. Check service account permissions

