# SkillSwap — System Architecture

## Overview

SkillSwap is a three-tier, full-stack platform for peer-to-peer skill exchange with a separate admin portal:

```
                        ┌─────────────────────────────────┐
                        │        React Frontend            │
                        │    (Vite · Tailwind · Framer)    │
                        │                                  │
                        │  Public Website  |  Protected App │
                        │  (/)             |  (/app/*)      │
                        │       Admin Portal (/admin/*)     │
                        │         Socket.IO Client          │
                        └────────────┬────────────────────┘
                                     │
                             HTTP + WebSocket
                                     │
┌────────────────────────────────────┼──────────────────────────────────────┐
│                        Node + Express Backend                             │
│                                                                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │  Auth     │  │  Upload  │  │  Validation  │  │  Error Handler        │ │
│  │  (JWT)    │  │ (Multer) │  │ (Validator)  │  │  (AppError + async)   │ │
│  └──────────┘  └──────────┘  └──────────────┘  └───────────────────────┘ │
│                                                                           │
│  Controllers                                                              │
│  ┌───────────┐ ┌─────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐ │
│  │ match     │ │ session     │ │ chat     │ │ dashboard  │ │ user      │ │
│  │(connect)  │ │(schedule)   │ │ (msg)    │ │  (stats)   │ │(profile)  │ │
│  └───────────┘ └─────────────┘ └──────────┘ └────────────┘ └───────────┘ │
│  ┌───────────┐ ┌─────────────┐ ┌──────────┐ ┌────────────┐ ┌───────────┐ │
│  │ admin     │ │recommend.   │ │ review   │ │ notification│ │badge/cert│ │
│  │(29 endpts)│ │(AI rank)    │ │ (rate)   │ │ (in-app)   │ │(earn)    │ │
│  └───────────┘ └─────────────┘ └──────────┘ └────────────┘ └───────────┘ │
│                                                                           │
│  Models                                                                   │
│  ┌───────────┐ ┌─────────────┐ ┌──────────┐ ┌───────────┐ ┌───────────┐  │
│  │ User      │ │ Connection  │ │ Session  │ │ Message   │ │ Review    │  │
│  │ Skill     │ │ (peer +     │ │          │ │           │ │ Badge     │  │
│  │ UserSkill │ │  mentor)    │ │          │ │           │ │ Certificate│ │
│  └───────────┘ └─────────────┘ └──────────┘ └───────────┘ └───────────┘  │
│  ┌───────────┐ ┌─────────────┐ ┌──────────┐                              │
│  │ Report    │ │ Institution │ │ UserBadge│                              │
│  └───────────┘ └─────────────┘ └──────────┘                              │
│                                                                           │
│  Services                                                                 │
│  ┌───────────────┐ ┌────────────┐ ┌───────────┐ ┌──────────────────────┐ │
│  │ mentorship    │ │ session    │ │ badge     │ │ trust                │ │
│  │ (authz gate)  │ │(lifecycle) │ │(auto-grant│ │ (score)              │ │
│  └───────────────┘ └────────────┘ └───────────┘ └──────────────────────┘ │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────────────────────────┐   │
│  │ Socket.IO    │ │ notification│ │ recommendation                   │   │
│  │ (realtime)   │ │ (in-app)    │ │ (compatibility scoring)          │   │
│  └──────────────┘ └─────────────┘ └──────────────────────────────────┘   │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────┐                          │
│  │ cleanup      │ │ reminder    │ │ AI client│                          │
│  │ (data purge) │ │ (scheduler) │ │ (fallback)│                         │
│  └──────────────┘ └─────────────┘ └──────────┘                          │
│                                                                           │
│  Utilities                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐   │
│  │ logger   │ │ metrics  │ │ paginate │ │ constants│ │ eventBus     │   │
│  │(Winston) │ │(counters)│ │          │ │          │ │(pub/sub)     │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────────┘   │
└───────────────────────────────────┬───────────────────────────────────────┘
                                    │
                               ┌────┴────┐
                               │ MongoDB │
                               │    7    │
                               └─────────┘

                        ┌──────────────────────────┐
                        │    FastAPI AI Service     │
                        │        (port 8000)        │
                        │                           │
                        │  /recommendations  (rank) │
                        │  /roadmap      (learn path│
                        │  /skills/graph   (graph)  │
                        │  /skills/related (suggest)│
                        │  /skills/similarity (0–1) │
                        │  /next-steps   (post sess)│
                        │  /resume/parse  (skills)  │
                        │  /health        (status)  │
                        │                           │
                        │  TF-IDF · SBERT · spaCy   │
                        │  NetworkX skill graph      │
                        │  TTL cache (thread-safe)   │
                        └──────────────────────────┘
```

