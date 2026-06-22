# ── Stage 1: build ────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

# Gera o Prisma Client antes de compilar
COPY src/database/prisma ./src/database/prisma
RUN npx prisma generate --schema=src/database/prisma/schema.prisma

COPY . .
RUN npm run build

# ── Stage 2: produção ─────────────────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# Copia o Prisma Client gerado (evita rodar generate novamente)
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY --from=builder /app/dist ./dist

# Cloud Run injeta PORT=8080 automaticamente
EXPOSE 8080

CMD ["node", "dist/server.js"]
