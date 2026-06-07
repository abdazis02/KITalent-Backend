# kitalent_app (Flutter)

Employee self-service + supervisor mobile app (PRD §10.30).

## Cross-cutting wiring (already in place)

- **Light / Dark / System theme** — `lib/core/theme/app_theme.dart` (mirrors the
  semantic tokens in `packages/design-tokens`) + `theme_controller.dart`
  (persists choice, exposes `ThemeMode`).
- **Bilingual id-ID / en-US** — `easy_localization` with `assets/translations/*.json`;
  `id-ID` is default + fallback (PRD §13). All strings via `'key'.tr()`.

## Suggested structure

```
lib/
  core/        theme, localization, network (Dio), storage, router (GoRouter)
  common/      shared widgets, design-system primitives
  features/
    auth/        login, 2FA, forgot password
    attendance/  GPS + selfie check-in/out (PRD §10.13)
    leave/       requests & balance
    payroll/     salary slip viewer (PRD §10.18)
    approvals/   supervisor approval tasks
    profile/     theme + language settings
main.dart
```

## Run

```bash
flutter pub get
flutter run
```

> This app is intentionally excluded from the pnpm workspace (separate toolchain).
