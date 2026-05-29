# ─────────────────────────────────────────────
# Elite.Pay – Backend  (Node.js / Express)
# ─────────────────────────────────────────────
FROM node:20-alpine AS base

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Install dependencies first (layer-cache friendly)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY src/ ./src/

# Own files
RUN chown -R appuser:appgroup /app
USER appuser

EXPOSE 3000

# Health check (matches the /health route in app.js)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "src/server.js"]
