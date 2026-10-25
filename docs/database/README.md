# Database Documentation

The application uses PostgreSQL through Prisma ORM 7. The source of truth is
[`backend/prisma/schema.prisma`](../../backend/prisma/schema.prisma); checked-in
migrations live beside it in `backend/prisma/migrations/`.

Use `DATABASE_URL` for the runtime connection and `DIRECT_URL` for schema migrations.
Deploy schema changes with `npm run prisma:migrate:deploy` from `backend/`, then seed
reference data with `npm run seed` when provisioning a new database.

See [the schema overview](../database-schema.md) and
[Supabase deployment notes](../deployment/supabase.md) for details.
