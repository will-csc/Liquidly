# Running Locally

This document consolidates all “how to run locally” instructions for the Liquidly repository.

## Backend API (Spring Boot)

### Prerequisites

- Java 17 (JDK 17)
- Maven 3.9+
- PostgreSQL (recommended) or you can use the H2 fallback

### Project Location

- Backend folder: `backend-api`

### Database Strategy (Important)

The backend uses a failover strategy in this order:

1. Primary database (configured via `app.datasource.primary.*`)
2. Backup database (configured via `app.datasource.backup.*`)
3. Fallback: in-memory H2 database

The configuration is in:

- `backend-api/src/main/resources/application.properties`
- `backend-api/src/main/java/com/liquidly/api/config/DatabaseConfig.java`

### Option A: Run with Local PostgreSQL (Recommended)

1. Install PostgreSQL.
2. Create a database (example):
   - Database name: `liquidly`
3. Configure the connection in `application.properties` using the backup datasource keys:
   - `app.datasource.backup.url`
   - `app.datasource.backup.username`
   - `app.datasource.backup.password`

Tip: you can also override Spring properties using environment variables (useful to avoid committing credentials).

### Option B: Run with H2 (No PostgreSQL)

If no Primary/Backup database is reachable, the backend automatically falls back to H2 (in-memory).

This is useful for quickly testing endpoints, but data will be lost when you stop the app.

### Start the Backend

From the repository root:

```bash
cd backend-api
mvn spring-boot:run
```

Note: `mvn run` is not a valid Maven command. To run the app you need a goal, like `spring-boot:run`.

If the app starts successfully, it will log something like:

- `Tomcat started on port 8080`

By default, the port is:

- `8080` locally
- or `PORT` (environment variable) when deployed

### Quick Smoke Test

Open in your browser:

- `http://localhost:8080/api/users`

If you get a response (or an error JSON), the server is running.

### Common Issues

#### Port already in use

If you see a message that port 8080 is already in use:

- Stop the other service using 8080, or
- Start this backend on another port by setting `PORT` (or changing `server.port`).

Example (PowerShell):

```powershell
$env:PORT=0
mvn spring-boot:run
```

This picks a random free port; check the startup logs for the chosen port.

If you prefer a Maven profile, this repo also supports a random port:

```bash
mvn -Palt-port spring-boot:run
```

#### PostgreSQL connection errors

If PostgreSQL is not running or the credentials are wrong, you will see connection logs and the app may fall back to H2.

Check:

- PostgreSQL is running
- The database exists
- The URL/username/password are correct

## Frontend Web (Vite + React)

### Prerequisites

- Node.js 18+ (recommended)
- npm (or another package manager, but the commands below use npm)
- Backend running (optional, but recommended to test integrations)

### Project Location

- Web frontend folder: `frontend-web`

### API Configuration (Important)

The web frontend uses a failover mechanism:

1. Tries the production API (Render)
2. If it cannot connect, it falls back to the local API (`localhost:8080`)

The URLs can be configured via Vite environment variables:

- `VITE_API_URL_PROD` (default: `https://liquidly-backend.onrender.com`)
- `VITE_API_URL_LOCAL` (default: `http://localhost:8080`)

Example (optional): create a `frontend-web/.env.local` file:

```bash
VITE_API_URL_PROD=https://liquidly-backend.onrender.com
VITE_API_URL_LOCAL=http://localhost:8080
```

Note: by default, the app always starts by trying the production URL and only switches to the local one when production is unreachable.

### Install Dependencies

From the repository root:

```bash
cd frontend-web
npm install
```

### Run in Development

```bash
cd frontend-web
npm run dev
```

Vite typically starts at:

- `http://localhost:5173/`

(If the port is in use, it may pick another one and show it in the terminal.)

### Quick Smoke Test

1. Open in your browser: `http://localhost:5173/`
2. Open DevTools (Console/Network) and verify requests to `/api/*` endpoints return a response.

If you are running the backend locally, it should be at:

- `http://localhost:8080`

### Common Issues

#### Port already in use

If `5173` is in use, Vite will automatically try another port. Use the URL shown in the terminal.

#### CORS errors / Failed to connect to the API

