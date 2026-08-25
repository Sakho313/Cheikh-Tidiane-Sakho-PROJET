# ─── SAO Telematics — Makefile ────────────────────────────────────────────────
# Raccourcis pour installer, lancer et tester la plateforme télématique.
# `make help` liste les cibles.

.DEFAULT_GOAL := help
.PHONY: help install setup db-push seed dev dev-api dev-front build lint typecheck \
        test docker-up docker-down clean

help: ## Affiche cette aide
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| sort \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-14s\033[0m %s\n", $$1, $$2}'

install: ## Installe les dépendances backend + frontend
	npm install
	cd frontend && npm install

setup: install db-push seed ## Installation complète + base prête (schéma + seed)
	@echo "✅ Setup terminé. Lancez 'make dev' puis ouvrez http://localhost:5174"

db-push: ## Génère le client Prisma et applique le schéma à la base
	npm run generate
	npx prisma db push

seed: ## Insère les données de démonstration (flotte + télémétrie)
	npm run seed

dev-api: ## Démarre l'API (hot-reload) sur :4000
	npm run dev

dev-front: ## Démarre le frontend (Vite) sur :5174
	cd frontend && npm run dev

dev: ## Démarre API + frontend en parallèle
	@echo "API :4000  |  Frontend :5174  (Ctrl-C pour arrêter)"
	@trap 'kill 0' EXIT; npm run dev & (cd frontend && npm run dev) & wait

build: ## Compile backend + frontend (production)
	npm run build
	cd frontend && npm run build

lint: ## Lint backend + frontend
	npm run lint
	cd frontend && npm run lint

typecheck: ## Vérifie les types backend + frontend
	npm run type-check
	cd frontend && npm run type-check

test: ## Tests unitaires backend
	npm test

docker-up: ## Lance la stack de dev (Postgres + API) via Docker
	docker compose up -d --build

docker-down: ## Arrête la stack Docker
	docker compose down

clean: ## Supprime les artefacts de build
	rm -rf dist coverage frontend/dist
