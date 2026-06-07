# Multi-stage build for @kitalent/api (NestJS).
FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-workspace.yaml package.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile=false

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm --filter @kitalent/api exec prisma generate
RUN pnpm --filter @kitalent/api build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 4000
CMD ["node", "dist/main.js"]
