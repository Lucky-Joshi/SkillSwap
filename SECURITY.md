# SkillSwap — Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Authentication

- JWT tokens with httpOnly cookies
- bcrypt password hashing (cost factor 12)
- Email verification with 6-digit codes
- Password reset via time-limited tokens
- Role-based access control (student/admin)

## Rate Limiting

- Global: 100 requests per 15 minutes
- Auth endpoints: 5 requests per 15 minutes
- AI endpoints: 20 requests per minute

## Input Validation

- express-validator on all routes
- Mongoose schema validation
- File upload size limits (5MB for avatars/resumes)

## Security Headers

- Helmet.js (CSP, HSTS, X-Frame-Options, etc.)
- XSS cleaning via xss-clean
- NoSQL injection prevention via express-mongo-sanitize

## CORS

- Configurable allowlist via CLIENT_URL env var
- Credentials enabled for cross-origin auth

## Reporting Vulnerabilities

Please report security issues to: developer.lucky.joshi@gmail.com
