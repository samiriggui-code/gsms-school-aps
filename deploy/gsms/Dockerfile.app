# Build Next.js sur le VPS (Linux) — standalone correct, pas de transfert .next
FROM node:22-bookworm-slim AS builder
WORKDIR /app
RUN apt-get update -qq && apt-get install -y -qq openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.5.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY patches patches
COPY packages packages
COPY apps/lms-crm apps/lms-crm
COPY scripts scripts
ENV NEXT_TELEMETRY_DISABLED=1
ARG DOMAIN=localhost
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3001
ENV DOMAIN="${DOMAIN}"
ENV NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL}"
ENV NEXTAUTH_URL="${NEXT_PUBLIC_SITE_URL}"
# Prisma/Next collectent des pages au build — URL factice suffit (pas de connexion réelle)
ENV DATABASE_URL="postgresql://lms:build@127.0.0.1:5432/lms_app?schema=public"
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm -C packages/database db:generate
RUN pnpm -C apps/lms-crm exec next build --webpack

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN apt-get update -qq && apt-get install -y -qq openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/lms-crm/.next/standalone ./
COPY --from=builder /app/apps/lms-crm/.next/static ./apps/lms-crm/.next/static
COPY --from=builder /app/apps/lms-crm/public ./apps/lms-crm/public
RUN mkdir -p apps/lms-crm/.next/cache && chown -R nextjs:nodejs apps/lms-crm/.next
USER nextjs
EXPOSE 3001
CMD ["node", "apps/lms-crm/server.js"]
