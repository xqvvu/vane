FROM node:24-trixie-slim AS deps

WORKDIR /app

RUN corepack enable \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/console/package.json apps/console/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/destinations/package.json packages/destinations/package.json
COPY packages/providers/package.json packages/providers/package.json

RUN pnpm install --frozen-lockfile

FROM deps AS build

COPY . .

RUN pnpm --filter @vane/console build

FROM node:24-trixie-slim AS runtime

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV VANE_DATABASE_PATH=/data/vane.sqlite

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends gosu \
  && rm -rf /var/lib/apt/lists/* \
  && mkdir -p /data /app \
  && chown -R node:node /data /app

COPY --from=build --chown=node:node /app/apps/console/.output ./.output
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

EXPOSE 3000
VOLUME ["/data"]

CMD ["node", ".output/server/index.mjs"]
