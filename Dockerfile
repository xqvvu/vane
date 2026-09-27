# syntax=docker/dockerfile:1

# --- Build stage: use the official Vite+ toolchain image ---
# vp provisions Node.js from .node-version automatically during install
FROM ghcr.io/voidzero-dev/vite-plus:1.0.0-rc.1 AS build
WORKDIR /app

# Install dependencies first (cache layer across source changes)
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY --chown=vp:vp apps/console/package.json apps/console/package.json
COPY --chown=vp:vp packages/core/package.json packages/core/package.json
COPY --chown=vp:vp packages/destinations/package.json packages/destinations/package.json
COPY --chown=vp:vp packages/providers/package.json packages/providers/package.json
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/typings/package.json packages/typings/package.json
RUN vp install --frozen-lockfile

# Build the console app
COPY --chown=vp:vp . .
RUN vp -C apps/console build

# Export the exact resolved Node.js binary (from .node-version) for the runtime stage
RUN cp "$(vp env which node | head -1)" /tmp/node

# --- Runtime stage: slim glibc, no vp toolchain ---
FROM node:24-trixie-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV VANE_DATABASE_PATH=/data/vane.sqlite

WORKDIR /app

# Install runtime utilities (gosu for user drop, curl for healthcheck)
RUN apt-get update   && apt-get install -y --no-install-recommends gosu curl   && rm -rf /var/lib/apt/lists/*   && mkdir -p /data /app   && chown -R node:node /data /app

# The vp-provisioned Node.js, matching .node-version exactly
COPY --from=build /tmp/node /usr/local/bin/node

# Build output (includes vendored production deps — server is a single bundle)
COPY --from=build --chown=node:node /app/apps/console/.output ./.output
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3   CMD curl -fsS http://127.0.0.1:3000/api/ready || exit 1

CMD ["node", ".output/server/index.mjs"]
