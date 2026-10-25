# Security

## Authentication and authorization

- Passwords are hashed with bcryptjs (cost factor 12).
- API and Socket.IO sessions use signed JWTs. Production refuses the development
  secret and requires a unique secret of at least 32 characters.
- Protected requests reload the account state from Postgres and reject suspended,
  deleted, and banned users.
- Administrator role changes are restricted to super administrators.
- Verification and password-reset tokens are stored as SHA-256 hashes. Verification
  links expire after 24 hours; password-reset links expire after one hour.

## Personal data

- Prisma models and queries are the only database access layer.
- Public profile responses honor visibility, email, college, availability, contact,
  and portfolio-link privacy settings.
- Resume uploads are staged outside the public uploads directory and deleted after
  parsing. Do not expose the temporary resume volume.
- Database and email provider credentials remain on the backend and are never sent to
  Vite or browser code.

## Request hardening

- Helmet security headers, allow-listed credentialed CORS, bounded request bodies,
  and API/auth rate limits are enabled.
- Mutating routes validate IDs, enums, dates, URLs, file types, and field lengths.
- File upload sizes are capped and user-controlled filenames are not used on disk.
- Socket chat and typing events require an accepted relationship.
- Logs omit query strings so verification and reset tokens are not recorded.

## Production configuration

Set `NODE_ENV=production`, HTTPS values for `CLIENT_URL`, `CORS_ORIGINS`, and
`EMAIL_VERIFY_BASE_URL`, a verified `EMAIL_FROM`, a `RESEND_API_KEY`, database URLs,
and a unique `JWT_SECRET`. Keep `.env` files out of Git and rotate any credentials
that have been exposed outside the secret store.
