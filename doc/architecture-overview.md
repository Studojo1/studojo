# Architecture Overview

## System Design

Studojo follows a microservices architecture pattern with clear separation of concerns. The system is organized into distinct service types that communicate through well-defined interfaces.

## Service Types

### Control Plane Service

The Control Plane serves as the central orchestration layer for the platform. It handles:

- Authentication and authorization via JWT validation
- Job lifecycle management (CREATED → QUEUED → RUNNING → COMPLETED/FAILED)
- Idempotency handling to prevent duplicate job submissions
- Payment verification and job linking
- Result event processing from workers

The Control Plane exposes a REST API that the frontend exclusively communicates with. It does not directly process jobs but coordinates their execution through message queues.

### Worker Services

Workers are background services that consume jobs from RabbitMQ, process them, and publish results back. Each worker is specialized for a specific job type:

- **Assignment Gen Worker**: Processes assignment generation jobs, invokes Python generators, uploads files to blob storage
- **Resume Worker**: Processes resume generation and optimization jobs, calls resume service, uploads files to blob storage
- **Humanizer Worker**: Processes document humanization jobs, calls humanizer service, uploads humanized files to blob storage

Workers are stateless and can be horizontally scaled. They handle their own resource cleanup and error reporting.

### Standalone Services

Standalone services provide specific functionality without being part of the job processing pipeline:

- **Resume Service**: Generates resume PDFs and packages from JSON data using LaTeX
- **Assignment Gen Service**: Python service that performs the actual assignment generation using LLMs
- **Humanizer Service**: Python FastAPI service that humanizes DOCX documents while preserving structure using Rephrasy API

These services are called by workers but can also be used independently.

### Frontend Service

The frontend is a React Router application that:

- Handles user authentication via Better Auth
- Communicates exclusively with the Control Plane API
- Manages user sessions and state
- Polls for job status updates
- Handles payment flows

## Communication Patterns

### Frontend to Control Plane

All frontend communication goes through the Control Plane API using:

- REST endpoints with versioning (`/v1/`)
- JWT authentication via Bearer tokens
- JSON request/response bodies
- Standard HTTP status codes

### Control Plane to Workers

The Control Plane publishes job commands to RabbitMQ:

- Exchange: `cp.jobs` (topic exchange)
- Routing keys: `job.<job-type>` (e.g., `job.assignment-gen`)
- Message format: JobCommand with job_id, type, user_id, payload, correlation_id

### Workers to Control Plane

Workers publish result events back to RabbitMQ:

- Exchange: `cp.results` (topic exchange)
- Routing keys: `result.<job-type>` (e.g., `result.assignment-gen`)
- Message format: ResultEvent with job_id, type, status, result, error, correlation_id

The Control Plane consumes these results and updates job state accordingly.

## Data Flow

### Job Submission Flow

1. Frontend submits job request to Control Plane API
2. Control Plane validates request and authentication
3. For paid jobs, payment verification occurs
4. Control Plane creates job record with status CREATED
5. Control Plane publishes job command to RabbitMQ
6. Control Plane updates job status to QUEUED
7. Worker consumes job command
8. Worker processes job (implicit RUNNING state)
9. Worker publishes result event to RabbitMQ
10. Control Plane consumes result event
11. Control Plane updates job status to COMPLETED or FAILED
12. Frontend polls for job status and retrieves result

### State Transitions

Jobs follow a strict state machine:

- **CREATED**: Job record created in database
- **QUEUED**: Job command published to RabbitMQ
- **RUNNING**: Worker is processing (implicit, not stored)
- **COMPLETED**: Worker published success result
- **FAILED**: Worker published error result or processing failed

State transitions are recorded in the `job_state_transitions` table for audit purposes.

## Storage Architecture

### PostgreSQL

PostgreSQL serves as the primary data store with schema separation:

- **cp schema**: Control Plane data (jobs, idempotency_keys, payments, job_state_transitions)
- **public schema**: Shared data (user authentication, resumes)

Migrations are embedded in services and run on startup.

### Blob Storage

Azure Blob Storage (LocalStack for local development) stores generated files:

- **assignments container**: Assignment documents (DOCX files)
- **resumes container**: Resume packages (ZIP files)
- **humanizer container**: Humanized documents (DOCX files)

Files are organized by job_id and accessed via signed URLs.

## Security Model

### Authentication

- Frontend uses Better Auth for user authentication
- JWT tokens are issued and validated via JWKS endpoint
- Control Plane validates tokens on every request
- User ID is extracted from token and used for authorization

### Authorization

- All resources are user-scoped
- Jobs can only be accessed by their creator
- User ID is validated on all job operations

### Idempotency

- Idempotency keys prevent duplicate job submissions
- Same key + same user = returns existing job
- Same key + different user = conflict error

## Scalability Considerations

- Workers are horizontally scalable (multiple instances consume from same queue)
- Control Plane can be scaled behind a load balancer (stateless)
- Database connections are pooled
- RabbitMQ handles message distribution across worker instances
- Blob storage is accessed via HTTP APIs

## Error Handling

- Structured error responses with consistent format
- Errors are logged with correlation IDs
- Failed jobs are marked with error messages
- Workers publish error results for failed processing
- Retry logic exists for transient failures (message consumption)

## Monitoring and Observability

- Health endpoints (`/health`, `/ready`) for service status
- Structured logging with correlation IDs
- Job state transitions tracked for audit
- Error messages stored with jobs for debugging

