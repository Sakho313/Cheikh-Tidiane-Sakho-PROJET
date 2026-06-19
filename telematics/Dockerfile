# ─── Build ─────────────────────────────────────────────────────────────────---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Runtime ───────────────────────────────────────────────────────────────---
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
# Dépendances de production uniquement. Le client Prisma est COPIÉ depuis le
# stage build (la CLI `prisma` est une devDep, absente ici) plutôt que régénéré.
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/dist ./dist

# Utilisateur non-root
RUN addgroup -S app && adduser -S app -G app
USER app

EXPOSE 4000
CMD ["node", "dist/server.js"]
