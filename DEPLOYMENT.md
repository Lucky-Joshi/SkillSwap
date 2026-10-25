# SkillSwap Deployment

SkillSwap runs as a React/Vite frontend, an Express + Socket.IO API, a FastAPI AI
service, and Supabase Postgres. Only the API should be exposed publicly; the AI
service stays on the private service network.

## Docker Compose

1. Copy `backend/.env.example` to `backend/.env` and fill in the production values.
2. Apply database migrations from `backend/` with `npm ci`, `npm run prisma:generate`,
   and `npm run prisma:migrate:deploy`.
3. Start services from the repository root:

```bash
docker compose --env-file backend/.env up --build -d
```

Compose runs the backend in production mode, keeps uploads in a named volume, and
waits for the AI service health check before starting the API.

## Deploying services separately

### Frontend

- Build in `frontend/` with `npm ci && npm run build`.
- Publish `frontend/dist` as a static SPA.
- Set `VITE_API_URL` to the API origin and `VITE_SOCKET_URL` to the Socket.IO origin.
- Configure SPA fallback routing at the static host.

### Backend

Use Node.js 20.19+ (Node 22 recommended) or the included Docker image. Set:

For a Render native Node service, set the root directory to `backend`, the build
command to `npm ci && npm run prisma:generate`, and the start command to `npm start`.
Configure the required production variables in the Render service environment;
never copy local secrets into the repository. Signup and login work without email
delivery. Email verification and email-based password reset are not included.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Runtime Postgres connection (use Supabase's pooler if needed) |
| `DIRECT_URL` | Direct Postgres connection for migrations |
| `JWT_SECRET` | Unique random secret, at least 32 characters |
| `CLIENT_URL` | HTTPS frontend origin |
| `CORS_ORIGINS` | Comma-separated HTTPS browser origins |
| `AI_SERVICE_URL` | Private AI service URL |
| `UPLOAD_DIR` | Persistent public image upload directory |
| `RESUME_DIR` | Private temporary resume staging directory |

Apply migrations before releasing a version that changes the Prisma schema. Run
`npm run seed` once to seed skills, badges, and institutions. Create the first admin
with `npm run create-admin -- --name "Admin" --email admin@example.com --password <strong-password>`.

### AI service

Build from `ai-service/Dockerfile` and set its internal port to `8000`. Keep it on a
private network because the service does not authenticate requests itself.

For a Render native Python service, set the root directory to `ai-service`, the build
command to `pip install -r requirements.txt`, the start command to
`uvicorn app:app --host 0.0.0.0 --port $PORT`, and the health check path to `/health`.
Keep spaces between every command argument; without them Uvicorn treats the options
as part of the app name and port argument.

## Health and operations

- API health: `/api/health/health`
- AI health: `/health`
- Socket.IO uses the API HTTP port; configure WebSocket forwarding and sticky sessions
  when the hosting platform requires them.
- Persist `/app/uploads`; resume staging is temporary and should be cleared after use.
- AI recommendations fall back to Node heuristics when the AI service is unavailable.

## Local development

Use `backend/.env.example` with local `CLIENT_URL`, `CORS_ORIGINS`, and AI URL values.
Run Postgres, then `npm run prisma:generate`, `npm run prisma:migrate:deploy`, and
`npm run dev` from `backend/`. Run the frontend with `npm run dev` from `frontend/`.
