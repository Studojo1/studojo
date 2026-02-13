# Studojo Platform

This repository uses git submodules to organize the codebase:

## Frontend Applications

- `apps/frontend/` - Main React Router application (Port: 3000)
- `apps/admin-panel/` - Admin panel for user management and content moderation (Port: 3001)
- `apps/dev-panel/` - Developer panel for monitoring, telemetry, and CI/CD status (Port: 3004)
- `apps/maverick/` - Blog editor with rich text editing capabilities (Port: 3002)
- `apps/partner-panel/` - Partner management interface for company partners (Port: 3003)

## Backend Services

- `services/control-plane/` - Go orchestration service for auth, job lifecycle, and async coordination (Port: 8080)
- `services/emailer-service/` - Go service for transactional emails via Azure Communication Services (Port: 8087)
- `services/resume-svc/` - Go service for generating resume PDFs and packages (Port: 8086)
- `services/humanizer-svc/` - Python FastAPI service for structure-preserving document humanization (Port: 8000)
- `services/assignment-gen/` - Python service for AI-powered assignment generation (used by assignment-gen-worker)

## Worker Services

- `services/assignment-gen-worker/` - Go worker service for processing assignment generation jobs
- `services/resume-worker/` - Go worker service for processing resume jobs
- `services/humanizer-worker/` - Go worker service for processing humanization jobs

## Cloning the Repository

To clone this repository with all submodules:

```bash
git clone --recurse-submodules https://github.com/studojo/studojo.git
```

If you've already cloned the repository without submodules:

```bash
git submodule update --init --recursive
```

## Development Setup

See [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md) for detailed system architecture and component descriptions.

The platform can be run locally using Docker Compose:

```bash
docker-compose up
```

This will start all services including:

**Infrastructure:**
- PostgreSQL (port 5432)
- RabbitMQ (port 5672)
- Redis (port 6379)
- LocalStack (port 4566) - Azure services emulation
- Adminer (port 8081) - Database admin UI
- MailHog (port 8025) - Email visualization for development

**Frontend Applications:**
- Frontend (port 3000)
- Admin Panel (port 3001)
- Maverick Blog Editor (port 3002)
- Partner Panel (port 3003)

**Backend Services:**
- Control Plane API (port 8080)
- Resume Service (port 8086)
- Emailer Service (port 8087)
- Humanizer Service (port 8001)
- Assignment Gen (Python service, used by worker)

**Worker Services:**
- Assignment Gen Worker
- Resume Worker
- Humanizer Worker

**One-time Jobs:**
- Frontend DB Push (database migrations)

## Individual Service Repositories

Each service is maintained in its own repository:

**Frontend Applications:**
- [Frontend](https://github.com/studojo/frontend)
- [Admin Panel](https://github.com/studojo/admin-panel)
- [Dev Panel](https://github.com/studojo/dev-panel)
- [Maverick](https://github.com/studojo/maverick)
- [Partner Panel](https://github.com/studojo/partner-panel)

**Backend Services:**
- [Control Plane](https://github.com/studojo/control-plane)
- [Emailer Service](https://github.com/studojo/emailer-service)
- [Resume Service](https://github.com/studojo/resume-svc)
- [Humanizer Service](https://github.com/studojo/humanizer-svc)
- [Assignment Gen](https://github.com/studojo/assignment-gen) - Python assignment generation service

**Worker Services:**
- [Assignment Gen Worker](https://github.com/studojo/assignment-gen-worker)
- [Resume Worker](https://github.com/studojo/resume-worker)
- [Humanizer Worker](https://github.com/studojo/humanizer-worker)

For detailed documentation on each service, refer to the README file in each service directory.

## CI/CD and Deployment

All services and applications have automated CI/CD pipelines using GitHub Actions. When code is pushed to the `main` branch, workflows automatically:

1. Build Docker images
2. Push to Azure Container Registry (ACR)
3. Deploy to Azure Kubernetes Service (AKS)
4. Record deployment in the Dev Panel

For detailed CI/CD setup instructions, see [.github/CICD_SETUP.md](.github/CICD_SETUP.md).

**Dev Panel**: Monitor deployments, view CI/CD status, and manage services at `https://dev.studojo.com` (requires `dev` or `admin` role).

## Architecture

For a complete overview of the system architecture, message flows, and deployment details, see [doc/ARCHITECTURE.md](doc/ARCHITECTURE.md).