### Component responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Frontend** | Rendering, routing, form state, realtime chat UI, theme. Three zones: public marketing, protected student app, admin portal. Talks only to the backend (same-origin via Vite proxy in dev, reverse proxy in prod). |
| **Backend** | Auth (JWT + bcrypt + role-based), REST API, Socket.IO realtime, file uploads (multer), business rules (connections, sessions, reviews, badges, certificates, leaderboard, points, reports), orchestration of the AI service with graceful fallback. |
| **AI Service** | Semantic skill matching, learning roadmap generation, skill-graph / related-skills queries, resume parsing (PDF/DOCX/TXT). |
| **MongoDB** | Single source of truth for all persisted data. |

---

## Frontend architecture

- **Build**: Vite 5 + React 18, Tailwind CSS v3.4, React Router v6, Framer Motion.
- **Routing** (`src/App.jsx`): all page modules are `React.lazy()`-loaded. Three route zones:
  - **Public** (`/`) — `PublicLayout`: marketing pages accessible to everyone
  - **Auth** (`/login`, `/register`, etc.) — `PublicOnlyRoute`: redirects logged-in users to their appropriate dashboard (admin → `/admin`, student → `/app/dashboard`)
  - **Student App** (`/app/*`) — `ProtectedRoute` + `MainLayout`: requires authentication
  - **Admin Portal** (`/admin/*`) — `ProtectedRoute` + `AdminLayout`: requires authentication + admin role
- **ScrollToTop**: Auto-scrolls to top on route changes (`components/ui/ScrollToTop.jsx`).
- **State**:
  - `AuthContext` — user + JWT (localStorage key `skillswap_token`), login/logout/register/update/refresh.
  - `ThemeContext` — dark/light toggle persisted in localStorage.
  - `SocketContext` — Socket.IO connection, authenticated with the JWT.
  - Local component state via hooks for page data; `react-hook-form` for forms.
- **Data access** (`src/services/`): axios instance adds `Authorization` header; response interceptor handles 401 (clears session) and normalizes errors. `unwrap()` returns `res.data`.
- **Realtime** (`context/SocketContext.jsx` + `pages/Chat.jsx`): Socket.IO client authenticated via JWT in handshake; each socket joins `user:<id>` room; unauthenticated connections rejected.
- **Optimization**: React.memo on heavy components, react-window for long lists, ErrorBoundary, PageSkeleton, CSS animation optimization.
- **Directory**: `components/ui` (presentational), `components/feature` (domain composites), `components/app` (sidebar, nav), `components/admin` (admin sidebar/topbar), `components/public` (marketing), `pages`, `layouts`, `hooks`, `context`, `services`, `utils`, `routes`.

### Key pages

