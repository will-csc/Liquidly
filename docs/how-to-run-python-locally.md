# How to Run the Python Service Locally (Flask Email/Report Service)

This guide explains how to run the Liquidly Python service locally.

## What This Is

The repository contains a Python Flask service at:

- `services/email-service`

It provides endpoints to send emails (including password recovery codes) and to generate/send an Excel report based on the PostgreSQL database used by the backend.

## Prerequisites

- Python 3.10+ (recommended)
- pip
- (Recommended) a virtual environment (venv)
- PostgreSQL database reachable (required for report generation and seed endpoints)

## Project Location

- Python service folder: `services/email-service`

## Environment Variables (Important)

The service loads environment variables from the OS and from a local `.env` file (via `python-dotenv`).

Required for sending emails:

- `SMTP_USERNAME`
- `SMTP_PASSWORD`

Optional SMTP settings:

- `SMTP_SERVER` (default: `smtp.gmail.com`)
- `SMTP_PORT` (default: `587`)
- `SMTP_USE_SSL` (default: inferred from port 465)
- `SMTP_USE_STARTTLS` (default: `true`)

API key protection (optional but recommended):

- `EMAIL_SERVICE_API_KEY`

If set, all requests must include header: `X-API-Key: <value>`

Database configuration (required for report generation and seeding):

- `DATABASE_URL` (example: `postgresql://user:pass@localhost:5432/liquidly`)
- `DB_SSLMODE` (default: `prefer`)

Fallback behavior: if `DATABASE_URL` is not set, the service tries to read the backend config from:

- `backend-api/src/main/resources/application.properties` (using `app.datasource.backup.*`)

## Install Dependencies

From the repository root:

```bash
cd services/email-service
python -m venv .venv
```

Activate the venv:

- Windows (PowerShell):

```bash
.\.venv\Scripts\Activate.ps1
```

- macOS/Linux:

```bash
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Configure Local .env (Optional)

Create `services/email-service/.env` (do not commit secrets):

```bash
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USE_STARTTLS=true
SMTP_USERNAME=your_email@example.com
SMTP_PASSWORD=your_app_password

EMAIL_SERVICE_API_KEY=local-dev-key

DATABASE_URL=postgresql://user:pass@localhost:5432/liquidly
DB_SSLMODE=prefer
```

## Start the Service

From the repository root:

```bash
cd services/email-service
python app.py
```

By default it runs on:

- `http://localhost:5000` (or `PORT` env var if set)

## Quick Smoke Test

Open in your browser:

- `http://localhost:5000/health`

Or test with curl:

```bash
curl http://localhost:5000/health
```

If `EMAIL_SERVICE_API_KEY` is set, add the header to requests:

```bash
curl -H "X-API-Key: local-dev-key" http://localhost:5000/health
```

## Useful Endpoints

- `GET /health` (health check)
- `POST /send-email` (send a plain text email)
- `POST /send-recovery-code` (send password recovery code email)
- `POST /send-report` (generate an Excel report and send it as attachment)
- Seed utilities (require DB):
  - `POST /seed/invoices-pos`
  - `GET /seed/status`
  - `POST /seed/start`
  - `POST /seed/stop`

## Common Issues

### SMTP is not configured

If you see an error like `SMTP is not configured`, set:

- `SMTP_USERNAME`
- `SMTP_PASSWORD`

For Gmail, use an App Password (not your normal password) and ensure your account settings allow SMTP access.

### Database errors (for report/seed endpoints)

- Ensure the database is running and reachable
- If using `DATABASE_URL`, confirm it is correct
- If relying on fallback from `application.properties`, confirm `app.datasource.backup.*` is configured and reachable

### Port already in use

Set a different port with:

- `PORT=5001` (environment variable) before starting the app

