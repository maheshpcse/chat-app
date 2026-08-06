# =============================================================================
# Multi-stage production image for Angular chat-app (optional container deploy)
# Primary cloud path is GitHub Pages via .github/workflows/angular.yml
# Use this image for Nginx/Docker/VPS hosting when Pages is not used.
# =============================================================================

# ---- Stage 1: build ----
FROM node:18-alpine AS build
WORKDIR /app

# OpenSSL legacy for Angular 10 webpack on Node 17+
ENV NODE_OPTIONS=--openssl-legacy-provider

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Override at build time: --build-arg BASE_HREF=/
ARG BASE_HREF=/
RUN npx ng build --prod --base-href=${BASE_HREF}

# ---- Stage 2: static nginx ----
FROM nginx:1.27-alpine AS runtime

# Remove default site; use SPA-aware config
RUN rm -f /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/chat-app /usr/share/nginx/html
# Premium maintenance page (swapped in when MAINTENANCE_MODE=1)
COPY maintenance/index.html /usr/share/nginx/maintenance/index.html
COPY scripts/docker-entrypoint.sh /docker-entrypoint-chat.sh
RUN chmod +x /docker-entrypoint-chat.sh \
  && cp /usr/share/nginx/html/index.html /usr/share/nginx/html/index.html.app

# Non-root-friendly: nginx master still root, workers drop privileges
EXPOSE 80

# Toggle at runtime without rebuild:
#   docker run -e MAINTENANCE_MODE=1 ...
# or touch a bind-mounted .maintenance file in the html root
ENV MAINTENANCE_MODE=0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

ENTRYPOINT ["/docker-entrypoint-chat.sh"]
