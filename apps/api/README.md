# @kitalent/api

NestJS API-first backend. PostgreSQL (Prisma) + Redis + MinIO.

## Cross-cutting guarantees (wired globally)

- **Auth** — `JwtAuthGuard` (global; opt out with `@Public()`), Argon2 password hashing, refresh-token rotation with hashed storage, account lockout.
- **Tenant isolation** — `TenantGuard` resolves `request.tenantId` from the JWT and rejects cross-tenant access.
- **RBAC** — `PermissionGuard` enforces `@RequirePermissions('module.action.scope')` with scope widening.
- **Audit** — `AuditService.record(...)` for every sensitive action.
- **i18n** — accepts `Accept-Language` (`id-ID` default, `en-US`); `/me/preferences` syncs theme + locale.

## Commands

```bash
# from repo root
pnpm db:generate          # prisma generate
pnpm db:migrate           # prisma migrate dev
pnpm db:seed              # roles, permissions, demo tenant + admin
pnpm --filter @kitalent/api dev

# Swagger UI: http://localhost:4000/api/docs
```

Demo login after seed: `admin@kitalent.app` / `Password123` (tenantId `00000000-0000-0000-0000-000000000001`).

## Adding a module

Each PRD §10 module follows the same shape: `dto/`, `*.service.ts`, `*.controller.ts`
(with `@RequirePermissions`, pagination, Swagger), `*.module.ts`. Every tenant-scoped
Prisma model carries the standard fields (`tenantId`, audit, soft-delete) — see
`Company`/`Employee` in `schema.prisma` as the reference pattern.
