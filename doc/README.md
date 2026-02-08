# Engineering Architecture Documentation

This directory contains comprehensive documentation on the engineering architecture, patterns, and conventions used in the Studojo platform.

## Documentation Index

### [Architecture Overview](architecture-overview.md)

High-level overview of the microservices architecture, component responsibilities, communication patterns, and system design principles.

### [Service Development](service-development.md)

Guidelines for developing new services, including project structure, entry point patterns, environment variables, health checks, and error handling.

### [Messaging Patterns](messaging-patterns.md)

RabbitMQ messaging conventions, including exchange architecture, message structures, publishing and consuming patterns, queue binding, and error handling.

### [API Conventions](api-conventions.md)

REST API design standards, including endpoint versioning, authentication, request/response structures, idempotency, CORS, and middleware patterns.

### [Database Patterns](database-patterns.md)

Database conventions, including schema organization, migration patterns, store interfaces, table design, indexing guidelines, and query patterns.

### [Worker Patterns](worker-patterns.md)

Worker service development guidelines, including worker lifecycle, job processing, result publishing, file handling, error handling, and resource management.

### [Authentication](authentication.md)

Authentication and authorization patterns, including JWT token validation, JWKS integration, middleware implementation, user context, and security considerations.

### [Deployment](deployment.md)

Deployment conventions, including Dockerfile patterns, environment variables, health checks, Docker Compose, Kubernetes deployment, and scaling strategies.

### [Code Organization](code-organization.md)

Code structure standards, including Go service structure, package organization, module structure, import organization, and naming conventions.

## Quick Reference

### Service Types

- **Control Plane API**: Central orchestration, JWT auth, job lifecycle management
- **Worker Service**: Consumes jobs from RabbitMQ, processes them, publishes results
- **Standalone Service**: Provides specific functionality without job processing
- **Python/FastAPI Service**: Python-based services (e.g., Humanizer Service) for specialized processing

### Key Patterns

- **Message Flow**: Frontend → Control Plane → RabbitMQ → Worker → RabbitMQ → Control Plane → Frontend
- **Job Lifecycle**: CREATED → QUEUED → RUNNING → COMPLETED/FAILED
- **Authentication**: JWT tokens validated via JWKS endpoint
- **Idempotency**: Idempotency keys prevent duplicate submissions
- **Database**: PostgreSQL with schema separation (cp.*, public.*)

### Communication

- **Frontend ↔ Control Plane**: REST API with JWT authentication
- **Control Plane ↔ Workers**: RabbitMQ (cp.jobs exchange)
- **Workers ↔ Control Plane**: RabbitMQ (cp.results exchange)

## Getting Started

1. Read [Architecture Overview](architecture-overview.md) for system design
2. Review [Service Development](service-development.md) for creating new services
3. Follow [Code Organization](code-organization.md) for project structure
4. Reference specific guides as needed during development

## Contributing

When adding new services or features:

1. Follow the patterns documented in these guides
2. Maintain consistency with existing codebase
3. Update documentation if introducing new patterns
4. Reference actual implementation files for examples

