# ── Builder ──────────────────────────────────────────────────
FROM node:18-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

# schema.prisma must be present during `npm ci` — the @prisma/client
# postinstall hook generates from it. Without it the hook no-ops.
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
# `npm run build` already runs `prisma generate`; running it explicitly first
# makes a generate failure surface on its own line instead of as a Next.js error.
RUN npx prisma generate && npm run build

# ── Runner ───────────────────────────────────────────────────
FROM node:18-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Generated client + query engine: the standalone bundle traces @prisma/client
# but not the generated .prisma output, so both are copied explicitly.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Prisma CLI, so the entrypoint can apply the schema to a fresh database.
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["node", "server.js"]
