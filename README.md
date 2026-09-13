# tasky

<p align="center">
  <img src="assets/logo/tasky-logo.png" alt="tasky logo" width="180">
</p>

<p align="center">
  <strong>Project management with conversational AI task execution.</strong><br>
  Plan work, coordinate teams, and turn natural-language requests into action.
</p>

<p align="center">
  <a href="ROADMAP.md">Roadmap</a> ·
  <a href="SECURITY.md">Security</a> ·
  <a href="LICENSE">License</a>
</p>

tasky is a self-hosted project management platform that combines structured project workflows with an in-app conversational AI assistant. Teams can manage work in familiar project views while using natural language to create, update, organize, and inspect tasks.

The application is built as a monorepo with a Next.js frontend, a NestJS API, PostgreSQL for application data, and Redis for background jobs. Uploaded files can use local storage or an S3-compatible bucket.

## Highlights

- Conversational AI for creating and updating project work
- Projects, tasks, Kanban boards, sprints, dependencies, and time tracking
- Calendar and interactive Gantt views
- Dashboards with KPI metrics and configurable widgets
- CSV and Excel import and export
- Jira and Trello importers with field mapping
- OpenID Connect authentication and role-based access control
- Administration dashboard and activity logging
- Background jobs through BullMQ and Redis
- Localized user interface
- Local or S3-compatible file storage

## Architecture

```text
Browser
  |
  +-- Next.js frontend
  |     Development: http://localhost:3001
  |
  +-- NestJS API
        Development: http://localhost:3000
        Production:  http://localhost:3000
        |
        +-- PostgreSQL 16
        +-- Redis 7
        +-- Optional S3-compatible object storage
```

In development, Docker Compose runs PostgreSQL, Redis, the API, and the frontend with the source tree mounted for live development. The production image builds the frontend and backend into one container and exposes port 3000.

## Requirements

For the recommended Docker workflow:

- Docker Engine 24 or newer
- Docker Compose v2
- At least 4 GB of memory available to Docker

For running services directly on the host:

- Node.js 22 or newer
- npm 10 or newer
- PostgreSQL 16 or newer
- Redis 7 or newer

## Quick Start With Docker

1. Clone the repository:

   ```bash
   git clone https://github.com/sfgco/tasky-ai.git
   cd tasky-ai
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env
   ```

3. Replace the example secrets in `.env`. Generate values with:

   ```bash
   openssl rand -base64 32  # JWT_SECRET
   openssl rand -base64 32  # JWT_REFRESH_SECRET
   openssl rand -hex 32     # ENCRYPTION_KEY
   ```

   Use different values for each variable. Do not commit `.env` or share production secrets.

4. Build and start the development stack:

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

   The development entrypoint waits for PostgreSQL and Redis, generates the Prisma client, applies migrations, seeds the database, and starts both application servers.

