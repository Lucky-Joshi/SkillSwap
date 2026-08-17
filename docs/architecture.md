# SkillSwap — System Architecture

## Overview

SkillSwap is a three-tier, full-stack platform for peer-to-peer skill exchange:

```
┌────────────────────────────┐
│   React + Vite Frontend    │   Port 5173
│  (SPA, lazy-loaded routes) │
└──────────┬─────────────────┘
           │ Axios (REST) / Socket.IO (realtime)
┌──────────▼─────────────────┐
│   Node.js + Express API    │   Port 5000
│  (JWT auth, Socket.IO)     │
└──────────┬──────────┬──────┘
           │          │
  ┌────────▼──┐  ┌────▼────────────┐
  │  MongoDB  │  │  FastAPI AI     │   Port 8000
  │ (Mongoose)│  │  Service        │
  └───────────┘  └─────────────────┘
```

### Component responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Frontend** | Rendering, routing, form state, realtime chat UI, theme. Talks only to the backend (same-origin via Vite proxy in dev, reverse proxy in prod). |
| **Backend** | Auth (JWT + bcrypt), REST API, Socket.IO realtime, file uploads (multer), business rules (connections, sessions, reviews, badges, certificates, leaderboard, points), orchestration of the AI service with graceful fallback. |
| **AI Service** | Semantic skill matching, learning roadmap generation, skill-graph / related-skills queries, resume parsing (PDF/DOCX/TXT). |
| **MongoDB** | Single source of truth for all persisted data. |

---

## Frontend architecture

- **Build**: Vite + React 18, Tailwind CSS (dark mode via `class`), React Router v6, Framer Motion.
- **Routing** (`src/App.jsx`): all page modules are `React.lazy()`-loaded. Public pages (`/login`, `/register`, …) are wrapped in `PublicOnly`; authed pages are wrapped in `Protected` + `MainLayout`.
- **State**:
  - `AuthContext` — user + JWT (localStorage key `skillswap_token`), login/logout/register/update.
  - `ThemeContext` — dark/light toggle persisted in localStorage.
  - `SocketContext` — Socket.IO connection, authenticated with the JWT.
  - Local component state via hooks for page data; `react-hook-form` for forms.
- **Data access** (`src/services/`): axios instance adds `Authorization` header; response interceptor handles 401 (clears session) and normalizes errors. `unwrap()` returns `res.data`.
- **Realtime** (`src/services/socket.js`): joins `user:<id>` room; emits `message:send`, `messages:read`, `typing`; listens for `message:new`, `message:sent`, `messages:read-confirmed`, `typing`, `notification:new`.
- **Directory**: `components/ui` (presentational), `components/feature` (domain composites), `pages`, `layouts`, `hooks`, `context`, `services`, `utils`.

### Key pages

| Route | Page | Description |
|-------|------|-------------|
| `/dashboard` | Dashboard | Stats, upcoming sessions, active connections, activity feed |
| `/discover` | Discover | Browse students with filters; tabs for mentors, mentees, peer learning |
| `/recommendations` | Recommendations | AI-ranked candidate cards with compatibility scores |
| `/connections` | Connections | Active mentorships, mentees, and peer connections with stats |
| `/chat` | Chat | Real-time messaging (locked until connection accepted) |
| `/sessions` | Sessions | Schedule, confirm, complete sessions; AI next-steps on completion |
| `/calendar` | Calendar | Monthly session view |
| `/roadmap` | AI Roadmap | Step-by-step learning path |
| `/notifications` | Notifications | Connection requests, session updates, badges |
| `/profile/:id` | Profile | User profile with relationship stats for connected users |
| `/leaderboard` | Leaderboard | Points ranking |

---

## Backend architecture

- **Entry points**: `server.js` (boots HTTP + Socket.IO) and `app.js` (Express app factory).
- **Middleware pipeline** (order in `app.js`): `helmet` → CORS (allowlist) → `express.json` → URL-encoded → `morgan` → `express-mongo-sanitize` → `xss-clean` → compression → static `/uploads` → API routes → `notFound` → `errorHandler`.
- **Layer separation**:
  - `routes/` — thin HTTP mapping + validation chains.
  - `controllers/` — request handling, authz checks, orchestration.
  - `services/` — cross-cutting logic: AI client + heuristics (`recommendationService`, `roadmapService`), badges, notifications, user serialization, mentorship/connection logic.
  - `models/` — Mongoose schemas.
  - `middleware/` — `auth` (JWT), `validate` (express-validator results), `upload` (multer), `errorHandler`, `notFound`.
- **Realtime** (`socket/index.js`): Socket.IO server authenticated via JWT in the handshake (`socket.handshake.auth.token`); each socket joins `user:<userId>`; unauthenticated connections rejected.

### AI integration & graceful degradation

`services/aiClient.js` wraps FastAPI with a short timeout (default 4 s). Controllers call
`aiClient.tryAi(path, payload, fallback)` — on any network failure or timeout the
**heuristic fallback** (`recommendationService.js` / `roadmapService.js`) runs instead,
so the platform remains fully functional with the Python stack down.

---

## Connection model

The core relationship entity is the **Connection** (formerly Match). It supports two types:

```
Connection
├── userA        ObjectId → User (the "mentor" in mentorship, or requester in peer)
├── userB        ObjectId → User (the "learner" in mentorship, or target in peer)
├── type         'mentorship' | 'peer'
├── skills       [{skillId, name}] — matched skill context
├── skillAteaches  String — what userA teaches (peer mode)
├── skillBteaches  String — what userB teaches (peer mode)
├── status       'pending' | 'accepted' | 'rejected' | 'cancelled'
├── requestedBy  ObjectId → User
├── active       Boolean (true when accepted)
└── timestamps
```

**Unique compound index `{userA, userB}`** — one connection per pair.

Chat and sessions are only unlocked when `status === 'accepted'` AND `active === true`.

---

## Core user journey

```
Landing → Register (3 steps: account → profile → skills)
→ Email verified (demo mode auto-verifies)
→ Dashboard (profile completion, stats, upcoming sessions)
→ AI Recommendations (semantic scoring) / Discover (filter + search)
→ Send learning/mentorship/peer request → recipient accepts/rejects (notifications + badge)
→ Chat in real time (Socket.IO)
→ Schedule a session (create → pending → confirmed)
→ Complete session → auto certificate, points, badges, AI suggests next topic
→ Review each other → rating updates
→ Leaderboard ranks by points
```

---

## Badge & points model

Badges are defined in the `Badge` collection and checked by `services/badgeService.js`
(`evaluateBadges` runs after profile updates, sessions complete, etc.). Granting a badge
also credits its `points` to the user, feeding the leaderboard.

| Badge | Trigger |
|-------|---------|
| First Steps | ≥ 1 skill added |
| Profile Pro | ≥ 3 skills + bio |
| Skill Collector | ≥ 5 skills |
| First Match | ≥ 1 connection (non-rejected) |
| Networker | ≥ 3 connections |
| Session Master | ≥ 1 completed session |
| Mentor Star | ≥ 5 reviews received |
| Top Contributor | ≥ 100 points |

Certificates are generated automatically when a session is marked `completed`
(`certificateController`), with an ID like `SS-XXXXXX`.