| Route | Page | Description |
|-------|------|-------------|
| **Public** | | |
| `/` | Home | Landing page with hero, features, CTA |
| `/features` | Features | Platform feature showcase |
| `/how-it-works` | How It Works | Step-by-step guide |
| `/ai` | AI | AI capabilities showcase |
| `/about` | About | About SkillSwap |
| `/faq` | FAQ | Frequently asked questions |
| `/contact` | Contact | Contact page with developer info |
| `/privacy` | Privacy | Privacy policy |
| `/terms` | Terms | Terms of service |
| **Student App** | | |
| `/app/dashboard` | Dashboard | Stats, upcoming sessions, active connections, activity feed |
| `/app/discover` | Discover | Browse students with filters; admin users excluded |
| `/app/recommendations` | Recommendations | AI-ranked candidate cards with compatibility scores |
| `/app/connections` | Connections | Active mentorships, mentees, and peer connections with stats |
| `/app/chat` | Chat | Real-time messaging (locked until connection accepted) |
| `/app/sessions` | Sessions | Schedule, confirm, complete sessions; AI next-steps on completion |
| `/app/calendar` | Calendar | Monthly session view |
| `/app/roadmap` | AI Roadmap | Step-by-step learning path |
| `/app/notifications` | Notifications | Connection requests, session updates, badges |
| `/app/profile` | Profile | User profile with portfolio, skills, endorsements |
| `/app/leaderboard` | Leaderboard | Points ranking (admin users excluded) |
| `/app/settings` | Settings | Profile, account, privacy settings |
| `/app/certificates` | Certificates | Earned certificates |
| **Admin Portal** | | |
| `/admin` | Admin Dashboard | 21 stat cards, top skills, recent users |
| `/admin/users` | Users | User management (search, filter, CRUD, suspend) |
| `/admin/institutions` | Institutions | Institution management with merge |
| `/admin/skills` | Skills | Skill management with merge |
| `/admin/sessions` | Sessions | Session monitoring with charts |
| `/admin/badges` | Badges | Badge CRUD |
| `/admin/certificates` | Certificates | Certificate list with ratings |
| `/admin/reports` | Reports | Moderation report management |
| `/admin/ai` | AI Monitor | AI service status (auto-refresh 30s) |
| `/admin/health` | System Health | All system components (auto-refresh 15s) |
| `/admin/analytics` | Analytics | User growth, session stats, skill popularity |
| `/admin/settings` | Settings | Admin-specific settings |

---

## Backend architecture

- **Entry points**: `server.js` (boots HTTP + Socket.IO + attaches `io` to Express app) and `app.js` (Express app factory).
- **Middleware pipeline** (order in `app.js`): `helmet` → CORS (allowlist) → `express.json` → URL-encoded → `morgan` → `express-mongo-sanitize` → `xss-clean` → compression → static `/uploads` → API routes → `notFound` → `errorHandler`.
- **Layer separation**:
  - `routes/` — thin HTTP mapping + validation chains.
  - `controllers/` — request handling, authz checks, orchestration.
  - `services/` — cross-cutting logic: AI client + heuristics (`recommendationService`, `roadmapService`), badges, notifications, user serialization, mentorship/connection logic, cleanup, reminders.
  - `models/` — Mongoose schemas (14 models).
  - `middleware/` — `auth` (JWT + `restrictTo`), `validate` (express-validator results), `upload` (multer), `errorHandler`, `notFound`.
  - `scripts/` — `seed.js` (core data), `create-admin.js` (admin accounts).
  - `events/` — event bus + handlers for decoupled side effects.
  - `utils/` — `asyncHandler`, `AppError`, `paginate`, `logger` (Winston), `constants`, `metrics`.
- **Realtime** (`socket/index.js`): Socket.IO server authenticated via JWT in the handshake (`socket.handshake.auth.token`); each socket joins `user:<userId>`; unauthenticated connections rejected. The `io` instance is stored on the Express app (`app.set('io', io)`) for access in controllers.
- **Logging**: Winston logger with configurable levels (`LOG_LEVEL` env). Request IDs via `req.id`.
- **Metrics**: In-memory counters for socket connections, API requests, etc.

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
→ Email verified
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

## Admin portal

The admin portal is a completely separate section of the frontend with its own layout, sidebar, and topbar (purple accent theme). Admin routes are protected by `AdminGuard` which requires both authentication and `role: 'admin'`.

- Admin accounts are created via CLI: `node scripts/create-admin.js --name "Name" --email admin@example.com --password pw`
- The login page detects the user's role from the JWT payload and redirects accordingly
- Admin users are automatically excluded from student-facing features (discovery, recommendations, leaderboard)
- Admin dashboard provides 21 stat cards, top skills, and recent users
- Admin monitor pages auto-refresh AI service status (30s) and system health (15s)

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
