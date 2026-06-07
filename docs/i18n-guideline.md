# i18n Guideline (Bahasa Indonesia / English)

PRD §13 & §10.34: bilingual `id-ID` (default) + `en-US` is a **core requirement**.
No UI string may be hardcoded in a single language.

## Single source of truth

`packages/i18n/src/locales/{id-ID,en-US}/<namespace>.json`. The required
namespaces are registered in `packages/i18n/src/namespaces.ts` (PRD §10.34).

| Platform | Library | Entry |
|---|---|---|
| Web | `next-intl` (cookie locale, no URL prefix) | `apps/web/src/i18n/request.ts` |
| Mobile | `easy_localization` | `apps/mobile/assets/translations/*.json` |
| Backend | `nestjs-i18n` + `Accept-Language` | validation/error messages |

## Rules

1. Every string goes through a translation key. **Banned:** literals like
   `Simpan`, `Submit`, `Karyawan`, `Save`, `Employee` directly in a component.
2. Keys are stable and namespaced (`common.save`, `attendance.checkIn`,
   `payroll.salarySlip`). Stability enables linting, QA, and future locales.
3. **Parity is enforced** — every key in `id-ID` must exist in `en-US` and vice
   versa. Run `pnpm --filter @kitalent/i18n check:keys` (wire into CI).
4. Locale switch is available on **login page, profile, and settings** (PRD §13 #2).
5. Persistence: web cookie (`KITALENT_LOCALE`) + `/me/preferences`; mobile local
   storage + `/me/preferences`. Backend returns last locale on login.
6. **Formatting follows locale** (PRD §10.34 #6) — use `@kitalent/shared`
   `formatCurrency` / `formatDate` / `formatNumber` (Intl-based):
   - `id-ID`: `31 Mei 2026`, `Rp10.000.000`
   - `en-US`: `May 31, 2026`, `IDR 10,000,000`
7. Backend honors `Accept-Language` and returns localized validation/error
   messages where possible (PRD §10.34 #9).

## Adding a string

Add the key to the matching namespace JSON in **both** locales, then run the
parity check. For web, consume via `useTranslations('<namespace>')`.
