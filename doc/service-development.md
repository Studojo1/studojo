# Service Development Guidelines

## Service Types

### Control Plane API Service

Control Plane services handle HTTP requests, authentication, and orchestration. They follow this pattern:

- Entry point: `cmd/server/main.go`
- HTTP server with middleware stack
- Database migrations on startup
- RabbitMQ publisher for job commands
- RabbitMQ consumer for result events
- Health and readiness endpoints

Example structure:
```
service-name/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── api/
│   ├── auth/
│   ├── messaging/
│   ├── store/
│   └── workflow/
├── go.mod
└── Dockerfile
```

### Worker Service

Worker services consume jobs from RabbitMQ, process them, and publish results. They follow this pattern:

- Entry point: `cmd/worker/main.go`
- RabbitMQ connection and consumption
- Job processing logic
- Result publishing
- Resource cleanup

Example structure:
```
worker-name/
├── cmd/
│   └── worker/
│       └── main.go
├── internal/
│   ├── blob/
│   ├── generator/
│   └── messaging/
├── go.mod
└── Dockerfile
```

### Standalone Service

Standalone services provide specific functionality without job processing:

- Entry point: `cmd/server/main.go`
- HTTP endpoints for specific operations
- No RabbitMQ integration
- Health endpoints

## Project Structure

### Go Services

All Go services follow this directory structure:

```
service-name/
├── cmd/                    # Application entry points
│   └── server/            # or worker/
│       └── main.go
├── internal/              # Private application code
│   ├── api/               # HTTP handlers (for API services)
│   ├── auth/              # Authentication logic
│   ├── blob/              # Blob storage client (for workers)
│   ├── generator/         # Job processing logic (for workers)
│   ├── messaging/         # RabbitMQ integration
│   ├── store/             # Database layer
│   └── workflow/          # Business logic
├── go.mod
├── go.sum
├── Dockerfile
└── README.rst
```

### Internal Package Organization

The `internal/` directory contains private application code:

