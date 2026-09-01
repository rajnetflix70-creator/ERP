# SiteTrack — Production Deployment Guide
> **Target:** Single Ubuntu VPS (DigitalOcean / Hetzner / AWS EC2 / any cloud)  
> **Domain example:** `akconstruction.ae` (replace with your purchased domain)  
> **Architecture:** Nginx on host (SSL) → Docker Compose (frontend + backend + postgres + minio)

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [DNS Records](#2-dns-records)
3. [VPS Setup](#3-vps-setup)
4. [Deploy the Application](#4-deploy-the-application)
5. [Host Nginx + SSL with Certbot](#5-host-nginx--ssl-with-certbot)
6. [Google OAuth Setup](#6-google-oauth-setup)
7. [Post-Deployment Checklist](#7-post-deployment-checklist)
8. [Updating the Application](#8-updating-the-application)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Prerequisites

| Item | Requirement |
|------|-------------|
| VPS | Ubuntu 22.04 LTS, minimum 2 CPU / 2 GB RAM / 40 GB SSD |
| Domain | Purchased `.ae` domain (e.g. `akconstruction.ae`) |
| DNS access | Ability to add A records at your registrar |
| Local machine | Git installed |

---

## 2. DNS Records

Log in to your domain registrar's DNS panel and add these **A records** pointing to your VPS IP address:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | `@` (or `akconstruction.ae`) | `YOUR_VPS_IP` | 3600 |
| A | `www` | `YOUR_VPS_IP` | 3600 |
| A | `api` | `YOUR_VPS_IP` | 3600 |
| A | `storage` | `YOUR_VPS_IP` | 3600 |

> **Wait 5–30 minutes for DNS propagation before proceeding to SSL setup.**

Verify with:
```bash
nslookup akconstruction.ae
nslookup api.akconstruction.ae
```

---

## 3. VPS Setup

SSH into your server and run these commands:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Install Nginx + Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Enable Nginx on boot
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Git
sudo apt install -y git
```

---

## 4. Deploy the Application

### 4.1 Clone the repository

```bash
cd /opt
sudo git clone https://github.com/YOUR_ORG/projectAK.git sitetrack
sudo chown -R $USER:$USER /opt/sitetrack
cd /opt/sitetrack
```

### 4.2 Create the production .env file

```bash
cp .env.production.example .env
nano .env
```

Fill in **every value** marked with `← FILL IN`. Key things to set:

```env
NODE_ENV=production

# Your domain
CORS_ORIGIN=https://akconstruction.ae,https://www.akconstruction.ae
VITE_API_BASE_URL=https://api.akconstruction.ae/api/v1

# Strong passwords
POSTGRES_PASSWORD=<generate: openssl rand -hex 32>
MINIO_ROOT_USER=sitetrack_minio
MINIO_ROOT_PASSWORD=<generate: openssl rand -hex 32>

# Strong JWT secret
JWT_SECRET=<generate: openssl rand -hex 64>

# MinIO public endpoint
MINIO_PUBLIC_ENDPOINT=https://storage.akconstruction.ae
```

### 4.3 Build and start all containers

```bash
docker compose up -d --build
```

This will:
- Build the React frontend with your production `VITE_API_BASE_URL` baked in
- Build the Express backend
- Start PostgreSQL, MinIO, backend, and frontend containers
- Run database migrations

### 4.4 Run database migrations

```bash
docker compose exec backend npm run migrate
```

Optionally seed initial data:
```bash
docker compose exec backend npm run seed
```

### 4.5 Verify containers are running

```bash
docker compose ps
```

All services should show `running`. Test the backend health check:
```bash
curl http://localhost:3001/api/v1/health
# Expected: {"status":"ok"}
```

---

## 5. Host Nginx + SSL with Certbot

The Docker containers run on **internal ports** (3001, 5173:80). The host Nginx acts as an **SSL-terminating reverse proxy** that forwards traffic from the internet to the correct container.

### 5.1 Create Nginx site configurations

**Frontend — `akconstruction.ae`**

```bash
sudo nano /etc/nginx/sites-available/sitetrack-frontend
```

Paste:
```nginx
server {
    listen 80;
    server_name akconstruction.ae www.akconstruction.ae;

    location / {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Backend API — `api.akconstruction.ae`**

```bash
sudo nano /etc/nginx/sites-available/sitetrack-api
```

Paste:
```nginx
server {
    listen 80;
    server_name api.akconstruction.ae;

    # Increase body size limit for file uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

**MinIO Storage — `storage.akconstruction.ae`** (optional, for file downloads)

```bash
sudo nano /etc/nginx/sites-available/sitetrack-storage
```

Paste:
```nginx
server {
    listen 80;
    server_name storage.akconstruction.ae;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 5.2 Enable the sites

```bash
sudo ln -s /etc/nginx/sites-available/sitetrack-frontend /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/sitetrack-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/sitetrack-storage /etc/nginx/sites-enabled/

sudo nginx -t          # Check for syntax errors
sudo systemctl reload nginx
```

### 5.3 Obtain SSL certificates with Certbot

```bash
sudo certbot --nginx \
  -d akconstruction.ae \
  -d www.akconstruction.ae \
  -d api.akconstruction.ae \
  -d storage.akconstruction.ae
```

Follow the prompts. Certbot will:
- Verify domain ownership (requires DNS to be pointing to the server)
- Obtain Let's Encrypt certificates
- Automatically update your Nginx configs to use HTTPS and redirect HTTP → HTTPS

### 5.4 Enable auto-renewal

Certbot installs a systemd timer by default. Verify it:
```bash
sudo systemctl status certbot.timer
```

---

## 6. Google OAuth Setup

If you want Google Sign-In to work on your production domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services** → **Credentials**
2. Click your **OAuth 2.0 Client ID**
3. Under **Authorised JavaScript origins**, add:
   - `https://akconstruction.ae`
   - `https://www.akconstruction.ae`
4. Click **Save**
5. Copy the **Client ID** and add it to your `.env`:
   ```env
   GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   ```
6. Rebuild and redeploy:
   ```bash
   docker compose up -d --build
   ```

---

## 7. Post-Deployment Checklist

Run through each item after deployment:

- [ ] `curl https://api.akconstruction.ae/api/v1/health` returns `{"status":"ok"}`
- [ ] `https://akconstruction.ae` loads the React app
- [ ] Login with email + password works
- [ ] Login with Google Sign-In works (if Google OAuth configured)
- [ ] OTP login works (requires Twilio credentials in `.env`)
- [ ] Dashboard loads project data correctly
- [ ] Bulk Attendance → **Download Excel** button downloads the file (tests the fixed hardcoded URL)
- [ ] File uploads work (profile pictures, documents) and download links are accessible
- [ ] HTTPS padlock shows on both `akconstruction.ae` and `api.akconstruction.ae`
- [ ] `curl -I https://akconstruction.ae` shows security headers:
  - `X-Frame-Options: SAMEORIGIN`
  - `X-Content-Type-Options: nosniff`
- [ ] Cross-Origin test: open browser console on a different site, try `fetch('https://api.akconstruction.ae/api/v1/health')` — should be blocked by CORS

---

## 8. Updating the Application

When you push new code, SSH into the VPS and run:

```bash
cd /opt/sitetrack

# Pull latest code
git pull origin main

# Rebuild and restart (rebuilds Docker images, re-bakes Vite bundle)
docker compose up -d --build

# Run any new migrations
docker compose exec backend npm run migrate
```

> **Note:** If you only changed backend code (no frontend env vars changed), you can skip `--build` for faster deploys: `docker compose up -d`

---

## 9. Troubleshooting

### Backend not starting
```bash
docker compose logs backend --tail=50
```
Common causes:
- `JWT_SECRET` or `CORS_ORIGIN` missing with `NODE_ENV=production` → Add them to `.env`
- Database connection failed → Check `POSTGRES_PASSWORD` matches in both `POSTGRES_PASSWORD` and `DATABASE_URL`

### Frontend shows blank page / API errors
- Open browser DevTools → Network tab → check if API calls go to the right URL
- If URL is still `localhost:3001`, the `VITE_API_BASE_URL` wasn't set correctly at build time → update `.env` and run `docker compose up -d --build`

### CORS errors in browser console
- Verify `CORS_ORIGIN` in `.env` exactly matches the origin shown in the error (including `https://`)
- After updating `.env`, restart the backend: `docker compose restart backend`

### SSL certificate errors
- Ensure DNS A records are pointing to your VPS IP and have propagated
- Re-run: `sudo certbot --nginx -d akconstruction.ae -d api.akconstruction.ae`

### MinIO file download URLs not working
- Check `MINIO_PUBLIC_ENDPOINT` is set to a publicly accessible URL (e.g. `https://storage.akconstruction.ae`)
- Ensure the `storage.akconstruction.ae` Nginx config is active and SSL is set up for it

---

## Quick Reference — Important URLs

| Service | URL |
|---------|-----|
| Frontend | `https://akconstruction.ae` |
| API Health | `https://api.akconstruction.ae/api/v1/health` |
| MinIO Console | `http://YOUR_VPS_IP:9001` (internal only — do not expose publicly) |
| MinIO Storage | `https://storage.akconstruction.ae` |

## Quick Reference — Useful Docker Commands

```bash
# View all container status
docker compose ps

# View live backend logs
docker compose logs -f backend

# View live frontend logs
docker compose logs -f frontend

# Restart only the backend (e.g. after env change)
docker compose restart backend

# Open a shell in the backend container
docker compose exec backend sh

# Full rebuild after code/env changes
docker compose up -d --build
```
