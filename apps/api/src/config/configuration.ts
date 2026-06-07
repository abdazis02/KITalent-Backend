/**
 * Typed runtime config loaded from environment (PRD §0.11: keep regulated /
 * deployment values configurable, never hardcoded).
 */
export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.API_PORT ?? '4000', 10),
  globalPrefix: process.env.API_GLOBAL_PREFIX ?? 'api',
  corsOrigins: (process.env.API_CORS_ORIGINS ?? 'http://localhost:3000').split(','),
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },
  // Field-level encryption-at-rest (PRD §22). When unset, sensitive fields are
  // stored as plaintext (dev) — set a strong secret in prod to enable AES-256-GCM.
  encryptionKey: process.env.FIELD_ENCRYPTION_KEY || undefined,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'change-me-access-secret',
    accessTtl: parseInt(process.env.JWT_ACCESS_TTL ?? '900', 10),
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-refresh-secret',
    refreshTtl: parseInt(process.env.JWT_REFRESH_TTL ?? '1209600', 10),
    bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '12', 10),
  },
  minio: {
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: parseInt(process.env.MINIO_PORT ?? '9000', 10),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'kitalent',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'kitalent-secret',
    bucket: process.env.MINIO_BUCKET ?? 'kitalent',
  },
  i18n: {
    defaultLocale: process.env.DEFAULT_LOCALE ?? 'id-ID',
    supportedLocales: (process.env.SUPPORTED_LOCALES ?? 'id-ID,en-US').split(','),
    defaultTheme: process.env.DEFAULT_THEME ?? 'system',
  },
});