- **api/**: HTTP handlers, request/response types, middleware
- **auth/**: JWT validation, middleware, user context
- **blob/**: Blob storage client interfaces and implementations
- **generator/**: Job processing logic, external service clients
- **messaging/**: RabbitMQ publisher/consumer implementations
- **store/**: Database store interfaces and PostgreSQL implementations
- **workflow/**: Business logic, job lifecycle management

### Entry Point Patterns

#### Control Plane API Entry Point

```go
func main() {
    // 1. Load environment variables with defaults
    dbURL := os.Getenv("DATABASE_URL")
    if dbURL == "" {
        dbURL = "postgresql://user:pass@localhost:5432/db"
    }
    
    // 2. Run database migrations
    if err := store.Migrate(dbURL); err != nil {
        slog.Error("migrate failed", "error", err)
        os.Exit(1)
    }
    
    // 3. Initialize database connection
    db, err := sql.Open("postgres", dbURL)
    // ... error handling
    
    // 4. Initialize RabbitMQ publisher
    pub, err := messaging.NewRabbitPublisher(cfg)
    // ... error handling
    
    // 5. Initialize services
    st := store.NewPostgresStore(db)
    wf := &workflow.Service{Store: st, Publisher: pub}
    
    // 6. Initialize HTTP handlers
    h := &api.Handler{Workflow: wf}
    authMW := &auth.Middleware{JWKS: jwks}
    
    // 7. Setup HTTP routes
    mux := http.NewServeMux()
    mux.HandleFunc("GET /health", h.HandleHealth)
    mux.Handle("POST /v1/jobs", authMW.Wrap(http.HandlerFunc(h.HandleSubmitJob)))
    
    // 8. Setup middleware stack
    stack := api.CORS(corsOrigins)(api.CorrelationID(api.Logging(mux)))
    
    // 9. Start RabbitMQ consumer in background
    consumer := messaging.NewRabbitConsumer(cfg, wf)
    go messaging.RunWithRetry(ctx, consumer, 5*time.Second)
    
    // 10. Start HTTP server
    srv := &http.Server{Addr: addr, Handler: stack}
    // ... graceful shutdown
}
```

#### Worker Entry Point

```go
func main() {
    // 1. Load environment variables
    rabbitURL := os.Getenv("RABBITMQ_URL")
    resultsExchange := os.Getenv("RESULTS_EXCHANGE")
    
    // 2. Initialize external clients (blob storage, generators, etc.)
    blobClient, err := blob.NewAzureClient(...)
    
    // 3. Connect to RabbitMQ
    conn, err := amqp.Dial(rabbitURL)
    ch, err := conn.Channel()
    
    // 4. Declare exchanges and queues
    ch.ExchangeDeclare("cp.jobs", "topic", true, false, false, false, nil)
    ch.ExchangeDeclare(resultsExchange, "topic", true, false, false, false, nil)
    q, err := ch.QueueDeclare("service-name.jobs", true, false, false, false, nil)
    
    // 5. Bind queue to routing keys
    for _, jobType := range []string{"job-type-1", "job-type-2"} {
        ch.QueueBind(q.Name, "job."+jobType, "cp.jobs", false, nil)
    }
    
    // 6. Start consuming
    deliveries, err := ch.Consume(q.Name, "worker-name", false, false, false, false, nil)
    
    // 7. Process jobs
    for {
        select {
        case <-ctx.Done():
            return
        case d := <-deliveries:
            go handleJob(ctx, ch, d, ...)
        }
    }
}
```

## Environment Variables

### Naming Conventions

- Use uppercase with underscores: `DATABASE_URL`, `RABBITMQ_URL`
- Prefix service-specific variables: `AZURE_STORAGE_ACCOUNT_NAME`
- Use descriptive names: `RESULTS_EXCHANGE` not `RES_EXCH`

### Required Variables

#### Control Plane Service

- `DATABASE_URL`: PostgreSQL connection string
- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `JWKS_URL`: Frontend JWKS endpoint URL
- `HTTP_PORT`: HTTP server port (default: 8080)
- `CORS_ORIGINS`: Comma-separated allowed origins
- `RAZORPAY_KEY_ID`: Razorpay API key ID (optional)
- `RAZORPAY_KEY_SECRET`: Razorpay API key secret (optional)

#### Worker Service

- `RABBITMQ_URL`: RabbitMQ AMQP URL
- `RESULTS_EXCHANGE`: Results exchange name (default: cp.results)
- `AZURE_STORAGE_ACCOUNT_NAME`: Blob storage account name
- `AZURE_STORAGE_ACCOUNT_KEY`: Blob storage account key
- `AZURE_STORAGE_CONTAINER_NAME`: Container name
- `USE_LOCALSTACK`: Use LocalStack for local development (true/false)
- `LOCALSTACK_ENDPOINT`: LocalStack endpoint URL

### Default Values

Always provide sensible defaults for local development:

```go
dbURL := os.Getenv("DATABASE_URL")
if dbURL == "" {
    dbURL = "postgresql://studojo:studojo@localhost:5432/postgres?sslmode=disable"
}
```

## Health Check Patterns

### Health Endpoint (`/health`)

Liveness probe - returns 200 if service is running:

```go
func (h *Handler) HandleHealth(w http.ResponseWriter, r *http.Request) {
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ok"}`))
}
```

### Readiness Endpoint (`/ready`)

Readiness probe - returns 200 if service can handle requests:

```go
func (h *Handler) HandleReady(w http.ResponseWriter, r *http.Request) {
    if err := h.Ready.Ready(r.Context()); err != nil {
        http.Error(w, "not ready", http.StatusServiceUnavailable)
        return
    }
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(`{"status":"ready"}`))
}
```

Readiness should check:
- Database connectivity
- RabbitMQ connectivity
- Any other critical dependencies

## Error Handling

### Structured Errors

Use structured error responses:

```go
type ErrorResponse struct {
    Error struct {
        Code    string `json:"code"`
        Message string `json:"message"`
    } `json:"error"`
}
```

### HTTP Status Codes

- `200 OK`: Successful request
- `201 Created`: Resource created
- `202 Accepted`: Request accepted, processing async
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Valid auth but insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Idempotency key conflict
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Service not ready

### Logging

Use structured logging with context:

```go
slog.Info("job created", "job_id", jobID, "user_id", userID, "type", jobType)
slog.Error("processing failed", "job_id", jobID, "error", err)
```

Include correlation IDs in logs for tracing requests across services.

## Graceful Shutdown

Handle shutdown signals gracefully:

```go
quit := make(chan os.Signal, 1)
signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
<-quit

// Cancel context to stop background goroutines
stop()

// Shutdown HTTP server
if err := srv.Shutdown(context.Background()); err != nil {
    slog.Error("shutdown failed", "error", err)
}
```

Workers should:
- Stop accepting new jobs
- Finish processing current jobs
- Close connections
- Clean up resources































