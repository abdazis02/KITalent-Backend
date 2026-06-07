/**
 * Supported UI locales. `id-ID` is the primary default per PRD §13.
 * Adding a locale here is the single switch the whole system keys off of.
 */
export const LOCALES = ['id-ID', 'en-US'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id-ID';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}

/**
 * Theme preference. `system` follows the device/browser. PRD §14: stored
 * locally and synced to backend `user_preferences`.
 */
export const THEME_PREFERENCES = ['system', 'light', 'dark'] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export const DEFAULT_THEME: ThemePreference = 'system';

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (THEME_PREFERENCES as readonly string[]).includes(value);
}
