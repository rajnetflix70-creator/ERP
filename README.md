# SiteTrack

> Construction Site Attendance & Equipment Management SaaS — built for UAE construction companies.

![Stack](https://img.shields.io/badge/stack-React%2018%20%7C%20Node.js%20%7C%20PostgreSQL%2017-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Variables](#environment-variables)
3. [API Reference](#api-reference)
4. [Database Schema](#database-schema)
5. [Architecture](#architecture)
6. [AWS Deployment](#aws-deployment)
7. [Manual Verification Checklist](#manual-verification-checklist)
8. [Development](#development)

---

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)
- Git

### One-command setup

```bash
git clone <your-repo-url>
cd sitetrack
sh setup.sh
```

That's it. The script will:
1. Copy `.env.example` → `.env` (edit it to add real credentials)
2. Build and start all 4 containers (Postgres 17, MinIO, backend, frontend)
3. Wait for Postgres health check to pass
4. Run all database migrations
5. Seed default roles and demo data
6. Print the URLs when done

**Or with Make:**
```bash
make setup
```

### Default demo credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | super_admin@sitetrack.ae | Admin@1234 |
| Company Admin | admin@sitetrack.ae | Admin@1234 |
| Site Supervisor | supervisor@sitetrack.ae | Admin@1234 |
| Worker | worker@sitetrack.ae | Admin@1234 |

### URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| API | http://localhost:3001/api/v1 |
| MinIO Console | http://localhost:9001 |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in values. Below is the full reference.

### Required (all environments)

| Variable | Description | Example |
|---|---|---|
| `POSTGRES_DB` | Database name | `sitetrack` |
| `POSTGRES_USER` | Database user | `sitetrack` |
| `POSTGRES_PASSWORD` | Database password | `strong_random_password` |
| `JWT_SECRET` | Secret for signing JWTs — **must be ≥32 chars** | `your_random_32_char_string` |

### Optional (production recommended)

| Variable | Description | Where to get it |
|---|---|---|
| `GOOGLE_CLIENT_ID` | Google OAuth2 client ID | [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web application). Add `http://localhost:5173` as an authorized origin. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 client secret | Same as above |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | [Twilio Console](https://console.twilio.com/) → Dashboard |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Twilio Console → Dashboard |
| `TWILIO_VERIFY_SERVICE_SID` | Twilio Verify Service SID | Twilio Console → Verify → Services → Create new |
| `MINIO_ROOT_USER` | MinIO admin username | Any string (dev) / AWS IAM key (prod) |
| `MINIO_ROOT_PASSWORD` | MinIO admin password | Any string (dev) / AWS IAM secret (prod) |
| `MINIO_BUCKET` | S3/MinIO bucket name | `sitetrack` |

### Dev/Test fallbacks

- **OTP**: If Twilio credentials are absent, OTP codes are printed to the backend console (`[OTP DEV] +971XXXXXXXXX 123456`). This is intentional for local development.
- **Google Sign-In**: If `VITE_GOOGLE_CLIENT_ID` is unset, the Google tab shows a setup instruction message instead of the button.
- **Photo storage**: MinIO runs locally in Docker. Swap to AWS S3 by pointing `MINIO_ENDPOINT` to your S3 bucket endpoint and providing valid credentials.

---

## API Reference

Base URL: `http://localhost:3001/api/v1`

All authenticated endpoints require: `Authorization: Bearer <jwt_token>`

### Auth

| Method | Endpoint | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | None | `{full_name, email, password}` | Email+password signup |
| POST | `/auth/login` | None | `{email, password}` | Email+password login |
| POST | `/auth/otp/request` | None | `{mobile_number}` | Send OTP to mobile (E.164 format) |
| POST | `/auth/otp/verify` | None | `{mobile_number, code}` | Verify OTP; creates account on first use |
| POST | `/auth/google` | None | `{idToken}` | Verify Google ID token; link/create user |
| GET | `/auth/me` | ✓ | — | Get current user profile |

### Sites

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/sites` | ✓ | All | List sites (filtered by role) |
| POST | `/sites` | ✓ | company_admin, super_admin | Create site |
| GET | `/sites/:id` | ✓ | All | Get site details |
| PUT | `/sites/:id` | ✓ | company_admin, super_admin | Update site |
| DELETE | `/sites/:id` | ✓ | super_admin | Soft delete (deactivate) |
| POST | `/sites/:id/assignments` | ✓ | company_admin, super_admin | Assign user to site |
| GET | `/sites/:id/assignments` | ✓ | supervisor+ | List workers on site |

### Attendance

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| POST | `/attendance/check-in` | ✓ | All | Check in with GPS; validates geofence |
| POST | `/attendance/check-out` | ✓ | All | Check out with GPS |
| GET | `/attendance/me` | ✓ | All | Own attendance history (`?from=&to=` date filters) |
| GET | `/attendance/site/:siteId` | ✓ | supervisor+ | All workers' attendance for a site (`?date=`) |
| PATCH | `/attendance/:id` | ✓ | supervisor+ | Edit status/remarks |

**Geofence error response (403):**
```json
{
  "error": true,
  "message": "You are 523m from the site. You must be within 300m to check in."
}
```

### Equipment

| Method | Endpoint | Auth | Roles | Description |
|---|---|---|---|---|
| GET | `/equipment/categories` | ✓ | All | List equipment categories |
| GET | `/equipment/items` | ✓ | All | List all equipment items |
| POST | `/equipment/items` | ✓ | company_admin+ | Create equipment item |
| GET | `/equipment/items/:id` | ✓ | All | Get item details |
| PUT | `/equipment/items/:id` | ✓ | company_admin+ | Update item |
| GET | `/equipment/site/:siteId/allocations` | ✓ | All | Current stock at a site |
| POST | `/equipment/transactions` | ✓ | supervisor+ | Record stock movement (atomic) |
| GET | `/equipment/alerts/low-stock` | ✓ | All | Consumables at/below reorder level |
| GET | `/equipment/transactions` | ✓ | All | Transaction history |

**Transaction types:** `issue`, `return`, `transfer`, `restock`, `damaged`, `lost`

**Transaction body:**
```json
{
  "equipment_item_id": "uuid",
  "transaction_type": "issue",
  "quantity": 10,
  "from_site_id": "uuid",
  "to_site_id": "uuid",
  "issued_to_user_id": "uuid",
  "remarks": "Issued for formwork"
}
```

### Storage

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/storage/presign?key=&contentType=` | ✓ | Get presigned PUT URL for photo upload |

---

## Database Schema

```
roles
  id, name, description, timestamps

users
  id (UUID), full_name, email (nullable unique), mobile_number (nullable unique),
  password_hash (nullable), google_id (nullable unique), role_id → roles,
  is_active, mobile_verified, email_verified, preferred_language,
  avatar_url, last_login_at, timestamps
  CHECK: email IS NOT NULL OR mobile_number IS NOT NULL

otp_codes
  id, mobile_number, code_hash, expires_at, is_used, attempt_count, timestamps

sites
  id (UUID), name, code (unique), emirate, address, latitude, longitude,
  geofence_radius_meters (default 300), supervisor_id → users, is_active, timestamps

site_assignments
  id, user_id → users, site_id → sites, assigned_from, assigned_to, timestamps
  UNIQUE (user_id, site_id, assigned_from)

attendance_records
  id (UUID), user_id → users, site_id → sites, attendance_date,
  check_in_at, check_in_lat, check_in_lng, check_in_photo_url,
  check_out_at, check_out_lat, check_out_lng, check_out_photo_url,
  status (present/absent/half_day/on_leave), overtime_hours, remarks, timestamps
  UNIQUE (user_id, attendance_date)

equipment_categories
  id, name (unique), timestamps

equipment_items
  id (UUID), name, asset_code (nullable unique), category_id → equipment_categories,
  item_type (asset/consumable), unit, reorder_level, total_quantity, notes, timestamps

equipment_site_allocations
  id, equipment_item_id → equipment_items, site_id → sites, quantity, updated_at
  UNIQUE (equipment_item_id, site_id)

stock_transactions
  id (UUID), equipment_item_id → equipment_items, from_site_id → sites (nullable),
  to_site_id → sites (nullable), transaction_type (issue/return/transfer/restock/damaged/lost),
  quantity, handled_by → users, issued_to_user_id → users (nullable),
  remarks, transaction_date, timestamps

otp_codes
  id, mobile_number, code_hash, expires_at, is_used, attempt_count, timestamps
```

**Immutability guarantee:** `stock_transactions` and `equipment_site_allocations` are always updated in the **same Knex database transaction**. There is no code path in `equipment/service.js` that modifies one without the other. If either write fails, both are rolled back.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│  Express API    │
│  (port 5173)    │     │  (port 3001)    │
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
             ┌──────────┐ ┌──────────┐ ┌──────────┐
             │Postgres17│ │  MinIO   │ │  Twilio  │
             │ (pg data)│ │  (files) │ │  (SMS)   │
             └──────────┘ └──────────┘ └──────────┘
```

### Role Hierarchy

```
super_admin
  └── company_admin
        └── site_supervisor
              └── worker
```

---

## AWS Deployment

### Architecture

```
Route 53 → CloudFront → S3 (frontend build)
                └──▶ ALB → ECS Fargate (backend)
                               └──▶ RDS PostgreSQL 17
                               └──▶ S3 (photo uploads)
```

### Step-by-step

#### 1. Postgres — Amazon RDS

1. Create an RDS instance: Engine=PostgreSQL 17, Multi-AZ for production.
2. Note the endpoint, port (5432), DB name, user, password.
3. Set `DATABASE_URL=postgres://user:pass@rds-endpoint:5432/sitetrack` in your ECS task definition.
4. Allow inbound 5432 from the ECS security group only.

#### 2. Photo Storage — Amazon S3

1. Create an S3 bucket, e.g. `sitetrack-media-prod`.
2. Create an IAM user/role with `s3:PutObject`, `s3:GetObject` on that bucket.
3. Set `MINIO_ENDPOINT` to `https://s3.amazonaws.com` (or the regional endpoint), set `MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` to IAM access/secret keys, set `MINIO_BUCKET` to your bucket name.
   - The `storageService.js` uses the same S3 SDK client, so it works with real AWS S3 without code changes.

#### 3. Backend — ECR + ECS Fargate

```bash
# Build and push backend image
aws ecr create-repository --repository-name sitetrack-backend
docker build -t sitetrack-backend ./backend
docker tag sitetrack-backend:latest <account>.dkr.ecr.<region>.amazonaws.com/sitetrack-backend:latest
aws ecr get-login-password | docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com
docker push <account>.dkr.ecr.<region>.amazonaws.com/sitetrack-backend:latest
```

Create an ECS cluster (Fargate), task definition (CPU 512, Memory 1024), and service.  
Set environment variables in the task definition (all vars from `.env.example`).  
Attach an Application Load Balancer → forward port 3001 → target group.

#### 4. Frontend — S3 + CloudFront

```bash
cd frontend
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1 VITE_GOOGLE_CLIENT_ID=your_id npm run build
aws s3 sync dist/ s3://sitetrack-frontend-prod --delete
aws cloudfront create-invalidation --distribution-id <id> --paths "/*"
```

Configure CloudFront: origin = S3 bucket, custom error page 404 → /index.html (for SPA routing).

#### 5. GitHub Actions Deploy Job

Add these secrets to your GitHub repository:
- `AWS_REGION`
- `AWS_ACCOUNT_ID`
- `ECR_REPOSITORY` (e.g. `sitetrack-backend`)
- `ECS_CLUSTER`
- `ECS_SERVICE`
- `FRONTEND_S3_BUCKET`
- `CLOUDFRONT_DISTRIBUTION_ID`
- `VITE_API_BASE_URL`
- `VITE_GOOGLE_CLIENT_ID`

The deploy job in `.github/workflows/ci.yml` (skeleton) will:
1. Build + push backend image to ECR
2. Update ECS service with new image digest
3. Build frontend with production env vars
4. Sync to S3 + invalidate CloudFront

---

## Manual Verification Checklist

After running `make setup`, verify the following:

### Geofence

- [ ] Log in as `worker@sitetrack.ae`
- [ ] On the Attendance page, click **Check In**
- [ ] Allow browser location — if you're near Dubai (25.0802°N, 55.1402°E), it should succeed
- [ ] To test rejection: open browser dev tools, override geolocation to `lat=25.2048, lng=55.2708` (Downtown Dubai, ~15 km away)
- [ ] Click Check In → should see: *"You are 15,XXXm from the site. You must be within 300m to check in."*

### Low-Stock Alert

- [ ] Log in as `supervisor@sitetrack.ae`
- [ ] Go to Equipment → Transactions
- [ ] Record a **Restock** of Portland Cement: +50 bags → allocation = 150
- [ ] Record an **Issue** of 110 bags → allocation = 40 (below reorder level of 50)
- [ ] Go to Equipment → Low Stock Alerts → Portland Cement should appear
- [ ] Verify: `GET /api/v1/equipment/alerts/low-stock` returns the item

### Audit Trail

- [ ] After all transactions above, run: `SELECT * FROM stock_transactions ORDER BY created_at DESC`
- [ ] Every quantity change must have a corresponding row — no silent updates to `equipment_site_allocations`

### RTL (Arabic)

- [ ] Click **ع** in the top nav
- [ ] Full page should flip to RTL: nav on right, text right-aligned, Arabic font active
- [ ] Verify on Login page, Attendance table, Equipment form

---

## Development

```bash
# Start all services
make dev

# Run backend tests
make test

# View logs
make logs

# Stop everything
make stop

# Nuclear clean (removes DB data)
make clean
```

### Running backend tests locally (without Docker)

```bash
cd backend
createdb sitetrack_test
TEST_DATABASE_URL=postgres://localhost/sitetrack_test npm test
```

### Useful commands

```bash
# Run a specific migration
docker compose exec backend npx knex migrate:latest --knexfile src/config/knexfile.js

# Roll back last migration
docker compose exec backend npx knex migrate:rollback --knexfile src/config/knexfile.js

# Open a psql shell
docker compose exec postgres psql -U sitetrack -d sitetrack
```