- Confirm the backend is running and reachable at `http://localhost:8080`
- If you are using the local API, check the browser console to confirm failover happened
- If needed, adjust `VITE_API_URL_PROD` and `VITE_API_URL_LOCAL` in `frontend-web/.env.local`

## Frontend Mobile (Expo + React Native)

### Prerequisites

- Node.js 18+ (recommended)
- npm (or another package manager, but the commands below use npm)
- Expo CLI (no need to install globally; you can use `npx`)
- One of the environments below:
  - Android Studio (Android Emulator) or
  - Xcode (iOS Simulator, on macOS) or
  - A phone with Expo Go (Android/iOS)
- Backend running (optional, but recommended to test integrations)

### Project Location

- Mobile frontend folder: `frontend-mobile`

### API Configuration (Important)

The mobile app tries to use the production API and falls back to a local API if it cannot connect.

- Production: `https://liquidly-backend.onrender.com`
- Local (fallback):
  - Android (emulator): `http://10.0.2.2:8080`
  - iOS and Web: `http://localhost:8080`

Note: `localhost` on a physical phone does not point to your computer. To use a local backend on a phone, you must expose the backend on your network (e.g., `http://YOUR_IP:8080`) and adjust the local URL in the app code.

### Install Dependencies

From the repository root:

```bash
cd frontend-mobile
npm install
```

### Run the App

Start Expo:

```bash
cd frontend-mobile
npm run start
```

Then choose one of the options:

- Android (emulator): press `a` in the Expo terminal or run `npm run android`
- iOS (simulator, macOS): press `i` or run `npm run ios`
- Phone (Expo Go): scan the QR code with the Expo Go app

### Quick Smoke Test

1. Open the app and navigate to a screen that fetches data (e.g., lists/reports).
2. If the local backend is running, it should be at `http://localhost:8080` (or `http://10.0.2.2:8080` on the Android emulator).
3. If the production API is unavailable, the app will try to fall back automatically to the local URL.

### Common Issues

#### Android Emulator cannot access `localhost`

On the Android emulator, use `10.0.2.2` to access your computer's `localhost`.

#### Physical phone cannot access local backend

- Use the production API, or
- Change the app local URL to `http://YOUR_IP:8080` and make sure:
  - your phone and PC are on the same network
  - Windows Firewall allows incoming connections on port 8080

#### Connection errors / Timeout

- Confirm the backend is running and responds at `/api/users` (or another endpoint)
- If using the Android emulator, verify `http://10.0.2.2:8080` opens in the emulator browser

## Python Service (Flask Email/Report Service)

### What This Is

The repository contains a Python Flask service at:

- `services/email-service`

It provides endpoints to send emails (including password recovery codes) and to generate/send an Excel report based on the PostgreSQL database used by the backend.

### Prerequisites

- Python 3.10+ (recommended)
- pip
- (Recommended) a virtual environment (venv)
- PostgreSQL database reachable (required for report generation and seed endpoints)

### Project Location

- Python service folder: `services/email-service`

### Environment Variables (Important)

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

### Install Dependencies

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

### Configure Local .env (Optional)

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

### Start the Service

From the repository root:

```bash
cd services/email-service
python app.py
```

By default it runs on:

- `http://localhost:5000` (or `PORT` env var if set)

### Quick Smoke Test

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

### Useful Endpoints

- `GET /health` (health check)
- `POST /send-email` (send a plain text email)
- `POST /send-recovery-code` (send password recovery code email)
- `POST /send-report` (generate an Excel report and send it as attachment)
- Seed utilities (require DB):
  - `POST /seed/invoices-pos`
  - `GET /seed/status`
  - `POST /seed/start`
  - `POST /seed/stop`

### Common Issues

#### SMTP is not configured

If you see an error like `SMTP is not configured`, set:

- `SMTP_USERNAME`
- `SMTP_PASSWORD`

For Gmail, use an App Password (not your normal password) and ensure your account settings allow SMTP access.

#### Database errors (for report/seed endpoints)

- Ensure the database is running and reachable
- If using `DATABASE_URL`, confirm it is correct
- If relying on fallback from `application.properties`, confirm `app.datasource.backup.*` is configured and reachable

#### Port already in use

Set a different port with:

- `PORT=5001` (environment variable) before starting the app
