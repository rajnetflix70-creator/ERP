.DEFAULT_GOAL := help

.PHONY: help setup dev stop clean test logs

help:
	@echo ""
	@echo "SiteTrack — available commands:"
	@echo "  make setup   — first-time setup: copy .env, build & start all containers, run migrations + seeds"
	@echo "  make dev     — start all containers (after setup)"
	@echo "  make stop    — stop all containers"
	@echo "  make clean   — stop + remove volumes (DESTROYS DATA)"
	@echo "  make test    — run backend tests inside the backend container"
	@echo "  make logs    — tail all container logs"
	@echo ""

setup:
	@if [ ! -f .env ]; then cp .env.example .env; echo "Created .env from .env.example — edit it to add real credentials."; fi
	@docker compose build --pull
	@docker compose up -d
	@echo "Waiting for Postgres to be healthy..."
	@until docker compose exec -T postgres pg_isready -U $$(grep POSTGRES_USER .env | cut -d= -f2) 2>/dev/null; do sleep 2; done
	@echo "Running migrations..."
	@docker compose exec -T backend npx knex migrate:latest --knexfile src/config/knexfile.js
	@echo "Running seeds..."
	@docker compose exec -T backend npx knex seed:run --knexfile src/config/knexfile.js
	@echo ""
	@echo "✅  SiteTrack is ready!"
	@echo "   Frontend : http://localhost:5173"
	@echo "   API      : http://localhost:3001/api/v1"
	@echo "   MinIO UI : http://localhost:9001"
	@echo ""

dev:
	@docker compose up -d
	@echo "Frontend : http://localhost:5173"
	@echo "API      : http://localhost:3001/api/v1"

stop:
	@docker compose stop

clean:
	@docker compose down -v

test:
	@docker compose exec -T backend npm test

logs:
	@docker compose logs -f
