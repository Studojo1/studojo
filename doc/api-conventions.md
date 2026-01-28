# API Conventions

## Endpoint Versioning

All API endpoints are versioned using URL path prefixes:

- `/v1/jobs` - Version 1 of jobs API
- `/v1/outlines` - Version 1 of outlines API
- `/v1/payments` - Version 1 of payments API

Version numbers are incremented when breaking changes are introduced. Non-breaking changes (new fields, new endpoints) can be added to existing versions.

## Authentication

### JWT Bearer Tokens

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are validated via JWKS endpoint. See [Authentication Guide](authentication.md) for details.

### Public Endpoints

Only health and readiness endpoints are public:

- `GET /health` - Liveness probe
- `GET /ready` - Readiness probe

All other endpoints require authentication.

## Request Structure

### Content-Type

All request bodies use `application/json`:

```
Content-Type: application/json
```

### Request Headers

Standard headers:

- `Authorization: Bearer <token>` - Required for authenticated endpoints
- `Content-Type: application/json` - Required for POST requests with body
- `Idempotency-Key: <key>` - Optional, prevents duplicate submissions
- `X-Correlation-ID: <id>` - Optional, for request tracing

### Request Bodies

Request bodies are JSON objects:

```json
{
  "type": "assignment-gen",
  "payload": {
    "description": "...",
    "requirements": "..."
  }
}
```

## Response Structure

### Success Responses

Success responses use standard HTTP status codes:

- `200 OK` - Successful request
- `201 Created` - Resource created
- `202 Accepted` - Request accepted, processing async

Response body format:

```json
{
  "job_id": "uuid",
  "status": "QUEUED",
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Error Responses

Error responses use consistent structure:

```json
{
  "error": {
    "code": "error_code",
    "message": "Human-readable error message"
  }
}
```

Error codes:

- `unauthorized` - Missing or invalid authentication
- `forbidden` - Valid auth but insufficient permissions
- `not_found` - Resource not found
- `validation` - Invalid request data
- `conflict` - Idempotency key conflict
- `internal_error` - Server error

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `202 Accepted` - Async processing started
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Missing or invalid auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Idempotency conflict
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service not ready

## Idempotency

### Idempotency Keys

Clients can include an `Idempotency-Key` header to prevent duplicate submissions:

```
Idempotency-Key: <unique-key>
```

### Behavior

- Same key + same user: Returns existing job (200 OK)
- Same key + different user: Returns 409 Conflict
- Different key: Creates new job (202 Accepted)

### Key Requirements

- Must be unique per user
- Should be UUID or other unique identifier
- Expires after 24 hours
- Stored with job for replay detection

### Implementation

```go
idempotencyKey := r.Header.Get("Idempotency-Key")
if idempotencyKey != "" {
    existingID, existingUser, ok, err := store.GetIdempotencyKeyByKey(ctx, idempotencyKey)
    if ok {
        if existingUser != userID {
            return 409 Conflict
        }
        // Return existing job
        return 200 OK with existing job
    }
}
// Create new job
```

## CORS Configuration

### Allowed Origins

CORS is configured via `CORS_ORIGINS` environment variable (comma-separated):

```
CORS_ORIGINS=http://localhost:3000,https://app.example.com
```

### CORS Headers

- `Access-Control-Allow-Origin: <origin>` - Set for allowed origins
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Authorization, Content-Type, Idempotency-Key, X-Correlation-ID`

### Development Fallback

If no origins configured, localhost and 127.0.0.1 are allowed for development.

## Middleware Stack

### Middleware Order

Middleware is applied in this order:

1. **CORS** - Sets CORS headers, handles OPTIONS requests
2. **CorrelationID** - Extracts or generates correlation ID
3. **Logging** - Logs request/response
4. **Authentication** - Validates JWT token (for protected routes)

### Correlation ID Middleware

Extracts `X-Correlation-ID` header or generates UUID:

```go
func CorrelationID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := r.Header.Get("X-Correlation-ID")
        if id == "" {
            id = uuid.New().String()
        }
        ctx := context.WithValue(r.Context(), correlationIDKey, id)
        w.Header().Set("X-Correlation-ID", id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### Logging Middleware

Logs requests with correlation ID:

```go
func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        corr := CorrelationIDFromContext(r.Context())
        slog.Info("request",
            "correlation_id", corr,
            "method", r.Method,
            "path", r.URL.Path,
        )
        next.ServeHTTP(w, r)
    })
}
```

### CORS Middleware

Sets CORS headers based on allowed origins:

```go
func CORS(allowedOrigins []string) func(http.Handler) http.Handler {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            origin := r.Header.Get("Origin")
            if isAllowed(origin) {
                w.Header().Set("Access-Control-Allow-Origin", origin)
            }
            w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, Idempotency-Key, X-Correlation-ID")
            if r.Method == http.MethodOptions {
                w.WriteHeader(http.StatusNoContent)
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}
```

## Endpoint Patterns

### Job Submission

```
POST /v1/jobs
Authorization: Bearer <token>
Content-Type: application/json
Idempotency-Key: <optional-key>

{
  "type": "assignment-gen",
  "payload": {...},
  "payment_order_id": "<optional>"
}
```

Response (202 Accepted for new, 200 OK for replay):

```json
{
  "job_id": "uuid",
  "status": "QUEUED",
  "created_at": "2024-01-01T00:00:00Z",
  "result": {...}  // Only present on replay
}
```

### Job Status

```
GET /v1/jobs/:id
Authorization: Bearer <token>
```

Response (200 OK):

```json
{
  "job_id": "uuid",
  "status": "COMPLETED",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:00Z",
  "result": {...}  // Present when COMPLETED
}
```

### List Jobs

```
GET /v1/jobs?type=<optional>&limit=<optional>&offset=<optional>
Authorization: Bearer <token>
```

Query parameters:

- `type` - Filter by job type (optional)
- `limit` - Max results (default: 50, max: 100)
- `offset` - Pagination offset (default: 0)

Response (200 OK):

```json
[
  {
    "job_id": "uuid",
    "status": "COMPLETED",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:01:00Z",
    "result": {...}
  }
]
```

## Error Handling

### Validation Errors

Return 400 Bad Request with validation details:

```json
{
  "error": {
    "code": "validation",
    "message": "Invalid request: missing required field 'type'"
  }
}
```

### Authentication Errors

Return 401 Unauthorized:

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Missing or invalid Authorization header"
  }
}
```

### Authorization Errors

Return 403 Forbidden:

```json
{
  "error": {
    "code": "forbidden",
    "message": "You do not have permission to access this resource"
  }
}
```

### Not Found Errors

Return 404 Not Found:

```json
{
  "error": {
    "code": "not_found",
    "message": "Job not found"
  }
}
```

### Conflict Errors

Return 409 Conflict for idempotency conflicts:

```json
{
  "error": {
    "code": "conflict",
    "message": "Idempotency key already used by different user"
  }
}
```

## Best Practices

1. **Always version APIs**: Use `/v1/` prefix for all endpoints
2. **Use consistent error format**: Always return `{"error": {"code": "...", "message": "..."}}`
3. **Include correlation IDs**: Set `X-Correlation-ID` header in responses
4. **Log all requests**: Include correlation ID and user ID in logs
5. **Validate input**: Return 400 for invalid requests
6. **Check authorization**: Verify user owns resources before returning
7. **Use appropriate status codes**: 202 for async, 200 for sync, 201 for created
8. **Support idempotency**: Accept `Idempotency-Key` header
9. **Handle CORS properly**: Set headers for allowed origins only
10. **Document endpoints**: Include request/response examples in code comments

