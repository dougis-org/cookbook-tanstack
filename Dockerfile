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

# Copy Nitro build output and migration files
COPY --from=build /app/.output ./.output
COPY --from=build /app/drizzle ./drizzle
# Include all deps (drizzle-kit is needed for the release command: npm run db:migrate)
COPY --from=build /app/package*.json ./
RUN npm ci

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
