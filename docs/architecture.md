# Architecture

```
[Flutter mobile] ─┐
[Next.js web]    ─┼─▶ [Nginx] ─▶ [NestJS API] ─┬─▶ PostgreSQL (Prisma)
[Integrations]   ─┘                            ├─▶ Redis (sessions, cache, BullMQ)
                                               ├─▶ MinIO (object storage)
                                               └─▶ FCM / SMTP / WhatsApp
```

## Request lifecycle (API)

Every non-`@Public()` request passes the global guard chain (`apps/api/src/app.module.ts`):

1. **JwtAuthGuard** — validates the access token, loads the user's roles +
   permissions onto `request.user`.
2. **TenantGuard** — resolves `request.tenantId`; rejects cross-tenant access.
   Platform users may scope into a tenant via `x-tenant-id`.
3. **PermissionGuard** — enforces `@RequirePermissions('module.action.scope')`
   with scope widening (a wider held scope satisfies a narrower requirement).

Then `ValidationPipe` (whitelist + transform) validates the DTO, the handler
runs, and sensitive actions are recorded via `AuditService`.

## Data conventions

- UUID primary keys everywhere (PRD §0.7).
- `tenant_id` on every tenant-scoped row; standard audit + soft-delete fields
  (`created/updated/deleted_at`, `created/updated/deleted_by`).
- Roles & permissions are **seeded data**, not code (`prisma/seed.ts`).

## Packages

`@kitalent/types` (enums/RBAC vocabulary) → consumed by API, web.
`@kitalent/i18n` (catalogs) and `@kitalent/design-tokens` (Light/Dark) → web + mobile share the vocabulary.
`@kitalent/shared` (locale formatters, pagination contracts) → API + web.

See `theme-guideline.md` and `i18n-guideline.md` for the cross-cutting rules.
