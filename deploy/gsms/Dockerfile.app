# App unique lms-crm — build Next.js en LOCAL (pnpm build), image runtime seulement.
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0
RUN apt-get update -qq && apt-get install -y -qq openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY apps/lms-crm/.next/standalone ./
COPY apps/lms-crm/.next/static ./apps/lms-crm/.next/static
COPY apps/lms-crm/public ./apps/lms-crm/public
USER nextjs
EXPOSE 3001
CMD ["node", "apps/lms-crm/server.js"]
