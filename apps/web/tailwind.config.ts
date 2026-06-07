import type { Config } from 'tailwindcss';
import { kitalentPreset } from '@kitalent/design-tokens/tailwind-preset';

const config: Config = {
  // Single source of truth for Light/Dark tokens lives in @kitalent/design-tokens.
  presets: [kitalentPreset as Config],
  content: ['./src/**/*.{ts,tsx}'],
};

export default config;
