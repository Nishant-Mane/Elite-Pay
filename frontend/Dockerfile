###############################################################################
# Elite.Pay – Frontend  (React/Vite → Nginx)
# Multi-stage build
###############################################################################

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests first (layer-cache friendly)
COPY package*.json ./
COPY .npmrc* ./

RUN npm ci

# Copy full source and build
COPY . .

# Vite injects VITE_* env vars at build time; pass them via --build-arg
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/elite-pay.conf

# Copy the built SPA from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx runs as root by default; it drops to a worker process automatically.
# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