5. Open the application:

   - Frontend: [http://localhost:3001](http://localhost:3001)
   - API: [http://localhost:3000](http://localhost:3000)
   - Health check: [http://localhost:3000/api/health](http://localhost:3000/api/health)

The development Compose file publishes PostgreSQL on port 5435 and Redis on port 6379. Inside the Docker network, the application connects to the services as `postgres` and `redis`.

### Development Container Commands

```bash
# Follow application logs
docker compose -f docker-compose.dev.yml logs -f app

# Stop containers and keep persistent volumes
docker compose -f docker-compose.dev.yml down

# Stop containers and delete database, Redis, and upload data
docker compose -f docker-compose.dev.yml down -v
```

## Run Without Docker

Start PostgreSQL and Redis locally, then make sure `.env` points to services reachable from your host. Install dependencies and generate the Prisma client:

```bash
npm install
npm run db:generate
```

Apply the development schema and seed data:

```bash
npm run db:migrate
npm run db:seed
npm run db:seed:admin
```

Start both servers:

```bash
npm run dev
```

You can also start one service at a time:

```bash
npm run dev:backend   # http://localhost:3000
npm run dev:frontend  # http://localhost:3001
```

## Production Deployment

The production Compose file builds the optimized image, runs migrations, and serves the application on port 3000.

1. Create and edit the environment file:

   ```bash
   cp .env.example .env
   ```

2. Set strong values for `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `ENCRYPTION_KEY`. Configure `FRONTEND_URL`, `CORS_ORIGIN`, database credentials, and any email or S3 settings needed by your deployment.

3. Build and start the stack:

   ```bash
   docker compose --env-file .env -f docker-compose.prod.yml up -d --build
   ```

4. Check service status and logs:

   ```bash
   docker compose --env-file .env -f docker-compose.prod.yml ps
   docker compose --env-file .env -f docker-compose.prod.yml logs -f app
   ```

5. Open [http://localhost:3000](http://localhost:3000).

Set `APP_PORT` to publish a different host port. For a public deployment, put the application behind HTTPS, restrict CORS to the public frontend origin, and use separately secured or managed PostgreSQL and Redis services where appropriate.

## Configuration

`.env.example` is the source of truth for available settings. The most important variables are:

| Variable | Purpose | Typical value |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL connection string when running outside Compose | `postgresql://tasky:tasky@localhost:5432/tasky` |
| `REDIS_HOST` / `REDIS_PORT` | Redis connection | `localhost` / `6379` |
| `JWT_SECRET` | Access-token signing secret | Required secret |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret | Required secret |
| `ENCRYPTION_KEY` | Encryption for sensitive values | Required 64-character hex value |
| `FRONTEND_URL` | Frontend origin used by the backend | `http://localhost:3001` |
| `CORS_ORIGIN` | Allowed browser origin | `http://localhost:3001` |
| `NEXT_PUBLIC_API_BASE_URL` | API URL used by the frontend | `http://localhost:3000/api` |
| `UPLOAD_DEST` | Local upload directory | `./uploads` |
| `MAX_FILE_SIZE` | Maximum upload size in bytes | `10485760` |
| `SMTP_*` | Outbound email configuration | Optional |
| `AWS_*` | S3-compatible file storage | Optional |
| `AI_ALLOWED_HOSTS` | Hostnames permitted for AI requests | Optional allowlist |
| `AI_ALLOW_PRIVATE_ENDPOINTS` | Permit private-network AI endpoints | `false` |

Compose overrides `DATABASE_URL` and `REDIS_HOST` with the internal service names. Keep secrets and deployment-specific values in `.env`; do not replace the Compose service names with `localhost` when the app runs inside Docker.

## Useful Commands

Run commands from the repository root:

```bash
# Build and quality checks
npm run build
npm run lint
npm run test

# Run targeted checks
npm run lint:frontend
npm run lint:backend
npm run test:frontend
npm run test:backend
npm run test:e2e

# Database administration
npm run db:migrate
npm run db:migrate:deploy
npm run db:generate
npm run db:studio
npm run db:seed:admin
```

`npm run db:reset` deletes local database data and should only be used when that is intentional.

## Repository Layout

```text
backend/                NestJS API, Prisma schema, migrations, and tests
frontend/               Next.js application and end-to-end tests
assets/logo/            Project branding assets
docker/                 Container entrypoints and Docker notes
scripts/                Build and packaging scripts
Dockerfile.dev          Development image
Dockerfile.prod         Multi-stage production image
docker-compose.dev.yml  Development services
docker-compose.prod.yml Production services
.env.example            Environment variable reference
ROADMAP.md              Planned and completed work
SECURITY.md             Vulnerability reporting guidance
```

## Troubleshooting

### Ports are already in use

The development stack publishes ports 3000, 3001, 5435, and 6379. Stop the process using the conflicting port or change the published port in `docker-compose.dev.yml`. Keep the internal application ports at 3000 and 3001.

### PostgreSQL or Redis is unavailable

Check container health and logs:

```bash
docker compose -f docker-compose.dev.yml ps
docker compose -f docker-compose.dev.yml logs postgres redis app
```

When running outside Docker, verify that `DATABASE_URL`, `REDIS_HOST`, and `REDIS_PORT` use host-reachable addresses.

### Configuration changes are not picked up

Restart the stack after changing `.env`:

```bash
docker compose -f docker-compose.dev.yml down
docker compose -f docker-compose.dev.yml up --build
```

### The database schema is out of date

For development, run:

```bash
npm run db:migrate
```

For a deployed database, use the migration deployment command:

```bash
npm run db:migrate:deploy
```

## Security

Never commit `.env`, credentials, generated secrets, or uploaded user data. Use unique secrets per environment, enable Redis authentication in production, serve the application over HTTPS, restrict CORS to the real frontend origin, and review the AI and Jira host allowlists before enabling private-network access.

Report vulnerabilities privately using the process in [SECURITY.md](SECURITY.md) instead of opening a public issue.

## Roadmap

See [ROADMAP.md](ROADMAP.md) for planned work across authentication, analytics, imports and exports, AI capabilities, and team collaboration.

## License

tasky is distributed under the license described in [LICENSE](LICENSE).