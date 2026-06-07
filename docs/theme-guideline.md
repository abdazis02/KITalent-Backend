# Theme Guideline (Light / Dark)

PRD §14 & §10.34 make Light/Dark a **core requirement**, not an add-on.

## Single source of truth

All colors live as semantic tokens in `packages/design-tokens/src/tokens.css`
(`:root` = Light, `.dark` = Dark). Components **never** use hardcoded hex/hsl.

| Layer | Where |
|---|---|
| Primitive palette | `packages/design-tokens/src/palette.ts` (only literal colors) |
| Semantic tokens | `packages/design-tokens/src/tokens.css` (`--background`, `--primary`, …) |
| Tailwind binding | `packages/design-tokens/src/tailwind-preset.ts` → `bg-background`, `text-foreground`, … |
| Flutter mirror | `apps/mobile/lib/core/theme/app_theme.dart` (kept in sync manually) |

## Rules

1. Use semantic utilities only: `bg-card`, `text-muted-foreground`, `border-border`,
   `bg-primary text-primary-foreground`. Never `bg-[#fff]` or `text-gray-500`.
2. Every surface must be legible in **both** modes — verify text, border, badge,
   status (success/warning/destructive/info), disabled, chart, and empty states.
3. Preference values: `system` | `light` | `dark`. Default `system`; tenant may
   set a default (`tenants.defaultTheme`); user override wins.
4. Persistence: web → `next-themes` (localStorage) + `PUT /me/preferences`;
   mobile → `ThemeController` (SharedPreferences) + `/me/preferences`.
5. On login the backend returns the last preference (`GET /me/preferences`);
   if none → tenant default → `system`.

## Adding a token

Add the variable to **both** `:root` and `.dark` in `tokens.css`, expose it in
the Tailwind preset, mirror it in the Flutter theme, and add it to
`SEMANTIC_TOKENS` in `packages/design-tokens/src/index.ts`.
