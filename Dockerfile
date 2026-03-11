# syntax=docker/dockerfile:1

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

# Copy only the production build output
COPY --from=builder --chown=node:node /app/.output ./.output
COPY --from=builder --chown=node:node /app/package*.json ./
# Copy application source needed by the Fly.io release_command (npm run db:seed)
COPY --from=builder --chown=node:node /app/src ./src

# Install only production dependencies (tsx + dotenv are in dependencies for db:seed)
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run as non-root user for security
USER node

CMD ["node", ".output/server/index.mjs"]
