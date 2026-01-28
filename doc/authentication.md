# Authentication

## Overview

Authentication in Studojo uses JWT tokens issued by the frontend's Better Auth service. The Control Plane validates these tokens via JWKS (JSON Web Key Set) endpoint.

## JWT Token Structure

### Token Format

JWT tokens consist of three parts separated by dots:

```
<header>.<payload>.<signature>
```

### Header

Contains algorithm and key ID:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "kid": "key-id"
}
```

### Payload

Contains claims including subject (user ID):

```json
{
  "sub": "user-id",
  "exp": 1234567890,
  "iat": 1234567890
}
```

### Signature

Cryptographic signature verified using public keys from JWKS endpoint.

## JWKS Integration

### JWKS Endpoint

The frontend exposes a JWKS endpoint at:

```
GET /api/auth/jwks
```

Response format:

```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id",
      "use": "sig",
      "alg": "RS256",
      "n": "...",
      "e": "..."
    }
  ]
}
```

### JWKS Client

Control Plane uses a JWKS client to fetch and cache public keys:

```go
jwksURL := os.Getenv("JWKS_URL")
if jwksURL == "" {
    jwksURL = "http://localhost:3000/api/auth/jwks"
}

jwks := auth.NewJWKSClient(jwksURL, nil)
```

### Key Caching

JWKS keys are cached for 24 hours to reduce HTTP requests:

```go
type JWKSClientImpl struct {
    url     string
    client  *http.Client
    mu      sync.RWMutex
    keySet  *jose.JSONWebKeySet
    fetched time.Time
    ttl     time.Duration // 24 hours
}
```

Keys are refetched if:
- Cache is expired (older than TTL)
- Key ID from token header is not found in cached keys

## Token Validation

### Validation Process

1. Parse JWT token
2. Extract key ID from header
3. Fetch JWKS (from cache or HTTP)
4. Find matching public key
5. Verify signature
6. Validate claims (expiration, etc.)
7. Extract user ID from subject claim

### Implementation

```go
func (c *JWKSClientImpl) VerifyToken(ctx context.Context, raw string) (*TokenClaims, error) {
    // Parse token
    tok, err := jwt.ParseSigned(raw, []jose.SignatureAlgorithm{
        jose.RS256, jose.RS384, jose.RS512,
        jose.ES256, jose.ES384, jose.ES512,
    })
    
    // Get key set
    keySet, err := c.getKeySet(ctx)
    
    // Find key by kid
    kid := extractKeyID(tok)
    key := keySet.Key(kid)
    
    // Verify signature
    var claims jwt.Claims
    if err := tok.Claims(key.Key, &claims); err != nil {
        return nil, err
    }
    
    // Validate expiration
    exp := jwt.Expected{Time: time.Now().UTC()}
    if err := claims.Validate(exp); err != nil {
        return nil, err
    }
    
    return &TokenClaims{Sub: claims.Subject}, nil
}
```

## Authentication Middleware

### Middleware Pattern

Authentication middleware validates tokens and injects user ID into context:

```go
type Middleware struct {
    JWKS JWKSClient
}

