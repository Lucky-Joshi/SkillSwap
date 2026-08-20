# SkillSwap — Security

## Authentication

- **Passwords** are hashed with **bcryptjs** (cost factor 12) via a Mongoose
  `pre('save')` hook. The hash is never exposed — the field is `select: false` and
  `userService.publicUser()` deletes it from every API response.
- **JWT** bearer tokens (HS256) signed with `JWT_SECRET`, default expiry `7d`
  (`JWT_EXPIRES_IN`). The middleware (`middleware/auth.js`) verifies the token on
  every protected route and attaches `req.user` (freshly loaded from the DB). The
  JWT payload includes the user's `role` for client-side routing.
- **Socket.IO** authenticates with the same JWT passed in the handshake
  (`socket.handshake.auth.token`); invalid/expired tokens are rejected before a
  connection is established.
- The frontend stores the token in localStorage and clears it on any `401`.

> Production note: the demo uses a stored token with a `7d` lifetime. For a
> production deployment, prefer short-lived access tokens + rotating refresh
> cookies (`httpOnly`, `Secure`), and rotate `JWT_SECRET` out of any committed
> example file.

## Email verification & password reset

- New accounts get a 6-digit verification code; `/auth/verify-email` validates it.
- `forgot-password` issues a short-lived `resetToken` + `resetTokenExpiry`;
  `reset-password/:token` validates the token and expiry.
- Email verification uses a 6-digit code; production deployments should use a
  transactional email provider (SendGrid, AWS SES, etc.).

## Input validation

- **express-validator** chains on every mutating route (email format, name length,
  password min 8, Mongo ObjectId format, rating 1–5, ISO dates, URL format for
  social links, enum membership for status/year/availability/category/type).
- A shared `validate` middleware returns a `400` with the first field error before
  the controller runs.

## Payload hardening

- `helmet` — security-relevant HTTP headers (CSP, HSTS, X-Content-Type-Options…).
- `express-mongo-sanitize` — strips `$` and `.` keys to prevent **NoSQL injection**.
- `xss-clean` — sanitizes user-provided strings (XSS protection).
- `compression` + JSON body limits (`express.json({ limit: '1mb' })`).

## Rate limiting

Rate limiters (`express-rate-limit`) are configurable via environment variables:

| Scope | Default | Env variable |
|-------|---------|-------------|
| General API | 500 req / 15 min | `RATE_LIMIT_GLOBAL` |
| Auth endpoints | 30 req / 15 min | `RATE_LIMIT_AUTH` |
| AI endpoints | 20 req / 15 min | `RATE_LIMIT_AI` |

Stricter limits on auth endpoints slow credential-stuffing and spam.

## CORS

CORS is restricted to the allowlist configured via `CORS_ORIGINS` env (comma-separated)
or falls back to `CLIENT_URL`. Socket.IO uses the same origin policy.

## Authorization

- Protected routes require a valid JWT.
- **Role-based access control**: `restrictTo(...roles)` middleware checks `req.user.role`
  against allowed roles. Admin-only routes require `role: 'admin'`.
- Ownership checks everywhere relevant, e.g.:
  - Sessions: only a participant can update/complete a session (`403` otherwise).
  - Skills: only your own `UserSkill` rows can be modified/deleted.
  - Notifications/reviews/certificates are scoped to the authenticated user.
- Connection creation is **unique per pair** (`{userA, userB}` compound index),
  so duplicate/unsolicited repeated requests are rejected.
- Chat and session creation require an **active connection** (`assertCanInteract`).
  Without an accepted connection, returns 403.
- **Suspended users** are blocked from accessing protected routes (checked via `isSuspended` field).
- Admin users are automatically excluded from student-facing features:
  - `searchUsers`: `role: { $ne: 'admin' }` filter
  - `getRecommendations`: `role: { $ne: 'admin' }` filter
  - `getLeaderboard`: `role: { $ne: 'admin' }` filter

## Connection access control

The `mentorshipService` enforces a strict gate:

1. `findRelationship(a, b)` — finds an accepted + active Connection between two users
2. `canInteract(a, b)` — boolean check
3. `assertCanInteract(a, b)` — throws 403 if no valid connection exists

This is used by:
- `chatController` — message sending and conversation listing
- `sessionController` — session creation
- `socket/index.js` — realtime message delivery

## Admin account management

- Admin accounts are created via CLI script: `node scripts/create-admin.js --name "Name" --email admin@example.com --password pw`
- The script handles three cases: create new admin, promote existing user, detect already-admin
- The login page reads the user's role from the JWT payload and redirects:
  - `admin` → `/admin`
  - `student` → `/app/dashboard`
- Admin portal is protected by `AdminGuard` (checks both authentication and `role === 'admin'`)

## File uploads

- `multer` with `limits.fileSize` (default 5 MB) and a filename whitelist
  (`avatar` → images, `resume` → PDF/DOCX/TXT).
- Uploaded files land in `backend/uploads/` and are served from `/uploads` by the
  backend; filenames are regenerated (`<timestamp>-<random>`) to avoid traversal
  and collisions.
- In production, serve uploads from a CDN / object storage and scan them.

## Error handling

- `utils/AppError` + `asyncHandler` wrap async controllers.
- The central `errorHandler` returns JSON errors (`success:false`,
  `status:'fail'|'error'`, `message`). In production the `stack` is omitted.
- Unmatched routes hit a JSON `notFound` handler (no HTML leak).
- Winston logger captures all errors with request IDs for traceability.

## Secrets checklist (before production)

1. Generate a strong random `JWT_SECRET` (and rotate refresh secrets).
2. Use MongoDB Atlas (TLS + IP allowlist) — never the default local URI.
3. Set `NODE_ENV=production` (hides stack traces, enables prod middleware).
4. Enable a real transactional email provider.
5. Terminate TLS at the reverse proxy (HTTPS for everything).
6. Admin role checks are enforced via `restrictTo('admin')` middleware on all admin routes.
7. Create admin accounts via `create-admin.js` script — never seed demo admins.
