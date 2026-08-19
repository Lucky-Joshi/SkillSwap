# SkillSwap — Deployment

Three deployable artifacts:

| Service | Tech | Port | Artifact |
|---------|------|------|----------|
| `frontend` | React + Vite (static SPA) | 5173 (dev) | `frontend/dist` |
| `backend` | Node + Express + Socket.IO | 5000 | Docker image |
| `ai-service` | Python FastAPI | 8000 | Docker image |
| `mongodb` | MongoDB 7 | 27017 | Docker volume |

---

## Option A — Docker Compose (local, everything at once)

```bash
docker compose up --build
```

- `mongodb` — `mongo:7`, named volume `mongo_data`, port `27017`.
- `backend` — built from `backend/Dockerfile` (`node:20-alpine`), depends on
  mongo + ai-service, env: `MONGO_URI=mongodb://mongodb:27017/skillswap`,
  `AI_SERVICE_URL=http://ai-service:8000`, `CLIENT_URL=http://localhost:5173`.
- `ai-service` — built from `ai-service/Dockerfile` (`python:3.11-slim`), port `8000`.

Open `http://localhost:5173` and register a new account.

To seed inside the container:

```bash
docker compose exec backend npm run seed
```

---

## Option B — Manual (local development)

### Backend (`backend/`)

```bash
npm install
cp .env.example .env        # adjust values
npm run seed                # seed core data (skills, badges, institutions)
npm run dev                 # http://localhost:5000 (nodemon)
```

### AI service (`ai-service/`)

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate   |   macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Install optional extras for full semantic matching:

```bash
pip install sentence-transformers spacy
python -m spacy download en_core_web_sm
```

### Frontend (`frontend/`)

```bash
npm install
cp .env.example .env
npm run dev                 # http://localhost:5173 (Vite proxy → :5000)
npm run build               # production bundle in dist/
```

---

## Option C — Production

### Frontend → Vercel / Netlify

- Build command `npm run build`, output dir `frontend/dist`.
- Set `VITE_API_URL` to the deployed backend URL (e.g. `https://api.skillswap.dev`)
  and `VITE_SOCKET_URL` to the Socket.IO origin.
- The Vite proxy (`/api` → `:5000`) is dev-only; the production build calls the
  absolute URLs.

### Backend + AI service → Railway / Render / Fly.io

- Two services, one per Dockerfile.
- **Backend env**:
  - `MONGO_URI` → MongoDB Atlas connection string
  - `JWT_SECRET` → strong random value
  - `AI_SERVICE_URL` → internal URL of the deployed AI service
  - `CLIENT_URL` → frontend URL (CORS + Socket.IO origin)
  - `UPLOAD_DIR`, `EMAIL_VERIFY_BASE_URL`
- **AI service**: just set the port (8000). Keep it reachable only by the backend
  (private network / firewall) — it has no auth of its own.
- Enable health checks on `/api/health` (backend) and `/health` (AI service).

### Database → MongoDB Atlas

- Create a cluster, allow-list deployment IPs, enable TLS (default).
- Put the SRV connection string in `MONGO_URI`.
- Run core data seeder to populate skills, badges, and institutions: `npm run seed` with the production env.

---

## Environment reference

| Variable | Used by | Default | Notes |
|----------|---------|---------|-------|
| `NODE_ENV` | backend | `development` | `production` hides stack traces |
| `PORT` | backend | `5000` | |
| `MONGO_URI` | backend | `mongodb://localhost:27017/skillswap` | Atlas in prod |
| `JWT_SECRET` | backend | dev secret | **must** change in prod |
| `JWT_EXPIRES_IN` | backend | `7d` | |
| `AI_SERVICE_URL` | backend | `http://localhost:8000` | |
| `AI_SERVICE_TIMEOUT` | backend | `4000` | ms |
| `CLIENT_URL` | backend | `http://localhost:5173` | CORS + Socket.IO |
| `UPLOAD_DIR` | backend | `uploads` | |
| `EMAIL_VERIFY_BASE_URL` | backend | `http://localhost:5173/verify-email` | |
| `VITE_API_URL` | frontend | `''` (same origin) | absolute API base in prod |
| `VITE_SOCKET_URL` | frontend | `window.location.origin` | Socket.IO origin |

---

## Operational notes

- **Graceful degradation**: if the AI service is down, recommendations, roadmaps,
  and session completion next-steps automatically fall back to Node heuristics
  (`aiService: false` in the response) — the platform keeps working.
- **Uploads**: `backend/uploads/` must be persistent across restarts (bind mount
  or object storage) or avatars/resumes will be lost.
- **WebSocket**: Socket.IO shares the backend HTTP port; behind a load balancer,
  enable sticky sessions / websocket support.
- **Sizing**: the AI service is CPU-light in TF-IDF mode; sentence-transformers
  needs ≥ 2 GB RAM per worker.
