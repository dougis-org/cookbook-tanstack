# Build stage
FROM node:25-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:25-alpine AS production
WORKDIR /app

# Nitro build output
COPY --from=build /app/.output ./.output
# Migration SQL files + config (needed by drizzle-kit migrate release command)
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/drizzle.config.ts ./drizzle.config.ts
# Seed scripts and DB client (needed by npm run db:seed via fly ssh console)
COPY --from=build /app/src/db ./src/db
# All deps required: drizzle-kit (devDep) is needed for the release command
COPY --from=build /app/package*.json ./
RUN npm ci

ENV NODE_ENV=production
EXPOSE 3000

# Run as non-root for least-privilege security
USER node
CMD ["node", ".output/server/index.mjs"]
