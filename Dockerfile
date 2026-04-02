FROM node:22-slim AS base
RUN npm install -g pnpm@latest

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches/ ./patches/ 2>/dev/null || true

COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY artifacts/api-server/package.json ./artifacts/api-server/

RUN pnpm install --frozen-lockfile --ignore-scripts

COPY lib/db/ ./lib/db/
COPY lib/api-zod/ ./lib/api-zod/
COPY lib/api-spec/ ./lib/api-spec/
COPY artifacts/api-server/ ./artifacts/api-server/

WORKDIR /app/artifacts/api-server
RUN pnpm run build

FROM node:22-slim AS runner
WORKDIR /app

COPY --from=base /app/artifacts/api-server/dist ./dist

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "--enable-source-maps", "./dist/index.mjs"]
