import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@kitalent/i18n',
    '@kitalent/types',
    '@kitalent/shared',
    '@kitalent/design-tokens',
  ],
};

export default withNextIntl(nextConfig);
