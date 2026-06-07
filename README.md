# KITalent

**Outsourcing Management Platform + SaaS HRIS** — web admin/portal, web client portal, and Flutter mobile app, on an API-first NestJS backend.

> This repository is the single source of truth for delivery. Scope is governed by `PRD.md`. Two product modes only: **Outsourcing** and **SaaS HRIS** (a tenant may be Hybrid). There is no separate "Internal" mode.

## Non-negotiable cross-cutting requirements

Every app and module must honor these from day one:

| Requirement | Where it lives |
|---|---|
| Multi-tenant isolation | `apps/api` `TenantGuard` + `tenant_id` on every tenant-scoped row |
| RBAC (`module.action.scope`) | `packages/types` permissions + `apps/api` `PermissionGuard` |
| Light / Dark / System theme | `packages/design-tokens` + `next-themes` (web) + `ThemeMode` (Flutter) |
| Bilingual `id-ID` (default) + `en-US` | `packages/i18n` + `next-intl` (web) + `easy_localization` (mobile) |
| Audit log on every sensitive action | `apps/api` audit interceptor/service |
| Soft delete + standard fields | `id, tenant_id, created/updated/deleted_at, created/updated/deleted_by` |
| UUID primary keys | Prisma `@id @default(uuid())` |
| File upload → MinIO only | `apps/api` file service |

No hardcoded UI text, colors, roles, statuses, or payroll components — everything goes through i18n keys, design tokens, and configurable data.

## Structure

```
apps/
  api/        NestJS + Prisma + PostgreSQL + Redis + MinIO (API-first)
  web/        Next.js App Router + Tailwind + shadcn/ui + next-themes + next-intl
  mobile/     Flutter (Riverpod, GoRouter, easy_localization, light/dark)
packages/
  types/          Shared enums: roles, permissions, statuses, locales, themes
  design-tokens/  Light/Dark semantic tokens + Tailwind preset
  i18n/           id-ID / en-US message catalogs + namespace registry
  shared/         Shared utilities (DTO contracts, helpers)
  config/         Shared tsconfig / lint base
infra/            Dockerfiles, deploy & backup scripts, monitoring
nginx/            Reverse proxy config
docs/             Architecture, DB, deployment, security, theme & i18n guidelines
```

## Quick start

```bash
cp .env.example .env
pnpm install
pnpm infra:up          # postgres + redis + minio
pnpm db:migrate        # apply Prisma schema
pnpm db:seed           # roles, permissions, demo tenant
pnpm dev               # api + web

# Mobile (separate toolchain)
cd apps/mobile && flutter pub get && flutter run
```

## Status

Foundation scaffold. See `docs/` and per-app READMEs. Business modules are stubbed
in `apps/api/src/modules/*` and tracked against the PRD module list (§6, §10).
