# Database Patterns

## Schema Organization

PostgreSQL uses schema separation to organize data:

- **cp schema**: Control Plane data (jobs, idempotency_keys, payments, job_state_transitions)
- **public schema**: Shared data (user authentication, resumes, other shared tables)

### Schema Usage

Control Plane tables use the `cp` schema:

```sql
CREATE SCHEMA IF NOT EXISTS cp;

CREATE TABLE cp.jobs (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    ...
);
```

Shared tables use the `public` schema (default):

```sql
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    ...
);
```

## Migration Patterns

### Migration Tool

Use `golang-migrate/migrate` with embedded SQL files:

```go
import (
    "embed"
    "github.com/golang-migrate/migrate/v4"
    _ "github.com/golang-migrate/migrate/v4/database/postgres"
    "github.com/golang-migrate/migrate/v4/source/iofs"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

func Migrate(dbURL string) error {
    migrations, err := fs.Sub(migrationsFS, "migrations")
    src, err := iofs.New(migrations, ".")
    m, err := migrate.NewWithSourceInstance("iofs", src, dbURL)
    defer m.Close()
    return m.Up()
}
```

### Migration File Naming

Migration files follow this pattern:

- `000001_init_schema.up.sql` - Up migration
- `000001_init_schema.down.sql` - Down migration
- `000002_payments.up.sql` - Next migration up
- `000002_payments.down.sql` - Next migration down

Format: `<sequence_number>_<description>.up.sql` or `.down.sql`

### Migration Directory Structure

```
internal/
└── store/
    ├── migrations/
    │   ├── 000001_init_schema.up.sql
    │   ├── 000001_init_schema.down.sql
    │   ├── 000002_payments.up.sql
    │   └── 000002_payments.down.sql
    ├── migrate.go
    └── postgres.go
```

### Running Migrations

Migrations run automatically on service startup:

```go
func main() {
    dbURL := os.Getenv("DATABASE_URL")
    if err := store.Migrate(dbURL); err != nil {
        slog.Error("migrate failed", "error", err)
        os.Exit(1)
    }
    // Continue with service initialization
}
```

### Migration Best Practices

1. **Always provide down migrations**: Every up migration needs a corresponding down migration
2. **Use transactions**: Wrap migrations in transactions when possible
3. **Test migrations**: Test both up and down migrations
4. **Never modify existing migrations**: Create new migrations instead
5. **Use descriptive names**: Migration names should describe what they do
6. **Increment sequence numbers**: Use sequential numbers (000001, 000002, etc.)

## Store Interfaces

### Interface Definition

Define interfaces in `store.go`:

```go
package store

type JobStore interface {
    CreateJob(ctx context.Context, j *Job) error
    GetJob(ctx context.Context, id uuid.UUID) (*Job, error)
    UpdateJobStatus(ctx context.Context, id uuid.UUID, status string, result []byte, err *string) error
    ListJobs(ctx context.Context, userID string, jobType string, limit, offset int) ([]*Job, error)
}
```

### Implementation

Implement interfaces in `postgres.go`:

