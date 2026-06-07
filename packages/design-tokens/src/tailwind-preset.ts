import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind preset binding utility classes to the semantic tokens in
 * tokens.css. Web (`apps/web`) and the shadcn/ui package extend this preset so
 * every surface uses the same Light/Dark tokens. Dark mode uses the `class`
 * strategy to integrate with next-themes.
 */
const hsl = (token: string) => `hsl(var(--${token}) / <alpha-value>)`;

export const kitalentPreset: Partial<Config> = {
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        background: hsl('background'),
        foreground: hsl('foreground'),
        card: { DEFAULT: hsl('card'), foreground: hsl('card-foreground') },
        popover: { DEFAULT: hsl('popover'), foreground: hsl('popover-foreground') },
        primary: { DEFAULT: hsl('primary'), foreground: hsl('primary-foreground') },
        secondary: { DEFAULT: hsl('secondary'), foreground: hsl('secondary-foreground') },
        accent: { DEFAULT: hsl('accent'), foreground: hsl('accent-foreground') },
        muted: { DEFAULT: hsl('muted'), foreground: hsl('muted-foreground') },
        success: { DEFAULT: hsl('success'), foreground: hsl('success-foreground') },
        warning: { DEFAULT: hsl('warning'), foreground: hsl('warning-foreground') },
        destructive: { DEFAULT: hsl('destructive'), foreground: hsl('destructive-foreground') },
        info: { DEFAULT: hsl('info'), foreground: hsl('info-foreground') },
        border: hsl('border'),
        input: hsl('input'),
        ring: hsl('ring'),
        chart: {
          1: hsl('chart-1'),
          2: hsl('chart-2'),
          3: hsl('chart-3'),
          4: hsl('chart-4'),
          5: hsl('chart-5'),
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
};

export default kitalentPreset;
