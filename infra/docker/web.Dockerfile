# Multi-stage build for @kitalent/web (Next.js).
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
COPY packages/i18n/package.json packages/i18n/
COPY packages/design-tokens/package.json packages/design-tokens/
RUN pnpm install --frozen-lockfile=false

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @kitalent/web build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/package.json ./apps/web/
COPY --from=build /app/node_modules ./node_modules
WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
