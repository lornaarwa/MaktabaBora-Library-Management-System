# MaktabaBora - Render Cloud Deployment Guide

This guide provides step-by-step instructions for deploying the **MaktabaBora Smart Library Management System** to [Render](https://render.com) using our production-ready, unified full-stack Docker container and remote **Neon Cloud PostgreSQL**.

---

## 1. Architectural Overview

MaktabaBora is packaged as a single, production-hardened Docker container:
- **Frontend**: React 18 SPA compiled with Vite, served directly by Nginx from `/var/www/html/public/`.
- **Backend**: Laravel 11 REST API executed by PHP-FPM 8.2 (`serversideup/php:8.2-fpm-nginx`) supervised by S6-overlay.
- **Single-Origin Simplicity**: The UI and API share the exact same domain (`https://maktababora.onrender.com`), eliminating CORS configuration and hardcoded ports.
- **Database**: Exclusively connects to remote serverless **Neon Cloud PostgreSQL** with PgBouncer connection pooling and automatic TLS/SSL encryption.
- **Port Flexibility**: Includes a dynamic entrypoint wrapper ([`backend/entrypoint.sh`](backend/entrypoint.sh)) that binds Nginx to whatever `$PORT` Render assigns at runtime (e.g. `10000` or `8080`).

---

## 2. Prerequisites Checklist

Before starting, ensure you have:
1. A free **[Render.com](https://render.com)** account.
2. A free **[Neon.tech](https://neon.tech)** PostgreSQL database.
   - Example pooled connection URL format:
     ```text
     postgresql://neondb_owner:YOUR_PASSWORD@ep-muddy-night-aee97x3v-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
3. A fork or direct access to the GitHub repository: `https://github.com/lornaarwa/Smart-library-management-system`.

---

## 3. Deployment Method A: Render Blueprint (Recommended — 1-Click IaC)

MaktabaBora includes an Infrastructure-as-Code Blueprint ([`render.yaml`](render.yaml)) that configures all settings, health probes, and container parameters automatically.

### Step 1: Sign in to Render
Navigate to [dashboard.render.com](https://dashboard.render.com) and log in.

### Step 2: Create a Blueprint Instance
1. Click the **New +** button in the top navigation bar and select **Blueprint**.
2. Select your connected GitHub account and pick the `Smart-library-management-system` repository.
3. Choose the branch to deploy: `kimura` or `main`.
4. Render will scan the repository and detect the `render.yaml` specification.

### Step 3: Populate Required Secrets
Render will prompt you for any variables marked `sync: false` in `render.yaml`:
| Variable | Recommended Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-...-pooler...neon.tech/neondb?sslmode=require` | Your remote Neon pooled connection string. |
| `APP_URL` | `https://maktababora.onrender.com` | Your assigned Render service URL. |
| `OPENAI_API_KEY` | *(Optional)* | Your OpenAI API key for AI Librarian (or leave blank). |
| `DARAJA_CONSUMER_KEY` | `simulated_key` | Leave default for simulated sandbox flow. |
| `DARAJA_CONSUMER_SECRET` | `simulated_secret` | Leave default for simulated sandbox flow. |
| `DARAJA_PASSKEY` | `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` | Standard Daraja sandbox passkey. |
| `DARAJA_SHORTCODE` | `174379` | Standard Daraja sandbox Paybill/Till shortcode. |

> **Note:** `APP_KEY` is set to `generateValue: true`, so Render automatically generates a secure 32-character AES-256 master key for you.

### Step 4: Click Apply
Click **Apply**. Render will automatically:
1. Pull the Dockerfile.
2. Build the multi-stage container (compiling React with Vite and setting up PHP-FPM + Nginx).
3. Connect to Neon Cloud PostgreSQL and run all pending migrations.
4. Verify the `/up` health probe.
5. Provide a live public HTTPS URL!

---

## 4. Deployment Method B: Manual Web Service Setup

If you prefer to configure the service manually via the Render UI dashboard without Blueprint:

### Step 1: Create Web Service
1. In Render Dashboard, click **New +** > **Web Service**.
2. Connect your GitHub repository (`Smart-library-management-system`).
3. Select your deployment branch (`kimura` or `main`).

### Step 2: Configure Service Settings
| Field | Value |
| :--- | :--- |
| **Name** | `maktababora` (or your preferred service name) |
| **Region** | `Oregon (US West)` or `Ohio (US East)` (closest to Neon DB) |
| **Runtime** | `Docker` |
| **Dockerfile Path** | `./Dockerfile` |
| **Docker Context** | `.` |
| **Instance Type** | `Free` (0.1 CPU, 512 MB RAM) |
| **Health Check Path** | `/up` |

### Step 3: Add Environment Variables
Under the **Environment** tab, click **Add Environment Variable** and enter the following:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `PORT` | `8080` | External routing port |
| `NGINX_HTTP_PORT` | `8080` | Internal Nginx listening port |
| `RUN_MIGRATIONS` | `true` | Automatically runs `php artisan migrate --force` on startup |
| `APP_ENV` | `production` | Enables production error handling |
| `APP_DEBUG` | `false` | Disables verbose debug exposure |
| `APP_KEY` | `base64:YOUR_GENERATED_KEY=` | Generate via `php artisan key:generate --show` |
| `APP_URL` | `https://maktababora.onrender.com` | Live URL of the web service |
| `DB_CONNECTION` | `pgsql` | PostgreSQL driver |
| `DATABASE_URL` | `postgresql://neondb_owner:...@ep-...-pooler...neon.tech/neondb?sslmode=require` | Remote Neon pooled URI |
| `DB_SSLMODE` | `require` | Enforces SSL encryption for Neon DB |
| `LOG_CHANNEL` | `stderr` | Streams container logs to Render console |
| `SESSION_DRIVER` | `database` | Stores user sessions in PostgreSQL |
| `CACHE_STORE` | `database` | Stores application cache in PostgreSQL |
| `QUEUE_CONNECTION` | `database` | Background job processing queue |
| `DARAJA_ENV` | `sandbox` | Mobile money simulation mode |
| `DARAJA_SHORTCODE` | `174379` | Sandbox Paybill number |
| `DARAJA_PASSKEY` | `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919` | Sandbox passkey |
| `DARAJA_CONSUMER_KEY` | `simulated_key` | Simulation placeholder |
| `DARAJA_CONSUMER_SECRET` | `simulated_secret` | Simulation placeholder |
| `DARAJA_CALLBACK_URL` | `https://maktababora.onrender.com/api/v1/fines/daraja/callback` | Webhook receiver URL |

### Step 4: Deploy
Click **Create Web Service**. Monitor the live build logs in the Render console until you see:
```text
✅ NGINX + PHP-FPM is running correctly.
==> Your service is live 🎉
```

---

## 5. Setting Up Continuous Deployment (CI/CD via GitHub Actions)

MaktabaBora includes an automated CI/CD pipeline at [`.github/workflows/deploy-render.yml`](.github/workflows/deploy-render.yml). To enable automated zero-downtime deployment on git push:

1. In your Render Web Service dashboard, go to **Settings** > **Deploy Hook**.
2. Copy the unique **Deploy Hook URL** (e.g. `https://api.render.com/deploy/srv-xxxxxx?key=yyyyyy`).
3. In your GitHub repository, navigate to **Settings** > **Secrets and variables** > **Actions**.
4. Click **New repository secret**:
   - **Name**: `RENDER_DEPLOY_HOOK_URL`
   - **Secret**: Paste the Deploy Hook URL copied from Render.
5. Now, every push to `main` or `kimura` will automatically:
   - Execute all 127 automated PHPUnit test assertions.
   - Compile the React SPA bundle.
   - Trigger the Render deployment webhook **only if all tests pass**.

---

## 6. Post-Deployment Verification Checklist

Once deployed, verify your installation:

### 1. Health Probe Verification
```bash
curl -I https://maktababora.onrender.com/up
# Expected output: HTTP/1.1 200 OK
```

### 2. Frontend SPA Single-Origin Verification
Open your browser and navigate to:
- `https://maktababora.onrender.com/` (Landing page)
- `https://maktababora.onrender.com/catalog` (Book catalog & search)

### 3. API & Database Query Verification
```bash
curl "https://maktababora.onrender.com/api/v1/catalog/search?per_page=1"
# Returns live JSON book catalog from Neon PostgreSQL
```

### 4. Default Seeded Accounts for Testing
| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@maktababora.com` | `admin123` | Full control, user ban toggles, AI settings, database maintenance |
| **Librarian** | `librarian@maktababora.com` | `librarian123` | Circulation desk, checkouts, returns, hold queue approvals, fine waivers |
| **Member Patron** | `member@maktababora.com` | `member123` | Book reservations, digital eBook reader, perk passes, fine payments |

### 5. Safaricom Daraja M-Pesa Simulated Payment Flow
To test mobile payment without real money:
1. Log in as `member@maktababora.com`.
2. Go to the Catalog, select a digital eBook, and click **Pay via M-Pesa** (or pay an overdue fine).
3. Enter any standard Kenyan phone number (e.g. `254712345678`).
4. The system executes the simulated Daraja STK flow, returning an instant success envelope and unlocking lifetime reader access without charging your phone.

---

## 7. Operational Notes & Free-Tier Gotchas

1. **Cold Start Latency**: Render puts Free-tier web services to sleep after 15 minutes of inactivity. The initial wake-up request takes ~30–50 seconds while the container spins up and Neon DB unpauses compute.
   > **Tip for Demos:** Ping your service URL 1–2 minutes before a live presentation or grading session to warm up both the container and database.
2. **Database Migrations on Neon**: The entrypoint runs `php artisan migrate --force` automatically. [`backend/config/database.php`](backend/config/database.php) automatically switches from Neon's pooled endpoint (`-pooler.`) to direct connection during migrations to prevent PgBouncer transaction-mode locking errors.
3. **Stateless Container**: The Docker filesystem is ephemeral. All database records, loans, fines, reservations, and user accounts are permanently saved in the remote Neon PostgreSQL cloud database.
