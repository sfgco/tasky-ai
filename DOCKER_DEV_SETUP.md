# Docker Development Setup

This guide explains how to run tasky locally in development mode using Docker Compose.
Docker Compose starts the application, PostgreSQL, and Redis together so the backend
and frontend can be developed without installing those services directly on the host.

The development stack is intended for local work and hot-reloading. It should not be
used as a production deployment because it exposes development ports and runs the
application in watch mode.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2

## Important Files

- **`Dockerfile.dev`** - Development container configuration
- **`docker-compose.dev.yml`** - Orchestrates all services (PostgreSQL, Redis, Application)
- **`docker/entrypoint-dev.sh`** - Entrypoint script that handles automatic bootstrapping
- **`.env.example`** - Environment variables template (copy to `.env` to customize)

## Quick Start

The normal startup flow is:

1. Docker creates a private network for the services.
2. PostgreSQL and Redis start and report healthy status.
3. The application container waits for both dependencies.
4. Prisma is generated, migrations are applied, and seed data is created.
5. The frontend and backend start together in development mode.

### 1. Setup environment variables

```bash
cp .env.example .env
```

Review and update `.env` with your custom values if needed (JWT secrets, SMTP settings, etc.).
The defaults in `docker-compose.dev.yml` are suitable for local development, but you
should replace placeholder secrets before testing authentication or integrations.

### 2. Start all services

```bash
docker-compose -f docker-compose.dev.yml up
```

Or run in detached mode:

```bash
docker-compose -f docker-compose.dev.yml up -d
```

**That's it!** The entrypoint script automatically handles:

- ✅ Waiting for PostgreSQL and Redis to be ready
- ✅ Generating Prisma Client
- ✅ Running database migrations
- ✅ Seeding the database (idempotent - safe on restarts)
- ✅ Starting the application

### 3. Access the application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Backend API Docs**: http://localhost:3000/api/docs

Keep the terminal attached to `docker-compose ... up` when you want to see logs directly.
Use the `-d` option when you want the containers to continue running in the background.

## Services

The docker-compose setup includes:

- **postgres** (PostgreSQL 16) - Stores users, projects, tasks, and other persistent application data. It is available to the other containers but is not normally exposed to the host.
- **redis** (Redis 7) - Provides caching and queue support for background or realtime work. It is available to the other containers but is not normally exposed to the host.
- **app** (Backend + Frontend) - Runs the NestJS API on port 3000 and the frontend on port 3001.

The application connects to PostgreSQL and Redis by their Compose service names,
`postgres` and `redis`. From your host machine, use `localhost` and the published
ports instead.

## Useful Commands

### View logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Application only
docker-compose -f docker-compose.dev.yml logs -f app
```

### Stop services

```bash
docker-compose -f docker-compose.dev.yml stop
```

Pauses the containers without removing them or their data. Use this when you expect
to resume the same development session later.

### Stop and remove containers

```bash
docker-compose -f docker-compose.dev.yml down
```

Stops and removes the containers and network, but keeps named database volumes by
default. Your PostgreSQL and Redis data should remain available the next time the
stack starts.

### Stop and remove containers + volumes (clean slate)

```bash
docker-compose -f docker-compose.dev.yml down -v
```

Removes the containers, network, and persistent volumes. This permanently deletes
local database and Redis data, so use it only when you intentionally want a clean
development environment.

### Restart the application

```bash
docker-compose -f docker-compose.dev.yml restart app
```

### Execute commands in containers

```bash
# Application shell
docker-compose -f docker-compose.dev.yml exec app sh

# Run Prisma Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio

# Run backend tests
docker-compose -f docker-compose.dev.yml exec app npm run test:backend

# Run frontend tests
docker-compose -f docker-compose.dev.yml exec app npm run test:frontend
```

### Rebuild containers (after dependency changes)

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Source-code changes normally do not require a rebuild because the repository is
mounted into the development container. Rebuild after changing dependencies,
Dockerfile instructions, or system packages.

## Development Workflow

The setup uses volume mounts for hot-reloading:

- Code changes are automatically detected
- No need to rebuild containers for code changes
- Backend restarts automatically (NestJS watch mode)
- Frontend supports Fast Refresh (Next.js)

After changing backend or frontend source files, watch the application logs for the
corresponding restart or Fast Refresh message. Changes to environment variables or
dependencies require restarting or rebuilding the application container.

## Troubleshooting

When diagnosing startup problems, check the application logs first and then verify
that PostgreSQL and Redis are healthy. Most connection errors occur because a
dependency is still starting, a port is already in use, or the local environment
file contains an invalid value.

### Port conflicts

If ports 3000 (backend), 3001 (frontend), 5432, or 6379 are already in use, you can modify them in `docker-compose.dev.yml`:

```yaml
ports:
  - "NEW_PORT:CONTAINER_PORT"
```

### Database connection issues

Ensure PostgreSQL is healthy:

```bash
docker-compose -f docker-compose.dev.yml ps postgres
```

### Reset database

```bash
docker-compose -f docker-compose.dev.yml exec app npm run db:reset
```

### Clean start (remove all data)

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up
```

## Environment Variables

The application uses environment variables for configuration. Default values are provided in `docker-compose.dev.yml`.

### Optional: Custom Configuration

To customize environment variables:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` with your custom values (JWT secrets, encryption keys, SMTP settings, etc.)
3. Docker Compose will automatically load the `.env` file if it exists
4. Restart containers to apply changes:
   ```bash
   docker-compose -f docker-compose.dev.yml restart
   ```

**Note:** Docker Compose automatically overrides `DATABASE_URL` and `REDIS_HOST` to use Docker service names (`postgres`, `redis`), so the `.env` file works for both local and Docker development.

## Automatic Bootstrapping

The Docker entrypoint script (`docker/entrypoint-dev.sh`) automatically performs the following on container startup:

1. **Wait for Dependencies**: Ensures PostgreSQL and Redis are ready
2. **Generate Prisma Client**: Runs `npm run db:generate`
3. **Database Migrations**: Runs `npm run db:migrate`
4. **Seed Database**: Runs `npm run db:seed` (idempotent)
5. **Seed Admin**: Runs `npm run db:seed:admin` (idempotent)
6. **Start Application**: Launches the development server

All seed operations are idempotent, so restarting containers won't create duplicate data.
The first startup can take longer than later starts because images, dependencies,
the Prisma client, and database migrations may all need to be prepared.

## Manual Database Operations

If you need to run database commands manually:

```bash
# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Seed database
docker-compose -f docker-compose.dev.yml exec app npm run db:seed

# Reset database (clear and re-seed)
docker-compose -f docker-compose.dev.yml exec app npm run db:reset

# Access Prisma Studio
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

## Notes

- The setup uses a single container running both frontend and backend via `npm run dev`
- Node modules are mounted as anonymous volumes to prevent host/container conflicts
- Hot-reloading works out of the box for both frontend and backend
- Redis and PostgreSQL data persist across container restarts
- Database bootstrapping happens automatically on every container start (idempotent)
- Both frontend and backend run concurrently in the same container
- The Compose service names are used for container-to-container communication
- Use `down -v` only when you are comfortable deleting local development data
