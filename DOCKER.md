# Docker Setup

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- Supabase Postgres credentials and Resend email credentials in `backend/.env`

## Start

Apply database migrations from `backend/` first, then run from the repository root:

```bash
docker compose --env-file backend/.env up --build -d
```

Services:

| Service | Port | Exposure |
|---|---:|---|
| Backend | 5000 | Public API and Socket.IO |
| AI service | 8000 | Internal Compose network only |
| Supabase Postgres | 5432 | Managed database |

The `skillswap_uploads` volume persists uploaded profile images. Resume files use a
temporary private volume shared read-only with the AI service and are removed after
parsing.

## Operations

```bash
docker compose logs -f backend
docker compose logs -f ai-service
docker compose down
```

Production startup requires `NODE_ENV=production`, a 32+ character `JWT_SECRET`,
HTTPS browser origins, `DATABASE_URL`, `DIRECT_URL`, `EMAIL_FROM`, and `RESEND_API_KEY`.
Keep secrets in the deployment secret manager and never add `.env` files to Git.
