# ─── SAO NIS2 — Makefile ──────────────────────────────────────────────────────
# Raccourcis pour installer, lancer et tester la plateforme.
# Lancez `make help` pour la liste des cibles.

.DEFAULT_GOAL := help
.PHONY: help install setup db-push seed dev dev-api dev-front build \
        test test-int e2e lint typecheck docker-up docker-down docker-prod clean

## ─── Aide ────────────────────────────────────────────────────────────────────
help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

## ─── Installation ────────────────────────────────────────────────────────────
install: ## Installe les dépendances backend + frontend
	npm ci
	cd frontend && npm ci

setup: install db-push seed ## Installation complète + base prête (schéma + seed)
	@echo "✅ Setup terminé. Lancez 'make dev' puis ouvrez http://localhost:5173"

db-push: ## Applique le schéma Prisma à la base
	npx prisma generate
	npx prisma db push

seed: ## Insère les données initiales (contrôles NIS2 + comptes démo)
	npm run seed

## ─── Développement ───────────────────────────────────────────────────────────
dev-api: ## Démarre l'API (hot-reload) sur :3000
	npm run dev

dev-front: ## Démarre le frontend (Vite) sur :5173
	cd frontend && npm run dev

dev: ## Démarre API + frontend en parallèle
	@echo "API :3000  |  Frontend :5173  (Ctrl-C pour arrêter)"
	@trap 'kill 0' EXIT; npm run dev & (cd frontend && npm run dev) & wait

## ─── Build / Qualité ─────────────────────────────────────────────────────────
build: ## Compile backend + frontend (production)
	npm run build
	cd frontend && npm run build

lint: ## Lint backend + frontend
	npm run lint
	cd frontend && npm run lint

typecheck: ## Vérifie les types backend + frontend
	npm run type-check
	cd frontend && npm run type-check

## ─── Tests ───────────────────────────────────────────────────────────────────
test: ## Tests unitaires + couverture (backend)
	npm run test:coverage

test-int: ## Tests d'intégration HTTP (backend, nécessite Postgres)
	npm run test:integration

e2e: ## Tests E2E Playwright (nécessite API + base lancées)
	cd frontend && npm run test:e2e

## ─── Docker ──────────────────────────────────────────────────────────────────
docker-up: ## Lance la stack de dev (Postgres + API) via Docker
	docker compose up -d

docker-down: ## Arrête la stack Docker de dev
	docker compose down

docker-prod: ## Lance la stack de production (Postgres + API + frontend nginx)
	docker compose -f docker-compose.prod.yml --env-file .env.prod.local up -d --build

## ─── Nettoyage ───────────────────────────────────────────────────────────────
clean: ## Supprime les artefacts de build et de test
	rm -rf dist coverage frontend/dist frontend/playwright-report frontend/test-results
