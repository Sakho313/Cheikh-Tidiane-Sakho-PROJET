# ─── Stage 1: build de l'app React ────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Le fournisseur de carte par défaut (leaflet) ne nécessite aucune clé.
# Pour Mapbox/Google, passez --build-arg VITE_MAP_PROVIDER=... et la clé.
ARG VITE_MAP_PROVIDER=leaflet
ARG VITE_MAPBOX_TOKEN=
ARG VITE_GOOGLE_MAPS_KEY=
ENV VITE_MAP_PROVIDER=$VITE_MAP_PROVIDER
ENV VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
ENV VITE_GOOGLE_MAPS_KEY=$VITE_GOOGLE_MAPS_KEY
RUN npm run build

# ─── Stage 2: service via nginx ────────────────────────────────────────────────
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost/health.txt || exit 1

CMD ["nginx", "-g", "daemon off;"]