```go
package store

type PostgresStore struct {
    db *sql.DB
}

func NewPostgresStore(db *sql.DB) *PostgresStore {
    return &PostgresStore{db: db}
}

func (s *PostgresStore) CreateJob(ctx context.Context, j *Job) error {
    _, err := s.db.ExecContext(ctx, `
        INSERT INTO cp.jobs (id, user_id, type, status, payload, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        j.ID.String(), j.UserID, j.Type, j.Status, j.Payload, j.CreatedAt, j.UpdatedAt,
    )
    return err
}
```

## Table Design Patterns

### Primary Keys

Use UUIDs for primary keys:

```sql
CREATE TABLE cp.jobs (
    id UUID PRIMARY KEY,
    ...
);
```

Generate UUIDs in application code:

```go
jobID := uuid.New()
```

### Timestamps

Always include created_at and updated_at:

```sql
CREATE TABLE cp.jobs (
    ...
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
```

Use TIMESTAMPTZ (timezone-aware) not TIMESTAMP.

### JSONB Columns

Use JSONB for flexible JSON storage:

```sql
CREATE TABLE cp.jobs (
    ...
    payload JSONB,
    result JSONB,
    ...
);
```

Store as `json.RawMessage` in Go:

```go
type Job struct {
    Payload json.RawMessage
    Result  json.RawMessage
}
```

### Foreign Keys

Use foreign keys with proper constraints:

```sql
CREATE TABLE cp.job_state_transitions (
    id UUID PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES cp.jobs(id) ON DELETE CASCADE,
    ...
);
```

Use `ON DELETE CASCADE` for dependent records.

### Nullable Fields

Use nullable fields appropriately:

```sql
CREATE TABLE cp.jobs (
    ...
    idempotency_key_id UUID,
    error TEXT,
    ...
);
```

Handle nullable fields in Go:

```go
var keyID sql.NullString
err := row.Scan(..., &keyID, ...)
if keyID.Valid {
    u, _ := uuid.Parse(keyID.String)
    j.IdempotencyKeyID = &u
}
```

## Indexing Guidelines

### User Queries

Index columns used in WHERE clauses:

```sql
CREATE INDEX idx_jobs_user_created ON cp.jobs (user_id, created_at DESC);
```

### Type and Status

Index for filtering:

```sql
CREATE INDEX idx_jobs_type_status ON cp.jobs (type, status);
```

### Foreign Keys

Index foreign keys:

```sql
CREATE INDEX idx_transitions_job_at ON cp.job_state_transitions (job_id, at);
```

### Unique Constraints

Use unique indexes for constraints:

```sql
CREATE UNIQUE INDEX idx_idempotency_key ON cp.idempotency_keys (key);
```

### Partial Indexes

Use partial indexes for conditional queries:

```sql
CREATE INDEX idx_jobs_idempotency_key ON cp.jobs (idempotency_key_id) 
WHERE idempotency_key_id IS NOT NULL;
```

## Query Patterns

### Parameterized Queries

Always use parameterized queries:

```go
_, err := s.db.ExecContext(ctx, `
    INSERT INTO cp.jobs (id, user_id, type, status)
    VALUES ($1, $2, $3, $4)`,
    jobID, userID, jobType, status,
)
```

Never concatenate user input into SQL strings.

### Context Usage

Always pass context:

```go
func (s *PostgresStore) GetJob(ctx context.Context, id uuid.UUID) (*Job, error) {
    err := s.db.QueryRowContext(ctx, `SELECT ...`, id.String()).Scan(...)
    return job, err
}
```

### Error Handling

Handle `sql.ErrNoRows`:

```go
err := s.db.QueryRowContext(ctx, `SELECT ...`).Scan(...)
if err == sql.ErrNoRows {
    return nil, nil // Not found
}
if err != nil {
    return nil, err
}
```

### Transactions

Use transactions for multi-step operations:

```go
tx, err := s.db.BeginTx(ctx, nil)
if err != nil {
    return err
}
defer tx.Rollback()

_, err = tx.ExecContext(ctx, `INSERT INTO ...`)
if err != nil {
    return err
}

_, err = tx.ExecContext(ctx, `UPDATE ...`)
if err != nil {
    return err
}

return tx.Commit()
```

## Connection Management

### Connection Pooling

Use `database/sql` connection pooling:

```go
db, err := sql.Open("postgres", dbURL)
if err != nil {
    return err
}
defer db.Close()

// Set pool settings
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(5)
db.SetConnMaxLifetime(5 * time.Minute)
```

### Connection String

Use PostgreSQL DSN format:

```
postgresql://user:password@host:port/database?sslmode=disable
```

For local development, ensure SSL mode:

```go
func ensureSSLMode(dsn string) string {
    if strings.Contains(strings.ToLower(dsn), "sslmode=") {
        return dsn
    }
    if strings.Contains(dsn, "?") {
        return dsn + "&sslmode=disable"
    }
    return dsn + "?sslmode=disable"
}
```

### Health Checks

Check database connectivity:

```go
func (c *Checker) Ready(ctx context.Context) error {
    if err := c.DB.PingContext(ctx); err != nil {
        return err
    }
    return nil
}
```

## Best Practices

1. **Use schemas**: Separate control plane data from shared data
2. **Embed migrations**: Use `//go:embed` to embed SQL files
3. **Run migrations on startup**: Ensure database is up to date
4. **Use interfaces**: Define store interfaces for testability
5. **Parameterize queries**: Never concatenate user input
6. **Use UUIDs**: For primary keys and external references
7. **Include timestamps**: Always track created_at and updated_at
8. **Index appropriately**: Index columns used in WHERE, JOIN, ORDER BY
9. **Handle nullable fields**: Use sql.NullString, sql.NullTime, etc.
10. **Use transactions**: For multi-step operations
11. **Pass context**: Always pass context for cancellation/timeout
12. **Handle errors**: Check for sql.ErrNoRows and other errors
13. **Use JSONB**: For flexible JSON storage
14. **Set connection limits**: Configure connection pool appropriately







