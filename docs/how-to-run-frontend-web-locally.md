# How to Run the Web Frontend Locally (Vite + React)

This guide explains how to run the Liquidly web frontend on your machine.

## Prerequisites

- Node.js 18+ (recommended)
- npm (or another package manager, but the commands below use npm)
- Backend running (optional, but recommended to test integrations)

## Project Location

- Web frontend folder: `frontend-web`

## API Configuration (Important)

The web frontend uses a failover mechanism:

1. Tries the production API (Render)
2. If it cannot connect, it falls back to the local API (`localhost:8080`)

The URLs can be configured via Vite environment variables:

- `VITE_API_URL_PROD` (default: `https://backend-api.onrender.com`)
- `VITE_API_URL_LOCAL` (default: `http://localhost:8080`)

Example (optional): create a `frontend-web/.env.local` file:

```bash
VITE_API_URL_PROD=https://backend-api.onrender.com
VITE_API_URL_LOCAL=http://localhost:8080
```

Note: by default, the app always starts by trying the production URL and only switches to the local one when production is unreachable.

## Install Dependencies

From the repository root:

```bash
cd frontend-web
npm install
```

## Run in Development

```bash
cd frontend-web
npm run dev
```

Vite typically starts at:

- `http://localhost:5173/`

(If the port is in use, it may pick another one and show it in the terminal.)

## Quick Smoke Test

1. Open in your browser: `http://localhost:5173/`
2. Open DevTools (Console/Network) and verify requests to `/api/*` endpoints return a response.

If you are running the backend locally, it should be at:

- `http://localhost:8080`

## Common Issues

### Port already in use

If `5173` is in use, Vite will automatically try another port. Use the URL shown in the terminal.

### CORS errors / Failed to connect to the API

- Confirm the backend is running and reachable at `http://localhost:8080`
- If you are using the local API, check the browser console to confirm failover happened
- If needed, adjust `VITE_API_URL_PROD` and `VITE_API_URL_LOCAL` in `frontend-web/.env.local`

