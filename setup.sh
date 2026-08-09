#!/usr/bin/env sh
set -e

echo ""
echo "╔══════════════════════════════════════╗"
echo "║        SiteTrack — Setup             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 1. Copy .env if not present
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✔  Created .env from .env.example"
  echo "   Edit .env to add real credentials before going to production."
fi

# 2. Build and start all containers
echo ""
echo "▶  Building and starting containers..."
docker compose build --pull
docker compose up -d

# 3. Wait for Postgres
echo ""
echo "⏳  Waiting for Postgres to be ready..."
RETRIES=30
until docker compose exec -T postgres pg_isready -U "$(grep -m1 '^POSTGRES_USER' .env | cut -d= -f2)" 2>/dev/null || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES - 1))
  sleep 2
done
if [ $RETRIES -eq 0 ]; then
  echo "✖  Postgres did not become ready in time. Check 'docker compose logs postgres'."
  exit 1
fi
echo "✔  Postgres is healthy."

# 4. Run migrations
echo ""
echo "▶  Running database migrations..."
docker compose exec -T backend npx knex migrate:latest --knexfile src/config/knexfile.js
echo "✔  Migrations complete."

# 5. Run seeds
echo ""
echo "▶  Seeding default data..."
docker compose exec -T backend npx knex seed:run --knexfile src/config/knexfile.js
echo "✔  Seeds complete."

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅  SiteTrack is running!                           ║"
echo "║                                                      ║"
echo "║  Frontend  → http://localhost:5173                   ║"
echo "║  API       → http://localhost:3001/api/v1            ║"
echo "║  MinIO UI  → http://localhost:9001                   ║"
echo "║                                                      ║"
echo "║  Default login (demo):                               ║"
echo "║    super_admin@sitetrack.ae / Admin@1234             ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""
