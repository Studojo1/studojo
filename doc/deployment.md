# Deployment

## Dockerfile Patterns

### Go Service Dockerfile

Multi-stage build for Go services:

```dockerfile
# Build stage
FROM golang:1.25-alpine AS builder
WORKDIR /app

RUN apk add --no-cache git

COPY go.mod go.sum ./
RUN go mod tidy && go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o server ./cmd/server

# Runtime stage
FROM alpine:latest
WORKDIR /app

RUN apk --no-cache add ca-certificates curl && \
    addgroup -g 1000 appuser && \
    adduser -D -u 1000 -G appuser appuser

COPY --from=builder /app/server .
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["./server"]
```

### Worker Dockerfile

Multi-stage build for workers (may include Python dependencies):

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s' \
    -o worker ./cmd/worker

FROM python:3.13-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ make libffi-dev libssl-dev ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -m -s /bin/bash appuser

RUN pip install --no-cache-dir --upgrade pip setuptools wheel
RUN pip install --no-cache-dir <python-dependencies>

COPY --from=builder /app/worker .
RUN chown -R appuser:appuser /app
USER appuser

CMD ["./worker"]
```

### Build Optimizations

- **Multi-stage builds**: Separate build and runtime stages
- **Layer caching**: Copy dependency files first
- **Static binaries**: Use `CGO_ENABLED=0` for static binaries
- **Strip symbols**: Use `-ldflags='-w -s'` to reduce binary size
- **Non-root user**: Run as non-root user for security
- **Minimal base images**: Use alpine or slim images

## Environment Variables

### Configuration Management

All configuration via environment variables:

```yaml
environment:
  DATABASE_URL: postgresql://user:pass@host:5432/db
  RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
  JWKS_URL: http://frontend:3000/api/auth/jwks
  HTTP_PORT: "8080"
  CORS_ORIGINS: http://localhost:3000
```

### Secrets Management

Sensitive values should be provided via:
- Environment variables (development)
- Kubernetes Secrets (production)
- Secret management services (Azure Key Vault, etc.)

Never commit secrets to version control.

## Health Checks

### Health Endpoint

All services expose health endpoints:

- `GET /health` - Liveness probe (service is running)
- `GET /ready` - Readiness probe (service can handle requests)

### Docker Healthcheck

Configure healthcheck in Dockerfile:

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1
```

### Kubernetes Probes

Configure probes in Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 30
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /ready
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3
```

## Docker Compose

### Service Definition

Define services in `docker-compose.yml`:

```yaml
services:
  control-plane:
    build:
      context: ./services/control-plane
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      DATABASE_URL: postgresql://studojo:studojo@postgres:5432/postgres
      RABBITMQ_URL: amqp://guest:guest@rabbitmq:5672/
      JWKS_URL: http://frontend:3000/api/auth/jwks
      HTTP_PORT: "8080"
      CORS_ORIGINS: http://localhost:3000,http://127.0.0.1:3000
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
```

### Health Checks

Use health checks for dependencies:

```yaml
depends_on:
  postgres:
    condition: service_healthy
  rabbitmq:
    condition: service_healthy
```

### Volumes

Mount volumes for development:

```yaml
volumes:
  - ./services/assignment-gen:/app/assignment-gen:ro
```

## Kubernetes Deployment

### Deployment Pattern

Standard Kubernetes deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: control-plane
spec:
  replicas: 2
  selector:
    matchLabels:
      app: control-plane
  template:
    metadata:
      labels:
        app: control-plane
    spec:
      containers:
      - name: control-plane
        image: control-plane:latest
        ports:
        - containerPort: 8080
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: studojo-secrets
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
```

### Service

Expose service internally:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: control-plane
spec:
  selector:
    app: control-plane
  ports:
  - port: 8080
    targetPort: 8080
  type: ClusterIP
```

### ConfigMap

Non-sensitive configuration:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: control-plane-config
data:
  HTTP_PORT: "8080"
  CORS_ORIGINS: "https://app.example.com"
```

### Secrets

Sensitive configuration:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: studojo-secrets
type: Opaque
stringData:
  database-url: postgresql://user:pass@host:5432/db
  rabbitmq-url: amqp://user:pass@rabbitmq:5672/
```

## Database Migrations

### Migration Strategy

Migrations run automatically on service startup:

```go
func main() {
    dbURL := os.Getenv("DATABASE_URL")
    if err := store.Migrate(dbURL); err != nil {
        slog.Error("migrate failed", "error", err)
        os.Exit(1)
    }
    // Continue initialization
}
```

### Migration Job

For production, consider running migrations as a separate job:

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: control-plane-migrate
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: control-plane:latest
        command: ["./migrate"]
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: studojo-secrets
              key: database-url
      restartPolicy: Never
```

## Resource Limits

### CPU and Memory

Set resource requests and limits:

```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

### Connection Limits

Configure database connection pool:

```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

## Scaling

### Horizontal Scaling

Workers can be scaled horizontally:

```yaml
spec:
  replicas: 3
```

Multiple worker instances consume from the same queue, distributing load.

### Control Plane Scaling

Control Plane can be scaled behind a load balancer:

```yaml
spec:
  replicas: 2
```

Use a Service with type LoadBalancer or Ingress for external access.

## Monitoring

### Logging

Use structured logging:

```go
slog.Info("request",
    "correlation_id", corr,
    "method", r.Method,
    "path", r.URL.Path,
)
```

### Metrics

Expose metrics endpoints if needed:

```
GET /metrics
```

### Tracing

Include correlation IDs in logs for distributed tracing.

## Best Practices

1. **Use multi-stage builds**: Reduce image size
2. **Run as non-root**: Use non-root user in containers
3. **Set resource limits**: Prevent resource exhaustion
4. **Configure health checks**: Enable proper health monitoring
5. **Use secrets**: Never commit secrets to version control
6. **Run migrations**: Ensure database is up to date
7. **Handle graceful shutdown**: Stop accepting new requests on shutdown
8. **Set connection limits**: Configure database connection pools
9. **Use environment variables**: For all configuration
10. **Monitor resources**: Track CPU, memory, and connection usage
11. **Scale horizontally**: Use multiple replicas for workers
12. **Use health checks**: For dependency management















































