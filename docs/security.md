# SkillSwap — Security

## Authentication

- **Passwords** are hashed with **bcryptjs** (cost factor 12) via a Mongoose
  `pre('save')` hook. The hash is never exposed — the field is `select: false` and
  `userService.publicUser()` deletes it from every API response.
- **JWT** bearer tokens (HS256) signed with `JWT_SECRET`, default expiry `7d`
  (`JWT_EXPIRES_IN`). The middleware (`middleware/auth.js`) verifies the token on
  every protected route and attaches `req.user` (freshly loaded from the DB).
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
- Demo mode (`DEMO_MODE=true`) auto-verifies on register and the mailer is a
  **console logger** — never wire a real SMTP key into a demo `.env`.

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

A rate limiter (`express-rate-limit`) is applied to the API, with stricter limits
on auth endpoints (login/register/forgot-password) to slow credential-stuffing and
spam.

- General API: 500 requests / 15 minutes
- Auth endpoints: 30 requests / 15 minutes

## CORS

CORS is restricted to the allowlist in `app.js` (frontend origin, default
`http://localhost:5173`). Socket.IO uses the same origin policy.

## Authorization

- Protected routes require a valid JWT.
- Ownership checks everywhere relevant, e.g.:
  - Sessions: only a participant can update/complete a session (`403` otherwise).
  - Skills: only your own `UserSkill` rows can be modified/deleted.
  - Notifications/reviews/certificates are scoped to the authenticated user.
- Connection creation is **unique per pair** (`{userA, userB}` compound index),
  so duplicate/unsolicited repeated requests are rejected.
- Chat and session creation require an **active connection** (`assertCanInteract`).
  Without an accepted connection, returns 403.
- Role-based access via `restrictTo(...roles)` for admin-only routes.

## Connection access control

The `mentorshipService` enforces a strict gate:

1. `findRelationship(a, b)` — finds an accepted + active Connection between two users
2. `canInteract(a, b)` — boolean check
3. `assertCanInteract(a, b)` — throws 403 if no valid connection exists

This is used by:
- `chatController` — message sending and conversation listing
- `sessionController` — session creation
- `socket/index.js` — realtime message delivery

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

## Secrets checklist (before production)

1. Generate a strong random `JWT_SECRET` (and rotate refresh secrets).
2. Use MongoDB Atlas (TLS + IP allowlist) — never the default local URI.
3. Set `NODE_ENV=production` (hides stack traces, enables prod middleware).
4. Enable a real transactional email provider and disable `DEMO_MODE`.
5. Terminate TLS at the reverse proxy (HTTPS for everything).
6. Add user role checks for admin-only routes before exposing.
