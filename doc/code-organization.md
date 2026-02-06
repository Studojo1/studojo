# Code Organization

## Go Service Structure

### Standard Layout

All Go services follow this directory structure:

```
service-name/
├── cmd/
│   └── server/          # or worker/
│       └── main.go      # Application entry point
├── internal/            # Private application code
│   ├── api/            # HTTP handlers (for API services)
│   ├── auth/            # Authentication logic
│   ├── blob/            # Blob storage client (for workers)
│   ├── generator/       # Job processing logic (for workers)
│   ├── messaging/       # RabbitMQ integration
│   ├── store/           # Database layer
│   └── workflow/        # Business logic
├── go.mod               # Go module definition
├── go.sum               # Dependency checksums
├── Dockerfile           # Container build file
└── README.rst           # Service documentation
```

### Entry Points

- **API Services**: `cmd/server/main.go`
- **Workers**: `cmd/worker/main.go`

### Internal Packages

The `internal/` directory contains private application code that should not be imported by external packages.

## Package Organization

### API Package (`internal/api/`)

HTTP handlers, middleware, and request/response types:

```
internal/api/
├── handler.go      # HTTP handlers
├── middleware.go   # HTTP middleware (CORS, logging, correlation ID)
└── response.go     # Response types and utilities
```

Responsibilities:
- HTTP request handling
- Request/response serialization
- Middleware implementation
- Error response formatting

### Auth Package (`internal/auth/`)

Authentication and authorization:

```
internal/auth/
├── config.go       # Auth configuration
├── jwks.go         # JWKS client implementation
└── middleware.go   # JWT validation middleware
```

Responsibilities:
- JWT token validation
- JWKS key fetching and caching
- User context injection
- Authorization helpers

### Messaging Package (`internal/messaging/`)

RabbitMQ integration:

```
internal/messaging/
├── config.go       # Messaging configuration
├── consumer.go     # Message consumer implementation
└── publisher.go    # Message publisher implementation
```

Responsibilities:
- RabbitMQ connection management
- Message publishing
- Message consumption
- Exchange and queue declaration

### Store Package (`internal/store/`)

Database layer:

```
internal/store/
├── migrate.go           # Migration runner
├── migrations/          # SQL migration files
│   ├── 000001_init_schema.up.sql
│   ├── 000001_init_schema.down.sql
│   └── ...
├── postgres.go         # PostgreSQL implementation
├── store.go            # Store interfaces
└── payments.go         # Payment-specific store methods
```

Responsibilities:
- Database connection management
- Migration execution
- Data access layer
- Store interface definitions

### Workflow Package (`internal/workflow/`)

Business logic and job lifecycle:

```
internal/workflow/
├── service.go       # Workflow service implementation
├── errors.go        # Error definitions
├── idempotency.go   # Idempotency logic
└── statemachine.go  # State machine logic
```

Responsibilities:
- Job lifecycle management
- Idempotency handling
- State transitions
- Business logic orchestration

### Blob Package (`internal/blob/`)

Blob storage client (for workers):

```
internal/blob/
└── blob.go          # Blob storage client interface and implementations
```

Responsibilities:
- Blob storage client interface
- Azure Blob Storage implementation
- LocalStack implementation (for local dev)
- File upload/download

### Generator Package (`internal/generator/`)

Job processing logic (for workers):

```
internal/generator/
├── generator.go     # Generator interface and implementation
└── types/
    └── types.go     # Generator-specific types
```

Responsibilities:
- Job processing logic
- External service integration
- Result generation

## Module Structure

### Go Module

Define module in `go.mod`:

```go
module github.com/studojo/service-name

go 1.25

require (
    github.com/google/uuid v1.6.0
    github.com/lib/pq v1.10.9
    github.com/rabbitmq/amqp091-go v1.10.0
)
```

### Module Naming

Use GitHub-style module paths:

- `github.com/studojo/control-plane`
- `github.com/studojo/assignment-gen-worker`
- `github.com/studojo/resume-worker`

## Import Organization

### Import Groups

Organize imports in groups:

1. Standard library
2. Third-party packages
3. Internal packages

```go
import (
    // Standard library
    "context"
    "encoding/json"
    "net/http"
    
    // Third-party
    "github.com/google/uuid"
    "github.com/lib/pq"
    
    // Internal
    "github.com/studojo/control-plane/internal/auth"
    "github.com/studojo/control-plane/internal/store"
)
```

### Import Aliases

Use aliases for clarity:

```go
import (
    amqp "github.com/rabbitmq/amqp091-go"
    razorpay "github.com/razorpay/razorpay-go"
)
```

## Package Naming

