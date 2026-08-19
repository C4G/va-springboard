# syntax=docker/dockerfile:1

FROM node:24-alpine AS base

RUN corepack enable && corepack prepare pnpm@10.29.2 --activate

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --store-dir=/pnpm/store

COPY . .
RUN pnpm exec prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

# Install only the Prisma CLI needed by the one-shot migration service. npm's
# copied dependency tree avoids pnpm symlinks that do not survive stage copies.
FROM base AS migrator
WORKDIR /src
COPY package.json ./
WORKDIR /migrator
RUN npm init -y > /dev/null && \
    npm install --no-audit --no-fund --install-links \
      "prisma@$(node -p "require('/src/package.json').devDependencies.prisma.replace(/^[^0-9]*/, '')")"

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache wget && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=migrator --chown=nextjs:nodejs /migrator/node_modules /node_modules
COPY --chown=nextjs:nodejs prisma ./prisma

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
