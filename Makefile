DC_DEV  = docker compose -f docker-compose.dev.yml
DC_PROD = docker compose -f docker-compose.prod.yml --env-file .env.prod
DC_TEST = docker compose -f docker-compose.test.yml

.PHONY: dev dev-build dev-down dev-logs dev-ps dev-seed dev-seed-locations \
        prod prod-build prod-down prod-logs prod-ps prod-seed prod-seed-locations \
        test test-db test-db-down \
        clean

# ── Development ────────────────────────────────────────────────────────────────

dev: ## Start db+server in Docker, then Vite client locally (foreground)
	$(DC_DEV) up --build -d
	npm run dev --workspace=client

dev-server: ## Start db+server in Docker only (background)
	$(DC_DEV) up --build -d

dev-client: ## Start Vite client locally (run dev-server first)
	npm run dev --workspace=client

dev-build: ## Rebuild dev images without starting
	$(DC_DEV) build

dev-down: ## Stop and remove dev containers
	$(DC_DEV) down

dev-logs: ## Tail server + db logs
	$(DC_DEV) logs -f

dev-logs-server: ## Tail server logs only
	$(DC_DEV) logs -f server

dev-ps: ## Show dev container status
	$(DC_DEV) ps

dev-seed: ## Seed the dev database with test data
	$(DC_DEV) exec server node db/seed.js

dev-seed-locations: ## Seed curated Tel Aviv beaches + nets (replaces existing Tel Aviv rows)
	$(DC_DEV) exec server node db/seed-locations.js

dev-db: ## Open a psql shell in the dev database
	$(DC_DEV) exec db psql -U bally -d bally

# ── Testing ────────────────────────────────────────────────────────────────────

test-db: ## Start the test PostgreSQL container (port 5435)
	$(DC_TEST) up -d --wait

test-db-down: ## Stop and remove the test DB container
	$(DC_TEST) down

test: test-db ## Run all tests (starts test DB, runs backend + frontend tests)
	npm run test --workspace=server
	npm run test --workspace=client

# ── Production ─────────────────────────────────────────────────────────────────

prod: ## Start prod environment (requires .env.prod)
	@test -f .env.prod || (echo "ERROR: .env.prod not found. Copy .env.prod.example and fill in secrets." && exit 1)
	$(DC_PROD) up --build -d

prod-build: ## Rebuild prod images without starting
	@test -f .env.prod || (echo "ERROR: .env.prod not found." && exit 1)
	$(DC_PROD) build

prod-down: ## Stop and remove prod containers
	$(DC_PROD) down

prod-logs: ## Tail all prod logs
	$(DC_PROD) logs -f

prod-ps: ## Show prod container status
	$(DC_PROD) ps

prod-seed: ## Seed the prod database (use with caution — wipes all data)
	$(DC_PROD) exec server node db/seed.js

prod-seed-locations: ## Insert curated beaches into prod DB (safe — idempotent, no data loss)
	$(DC_PROD) exec server node db/seed-locations.js

prod-db: ## Open a psql shell in the prod database
	$(DC_PROD) exec db psql -U $${POSTGRES_USER:-bally} -d $${POSTGRES_DB:-bally}

# ── Utilities ──────────────────────────────────────────────────────────────────

clean: ## Remove all containers, images, and volumes for this project
	$(DC_DEV) down -v --rmi local 2>/dev/null || true
	$(DC_PROD) down -v --rmi local 2>/dev/null || true
	$(DC_TEST) down -v 2>/dev/null || true

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
