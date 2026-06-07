/**
 * Primitive palette — the raw brand scale. These are the ONLY place literal
 * colors live. Semantic tokens (tokens.css) reference these conceptually; UI
 * components must consume *semantic* tokens, never these primitives directly.
 *
 * KITalent brand: a confident indigo primary with a warm amber accent — premium,
 * tegas, clean (PRD §0.12), tuned to stay legible in both Light and Dark.
 *
 * Values are HSL channels ("H S% L%") so they slot into `hsl(var(--token))`.
 */
export const palette = {
  brand: {
    50: '239 100% 97%',
    100: '238 100% 94%',
    200: '239 96% 89%',
    300: '240 92% 81%',
    400: '243 86% 71%',
    500: '245 75% 59%', // primary
    600: '247 67% 50%',
    700: '248 63% 42%',
    800: '249 57% 35%',
    900: '248 50% 29%',
    950: '250 55% 18%',
  },
  accent: {
    400: '38 96% 60%',
    500: '35 92% 52%',
    600: '32 90% 46%',
  },
  neutral: {
    0: '0 0% 100%',
    50: '220 20% 98%',
    100: '220 16% 96%',
    200: '220 14% 91%',
    300: '218 12% 84%',
    400: '218 10% 64%',
    500: '220 9% 46%',
    600: '215 14% 34%',
    700: '217 19% 27%',
    800: '215 28% 17%',
    900: '221 39% 11%',
    950: '224 47% 7%',
  },
  success: { 500: '142 71% 45%', 600: '142 72% 35%' },
  warning: { 500: '38 92% 50%', 600: '32 90% 42%' },
  danger: { 500: '0 72% 51%', 600: '0 74% 42%' },
  info: { 500: '199 89% 48%', 600: '201 90% 40%' },
} as const;
