# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 1.0.x | Yes |

## Controls

- bcrypt password hashing, signed JWT authentication, database-backed account status
  checks, and role-based authorization
- hashed verification and reset tokens with expiration
- Prisma/Postgres queries, route validation, request limits, Helmet headers, and CORS
  origin allow-lists
- private temporary resume staging and relationship checks for Socket.IO chat events
- HTTPS-only production origins and startup validation for database, JWT, and email
  configuration

Do not commit `.env` files, database URLs, JWT secrets, or email provider keys. Rotate
credentials that have been exposed outside the secret store.

## Reporting Vulnerabilities

Report security issues to developer.lucky.joshi@gmail.com.
