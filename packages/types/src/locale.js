"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_THEME = exports.THEME_PREFERENCES = exports.DEFAULT_LOCALE = exports.LOCALES = void 0;
exports.isLocale = isLocale;
exports.isThemePreference = isThemePreference;
/**
 * Supported UI locales. `id-ID` is the primary default per PRD §13.
 * Adding a locale here is the single switch the whole system keys off of.
 */
exports.LOCALES = ['id-ID', 'en-US'];
exports.DEFAULT_LOCALE = 'id-ID';
function isLocale(value) {
    return typeof value === 'string' && exports.LOCALES.includes(value);
}
/**
 * Theme preference. `system` follows the device/browser. PRD §14: stored
 * locally and synced to backend `user_preferences`.
 */
exports.THEME_PREFERENCES = ['system', 'light', 'dark'];
exports.DEFAULT_THEME = 'system';
function isThemePreference(value) {
    return typeof value === 'string' && exports.THEME_PREFERENCES.includes(value);
}
