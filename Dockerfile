# Stage 1: Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY apps/sveltekit/package.json ./apps/sveltekit/
COPY packages/convex-vue-client/package.json ./packages/convex-vue-client/
COPY packages/design-tokens/package.json ./packages/design-tokens/
COPY convex/package.json ./convex/
COPY widgets/delivery-tracker/package.json ./widgets/delivery-tracker/
COPY widgets/inspection-form/package.json ./widgets/inspection-form/
COPY widgets/blueprint-viewer/package.json ./widgets/blueprint-viewer/
COPY widgets/safety-heatmap/package.json ./widgets/safety-heatmap/
COPY widgets/kanban-board/package.json ./widgets/kanban-board/

RUN npm install -g pnpm@10
RUN pnpm install --frozen-lockfile

# Stage 2: Build all packages
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@10

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=deps /app/package.json ./package.json

COPY . .

# Build shared packages first, then widgets, then SvelteKit
RUN pnpm --filter @sitesync/design-tokens build 2>/dev/null; exit 0
RUN pnpm --filter @sitesync/convex-vue-client build 2>/dev/null; exit 0
RUN pnpm --filter @sitesync/delivery-tracker build
RUN pnpm --filter @sitesync/inspection-form build
RUN pnpm --filter @sitesync/blueprint-viewer build
RUN pnpm --filter @sitesync/safety-heatmap build
RUN pnpm --filter @sitesync/kanban-board build
RUN pnpm --filter @sitesync/sveltekit build

# Prune dev dependencies for production
RUN pnpm prune --prod

# Stage 3: Production runner
ARG BUILD_DATE

FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user with explicit UID/GID
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 svelte && \
    mkdir -p /app/build /app/node_modules && \
    chown -R svelte:nodejs /app

# Copy production artifacts from builder
COPY --from=builder --chown=svelte:nodejs /app/apps/sveltekit/build ./build
COPY --from=builder --chown=svelte:nodejs /app/apps/sveltekit/package.json ./
COPY --from=builder --chown=svelte:nodejs /app/packages ./packages
COPY --from=builder --chown=svelte:nodejs /app/node_modules ./node_modules

# OpenTelemetry instrumentation (optional)
ENV OTEL_SDK_DISABLED=true

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', r => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

USER svelte
EXPOSE 3000

ENV NODE_ENV=production \
    PORT=3000

# OCI image annotations
LABEL org.opencontainers.image.title="SiteSync Pro" \
      org.opencontainers.image.description="Real-time construction management platform" \
      org.opencontainers.image.url="https://sitesync.example.com" \
      org.opencontainers.image.source="https://github.com/dev-lou/SiteSync" \
      org.opencontainers.image.vendor="SiteSync" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="0.1.0" \
      org.opencontainers.image.created=$BUILD_DATE

CMD ["node", "build"]