func (m *Middleware) Wrap(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Extract token
        raw := extractBearer(r)
        if raw == "" {
            writeUnauthorized(w, "missing or invalid Authorization header")
            return
        }
        
        // Verify token
        claims, err := m.JWKS.VerifyToken(r.Context(), raw)
        if err != nil {
            writeUnauthorized(w, "invalid or expired token")
            return
        }
        
        // Inject user ID into context
        ctx := context.WithValue(r.Context(), userIDContextKey, claims.Sub)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

### Token Extraction

Extract Bearer token from Authorization header:

```go
func extractBearer(r *http.Request) string {
    const prefix = "Bearer "
    h := r.Header.Get("Authorization")
    if !strings.HasPrefix(h, prefix) {
        return ""
    }
    return strings.TrimSpace(h[len(prefix):])
}
```

### Error Response

Return consistent error format:

```go
func writeUnauthorized(w http.ResponseWriter, message string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusUnauthorized)
    w.Write([]byte(`{"error":{"code":"unauthorized","message":"` + escapeJSON(message) + `"}}`))
}
```

## User Context

### Context Key

Use typed context key:

```go
type contextKey string

const userIDContextKey contextKey = "user_id"
```

### Extracting User ID

Extract user ID from context:

```go
func UserIDFromContext(ctx context.Context) string {
    v, _ := ctx.Value(userIDContextKey).(string)
    return v
}
```

### Usage in Handlers

Use user ID from context:

```go
func (h *Handler) HandleSubmitJob(w http.ResponseWriter, r *http.Request) {
    userID := auth.UserIDFromContext(r.Context())
    if userID == "" {
        http.Error(w, "unauthorized", http.StatusUnauthorized)
        return
    }
    
    // Use userID for authorization
    job.UserID = userID
}
```

## Authorization Patterns

### User-Scoped Resources

All resources are user-scoped. Verify ownership before access:

```go
func (s *Service) GetJob(ctx context.Context, jobIDStr, userID string) (*JobResponse, error) {
    job, err := s.Store.GetJob(ctx, jobID)
    if err != nil {
        return nil, err
    }
    if job == nil {
        return nil, ErrNotFound
    }
    
    // Verify ownership
    if job.UserID != userID {
        return nil, ErrForbidden
    }
    
    return jobToResponse(job), nil
}
```

### Protected Endpoints

Apply authentication middleware to protected endpoints:

```go
authMW := &auth.Middleware{JWKS: jwks}

mux.Handle("POST /v1/jobs", authMW.Wrap(http.HandlerFunc(h.HandleSubmitJob)))
mux.Handle("GET /v1/jobs/{id}", authMW.Wrap(http.HandlerFunc(h.HandleGetJob)))
```

### Public Endpoints

Health and readiness endpoints are public:

```go
mux.HandleFunc("GET /health", h.HandleHealth)
mux.HandleFunc("GET /ready", h.HandleReady)
```

## Token Claims

### Standard Claims

- `sub` (subject): User ID - required
- `exp` (expiration): Token expiration time - validated
- `iat` (issued at): Token issuance time
- `aud` (audience): Optional audience claim
- `iss` (issuer): Optional issuer claim

### Custom Claims

Additional claims can be included but are not validated by Control Plane. Only `sub` is extracted and used.

## Security Considerations

### Token Validation

- Always validate token signature
- Always check token expiration
- Never trust token without verification
- Use HTTPS in production

### Key Rotation

JWKS keys can be rotated. The client:
- Caches keys for performance
- Refetches if key ID not found
- Supports multiple keys in JWKS

### Error Handling

Don't leak information in error messages:

```go
// Good
writeUnauthorized(w, "invalid or expired token")

// Bad - leaks information
writeUnauthorized(w, "token expired at 2024-01-01")
```

### Token Storage

Frontend stores tokens securely (not in localStorage for production). Control Plane never stores tokens, only validates them.

## Configuration

### Environment Variables

- `JWKS_URL`: JWKS endpoint URL (default: `http://localhost:3000/api/auth/jwks`)

### Default Configuration

```go
jwksURL := os.Getenv("JWKS_URL")
if jwksURL == "" {
    jwksURL = "http://localhost:3000/api/auth/jwks"
}

jwks := auth.NewJWKSClient(jwksURL, nil)
authMW := &auth.Middleware{JWKS: jwks}
```

## Best Practices

1. **Always validate tokens**: Never trust tokens without verification
2. **Use context for user ID**: Extract from context, don't pass as parameter
3. **Check ownership**: Verify user owns resources before access
4. **Handle errors gracefully**: Don't leak sensitive information
5. **Cache JWKS keys**: Reduce HTTP requests with caching
6. **Support key rotation**: Refetch keys if not found
7. **Use HTTPS**: Always use HTTPS in production
8. **Validate expiration**: Always check token expiration
9. **Log authentication failures**: Include correlation ID
10. **Use typed context keys**: Avoid string keys for context values

