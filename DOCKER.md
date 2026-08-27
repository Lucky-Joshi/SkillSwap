# SkillSwap — Docker Setup

## Prerequisites

- Docker Engine 24+
- Docker Compose v2+

## Services

| Service     | Image             | Port  | Description                  |
|-------------|-------------------|-------|------------------------------|
| mongodb     | mongo:7           | 27017 | MongoDB database             |
| backend     | Node.js (build)   | 5000  | Express API server           |
| ai-service  | Python FastAPI    | 8000  | AI recommendation service    |

## Volumes

- `mongo_data` — Persistent MongoDB data

## Commands

```bash
# Start all services (build images first)
docker compose up --build

# Start in background
docker compose up --build -d

# Stop all services
docker compose down

# View logs
docker compose logs
docker compose logs -f backend
docker compose logs -f ai-service

# Rebuild a single service
docker compose build backend
docker compose up -d backend
```

## Environment Variables

Set in `docker-compose.yml` or via `.env` file:

```yaml
# Backend
PORT=5000
MONGODB_URI=mongodb://mongodb:27017/skillswap
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=password
```

## Production Considerations

- Use Docker secrets or a vault for sensitive credentials
- Enable TLS termination at a reverse proxy (nginx/Caddy)
- Set `NODE_ENV=production` on the backend service
- Use managed MongoDB (Atlas) instead of self-hosted in production
- Set resource limits (`deploy.resources.limits`) for each service
- Configure health checks in compose for orchestration readiness
- Use multi-stage builds to minimize image sizes
- Pin exact image versions to avoid unexpected updates
