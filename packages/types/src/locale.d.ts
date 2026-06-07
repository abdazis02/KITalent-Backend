/**
 * Supported UI locales. `id-ID` is the primary default per PRD §13.
 * Adding a locale here is the single switch the whole system keys off of.
 */
export declare const LOCALES: readonly ["id-ID", "en-US"];
export type Locale = (typeof LOCALES)[number];
export declare const DEFAULT_LOCALE: Locale;
export declare function isLocale(value: unknown): value is Locale;
/**
 * Theme preference. `system` follows the device/browser. PRD §14: stored
 * locally and synced to backend `user_preferences`.
 */
export declare const THEME_PREFERENCES: readonly ["system", "light", "dark"];
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export declare const DEFAULT_THEME: ThemePreference;
export declare function isThemePreference(value: unknown): value is ThemePreference;
