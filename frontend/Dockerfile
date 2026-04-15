# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* vars are baked in at build time — must be passed as build args
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# standalone output contains everything needed to run the server
COPY --from=builder --chown=appuser:appgroup /app/.next/standalone ./
COPY --from=builder --chown=appuser:appgroup /app/.next/static ./.next/static

USER appuser

EXPOSE 3000

CMD ["node", "server.js"]
