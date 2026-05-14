FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package.json package-lock.json* yarn.lock* ./
RUN if [ -f yarn.lock ]; then \
      corepack enable && yarn install --frozen-lockfile --ignore-scripts; \
    else \
      npm ci --ignore-scripts; \
    fi

COPY tsconfig.json ./
COPY programs ./programs
COPY scripts ./scripts

FROM node:20-bookworm-slim

RUN useradd -r -u 1001 -m chalna

WORKDIR /home/chalna/app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/programs ./programs
COPY --from=builder /app/scripts ./scripts

USER chalna

ENV CHALNA_KEEPER_INTERVAL_MS=500

ENTRYPOINT ["npx", "ts-node", "scripts/keeper-bot.ts"]
CMD ["500"]
