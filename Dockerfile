# syntax=docker/dockerfile:1

# --- Build stage: use the official Vite+ toolchain image ---
FROM ghcr.io/voidzero-dev/vite-plus:1.0.0-rc.1 AS build

# Native build toolchain for better-sqlite3's node-gyp rebuild
USER root
RUN apt-get update  && apt-get install -y --no-install-recommends build-essential python3  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy manifests first so the dependency layer stays cached across source edits
COPY --chown=vp:vp package.json pnpm-lock.yaml pnpm-workspace.yaml .node-version ./
COPY --chown=vp:vp apps/console/package.json apps/console/package.json
COPY --chown=vp:vp packages/core/package.json packages/core/package.json
COPY --chown=vp:vp packages/destinations/package.json packages/destinations/package.json
COPY --chown=vp:vp packages/providers/package.json packages/providers/package.json
COPY --chown=vp:vp packages/api/package.json packages/api/package.json
COPY --chown=vp:vp packages/typings/package.json packages/typings/package.json

# Provision the pinned Node.js runtime, then install dependencies.
# - `vp env install` reads .node-version, so the runtime never drifts from it.
# - node-gyp is installed globally because better-sqlite3's install script needs it on PATH.
# - node-gyp reuses the provisioned runtime headers, so it never downloads from nodejs.org.
RUN --mount=type=cache,id=vane-pnpm-store,target=/root/.local/share/pnpm/store,sharing=locked \
    vp env install \
 && vp exec npm install -g node-gyp \
 && ln -sf "$(vp exec npm root -g)/node-gyp/bin/node-gyp.js" /usr/local/bin/node-gyp \
 && NODEDIR="$(dirname "$(dirname "$(vp env which node | head -1)")")" \
 && test -f "$NODEDIR/include/node/node.h" \
 && npm_config_nodedir="$NODEDIR" vp install --frozen-lockfile

# Build the console app
COPY --chown=vp:vp . .
RUN vp -C apps/console build

# Export the resolved Node.js binary for the runtime stage
RUN cp "$(vp env which node | head -1)" /tmp/node

# --- Runtime stage: slim glibc, no vp toolchain ---
FROM node:26-trixie-slim AS runtime

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
