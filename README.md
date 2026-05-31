# Liquidly

Liquidly is a multi-platform application to help companies consolidate and analyze **Invoices × Purchase Orders (POs) × Bill of Materials (BOM)**, detect variances, and generate reports.

## Overview
<img width="1875" height="890" alt="image" src="https://github.com/user-attachments/assets/0739b17e-593b-4da8-ab65-47908d928f1b" />

## Current Hosting

Current production/distribution topology:

- **Frontend Web**: Vercel
- **Backend API**: Render
- **Python Email Service**: AWS
- **Database**: Neon (PostgreSQL)

Current public endpoints:

- Web app: `https://liquidly.vercel.app`
- Backend API: `https://liquidly-backend.onrender.com`

Infrastructure notes:

- The web frontend is built to use the Render backend in production.
- The backend is configured to prioritize the primary cloud datasource, documented as Neon, before any local fallback.
- The Python service remains a separate component and is deployed independently from the backend.

The repository contains:

- **Backend API** (Spring Boot + PostgreSQL/H2)
- **Web frontend** (React + TypeScript + Vite)
- **Mobile app** (Expo + React Native)
- **Email service** (Python + Flask) used to send recovery emails

## Goals

- Centralize BOM, invoice, and PO data for liquidation/consumption analysis
- Provide dashboards and CRUD screens to manage projects, BOM, conversions, invoices, and POs
- Generate Excel reports and make them available for download via the backend
- Support authentication, including face login and password recovery

## Repository Structure

At the root:

- `backend-api/`: Spring Boot REST API
- `frontend-web/`: React web app (Vite)
- `frontend-mobile/`: Expo mobile app (React Native)
- `services/email-service/`: Python Flask service for email delivery
- `docs/`: project documentation (how to run each piece locally, deployment notes, etc.)
- `database/`: database schema utilities

## Web Frontend (`frontend-web/`)

Tech stack:

- React + TypeScript + Vite
- React Router
- Tailwind CSS
- Axios

Key folders:

- `frontend-web/src/pages`: route-level pages
- `frontend-web/src/components`: reusable UI blocks (tables, dashboards, nav)
- `frontend-web/src/components/ui`: low-level UI primitives
- `frontend-web/src/services`: API client and service wrappers
- `frontend-web/src/i18n`: translations and language provider

See: `docs/documentação/structure.md` and `docs/tutoriais/running-locally.md`.

## Backend API (`backend-api/`)

Tech stack:

- Java 17 + Spring Boot
- Spring Data JPA
- PostgreSQL (recommended), with fallback to H2 (in-memory)

See: `docs/documentação/structure.md` and `docs/tutoriais/running-locally.md`.

## Mobile App (`frontend-mobile/`)

Tech stack:

- Expo (React Native)
- Axios
- React Navigation

See: `docs/documentação/structure.md` and `docs/tutoriais/running-locally.md`.

## Email Service (`services/email-service/`)

Tech stack:

- Python + Flask
- SMTP for sending emails

See: `docs/tutoriais/running-locally.md` and `docs/documentação/structure.md`.

## Running Locally (Quick Start)

Prerequisites:

- Node.js 18+ (for web and mobile)
- Java 17 + Maven (for backend)
- Python 3.10+ (for email service, optional)
- PostgreSQL (recommended for realistic data; backend can fall back to H2)

### 1) Backend API

From the repository root:

```bash
cd backend-api
mvn spring-boot:run
```

Backend defaults to:

- `http://localhost:8080`

### 2) Web Frontend

From the repository root:

```bash
cd frontend-web
npm install
npm run dev
```

Vite typically starts at:

- `http://localhost:5173`

### 3) Mobile App (Expo)

From the repository root:

```bash
cd frontend-mobile
npm install
npm run dev
```

### 4) Email Service (Optional)

From the repository root:

```bash
cd services/email-service
python -m venv .venv
```

Activate the venv (PowerShell):

```powershell
.\.venv\Scripts\Activate.ps1
```

Install and run:

```bash
pip install -r requirements.txt
python app.py
```

## Configuration

### Web Frontend API URLs

The web frontend uses a failover mechanism:

1. Tries the production API
2. If unreachable, falls back to the local API

You can configure it via:

- `frontend-web/.env.local`
  - `VITE_API_URL_PROD`
  - `VITE_API_URL_LOCAL`

See: `docs/tutoriais/running-locally.md`.

### Email Service Environment Variables

The email service requires SMTP credentials. Do not commit secrets.

See: `docs/tutoriais/running-locally.md`.

## Scripts

Web (`frontend-web/package.json`):

- `npm run dev`
- `npm run lint`
- `npm run build`

Mobile (`frontend-mobile/package.json`):

- `npm run dev`
- `npm run test`

## Deployment Notes

See:

- `docs/tutoriais/deploy-backend-render-and-frontend-vercel.md`
- `docs/tutoriais/docker-ec2.md`

Current deployment model used by the project:

- `frontend-web` on Vercel
- `backend-api` on Render
- `services/email-service` on AWS
- primary PostgreSQL on Neon

Alternative deployment model documented in this repository:

- backend stack via Docker / EC2 for self-hosted scenarios

## Additional Documentation

- `docs/documentação/documentacao-tecnica.md`
- `docs/documentação/documentacao-operacional.md`
- `docs/documentação/documentacao-api.md`
- `docs/apresentação/roteiro-video-banca.md`

- Appresentation: https://youtu.be/D2DG6kssLro?si=F18UVMNjL_636Zws

## Useful Links

- Weekly activities to reach the final result: `https://app.notion.com/p/Main-Project-Progress-30e83df511ae80a2afe2f4023cf2f59c?source=copy_link`
- Backup: `https://drive.google.com/drive/folders/18qyG-tZ395gJhmbnAK0SEfywt3EJysKK`