### Package Names

- Use lowercase, single-word names
- Avoid underscores or mixedCaps
- Be descriptive but concise

Examples:
- `api` not `apiHandler` or `api_handler`
- `auth` not `authentication`
- `store` not `database` or `db`

### File Naming

- Use lowercase with underscores: `handler.go`, `middleware.go`
- Group related functionality in same package
- Use descriptive names: `postgres.go` not `db.go`

## Interface Design

### Interface Definition

Define interfaces in the same package as implementations:

```go
package store

type JobStore interface {
    CreateJob(ctx context.Context, j *Job) error
    GetJob(ctx context.Context, id uuid.UUID) (*Job, error)
}
```

### Interface Location

- Define interfaces where they're used
- Keep interfaces small and focused
- Use interfaces for testability

## Type Definitions

### Domain Types

Define domain types in appropriate packages:

```go
package store

type Job struct {
    ID        uuid.UUID
    UserID    string
    Type      string
    Status    string
    Payload   json.RawMessage
    Result    json.RawMessage
    CreatedAt time.Time
    UpdatedAt time.Time
}
```

### Request/Response Types

Define request/response types in API package:

```go
package api

type SubmitRequest struct {
    Type   string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

type SubmitResponse struct {
    JobID     string `json:"job_id"`
    Status    string `json:"status"`
    CreatedAt string `json:"created_at"`
}
```

## Error Handling

### Error Types

Define error types in appropriate packages:

```go
package workflow

var (
    ErrValidation = errors.New("validation error")
    ErrNotFound   = errors.New("not found")
    ErrForbidden  = errors.New("forbidden")
    ErrConflict   = errors.New("conflict")
)
```

### Error Wrapping

Use error wrapping for context:

```go
if err != nil {
    return fmt.Errorf("create job: %w", err)
}
```

## Testing Structure

### Test Files

Place test files alongside source files:

```
internal/
├── store/
│   ├── store.go
│   ├── store_test.go
│   ├── postgres.go
│   └── postgres_test.go
```

### Test Naming

Use `_test.go` suffix:

- `store_test.go`
- `handler_test.go`
- `middleware_test.go`

## Documentation

### Package Documentation

Document packages:

```go
// Package api provides HTTP handlers and middleware for the Control Plane API.
package api
```

### Function Documentation

Document exported functions:

```go
// CreateJob creates a new job record in the database.
// Returns an error if the job cannot be created.
func (s *PostgresStore) CreateJob(ctx context.Context, j *Job) error {
    // ...
}
```

### README Files

Include README.rst in each service:

```
service-name/
└── README.rst
```

Document:
- Service purpose
- API endpoints (if applicable)
- Environment variables
- Dependencies
- Running locally

## Frontend Structure

### React Router Structure

```
frontend/
├── app/
│   ├── components/      # Reusable components
│   │   ├── auth/
│   │   ├── common/
│   │   └── dojos/
│   ├── lib/             # Utility libraries
│   │   ├── auth-client.ts
│   │   ├── control-plane.ts
│   │   └── payments.ts
│   ├── routes/          # Route handlers
│   │   ├── api.*.tsx    # API routes
│   │   └── *.tsx        # Page routes
│   └── root.tsx         # Root component
├── package.json
└── vite.config.ts
```

### Component Organization

- Group by feature: `components/dojos/`, `components/auth/`
- Use index files for exports: `components/index.ts`
- Keep components focused and reusable

### Library Organization

- Group by domain: `lib/control-plane.ts`, `lib/payments.ts`
- Export functions, not classes
- Use TypeScript for type safety

## Python Service Structure

### Assignment Gen Structure

```
assignment-gen/
├── src/
│   ├── chains/          # LangChain chains
│   ├── models/          # Data models
│   ├── tools/           # LangChain tools
│   └── utils/          # Utility functions
├── worker_generate.py   # Worker entry point
├── pyproject.toml       # Python dependencies
└── Dockerfile
```

### Python Organization

- Use `src/` layout for packages
- Group by functionality: `chains/`, `models/`, `tools/`
- Keep entry points at root: `worker_generate.py`

## Best Practices

1. **Use internal packages**: Keep application code in `internal/`
2. **Group by functionality**: Organize packages by domain
3. **Keep packages focused**: Each package should have a single responsibility
4. **Use interfaces**: Define interfaces for testability
5. **Document exports**: Document all exported functions and types
6. **Follow naming conventions**: Use lowercase package names
7. **Organize imports**: Group imports logically
8. **Keep files focused**: One file per major component
9. **Use descriptive names**: File and package names should be clear
10. **Maintain consistency**: Follow existing patterns in codebase































