# syntax=docker/dockerfile:1

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build-time configuration: client-exposed variables that Vite inlines into the bundle.
# These must be passed as --build-arg flags to reach the build; Fly secrets do NOT reach
# this stage (they are only available at container runtime, after the build is done).
ARG VITE_ADSENSE_ENABLED
ARG VITE_GOOGLE_ADSENSE_TOP_SLOT_ID
ARG VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID
ARG VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID
ARG VITE_GOOGLE_ANALYTICS_ID

# Re-export each ARG as an ENV for explicitness and consistency.
# ARG values are already visible to subsequent RUN steps; ENV makes the values
# explicit in the layer metadata and keeps the pattern consistent.
ENV VITE_ADSENSE_ENABLED="$VITE_ADSENSE_ENABLED" \
    VITE_GOOGLE_ADSENSE_TOP_SLOT_ID="$VITE_GOOGLE_ADSENSE_TOP_SLOT_ID" \
    VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID="$VITE_GOOGLE_ADSENSE_BOTTOM_SLOT_ID" \
    VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID="$VITE_GOOGLE_ADSENSE_RIGHT_RAIL_SLOT_ID" \
    VITE_GOOGLE_ANALYTICS_ID="$VITE_GOOGLE_ANALYTICS_ID"

RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:24-alpine AS runtime

WORKDIR /app

# Copy only the production build output
COPY --from=builder --chown=node:node /app/.output ./.output
COPY --from=builder --chown=node:node /app/package*.json ./
# Copy application source needed by the Fly.io release_command (npm run db:seed)
COPY --from=builder --chown=node:node /app/src ./src
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json

# Install only production dependencies (tsx + dotenv are in dependencies for db:seed)
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Run as non-root user for security
USER node

CMD ["node", ".output/server/index.mjs"]
