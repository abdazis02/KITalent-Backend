export { palette } from './palette';
export { kitalentPreset, default as tailwindPreset } from './tailwind-preset';

/**
 * Token names mirrored for the Flutter app (apps/mobile/lib/core/theme).
 * Keep this list in sync with tokens.css so the two platforms share one
 * semantic vocabulary even though Flutter can't read CSS variables.
 */
export const SEMANTIC_TOKENS = [
  'background',
  'foreground',
  'card',
  'card-foreground',
  'popover',
  'popover-foreground',
  'primary',
  'primary-foreground',
  'secondary',
  'secondary-foreground',
  'accent',
  'accent-foreground',
  'muted',
  'muted-foreground',
  'border',
  'input',
  'ring',
  'success',
  'warning',
  'destructive',
  'info',
] as const;
