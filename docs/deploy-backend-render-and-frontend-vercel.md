# Deploy: Backend on Render + Frontend on Vercel

This guide explains how to deploy:

- Backend API (Spring Boot) on Render
- Frontend Web (Vite + React) on Vercel

## 1) Deploy the Backend on Render

### Prerequisites

- A Render account
- A PostgreSQL database (Render PostgreSQL or any external Postgres provider)

### Create a Web Service

1. Go to Render and create a new Web Service.
2. Connect your GitHub repository.
3. Select the `backend-api` folder as the Root Directory.

Recommended settings:

- Environment: Java
- Build Command:

```bash
mvn -DskipTests package
```

- Start Command:

```bash
java -jar target/backend-api-0.0.1-SNAPSHOT.jar
```

### Configure the Port

Render provides a `PORT` environment variable. The backend is configured to use it:

- `server.port=${PORT:8080}`

So you do not need to hardcode a specific port in Render.

### Configure the Database (Environment Variables)

The backend selects the database in this order:

1. Primary datasource (`app.datasource.primary.*`)
2. Backup datasource (`app.datasource.backup.*`)
3. H2 fallback

On Render you should configure the Primary datasource so it always connects to your cloud database.

Set these environment variables in Render:

- `APP_DATASOURCE_PRIMARY_URL` (JDBC URL)
- `APP_DATASOURCE_PRIMARY_USERNAME`
- `APP_DATASOURCE_PRIMARY_PASSWORD`

Notes:

- Use a JDBC URL like: `jdbc:postgresql://HOST:PORT/DBNAME`
- If your provider requires SSL, include: `?sslmode=require`

Example (placeholders):

- `APP_DATASOURCE_PRIMARY_URL=jdbc:postgresql://your-host:5432/your-db?sslmode=require`
- `APP_DATASOURCE_PRIMARY_USERNAME=your-username`
- `APP_DATASOURCE_PRIMARY_PASSWORD=your-password`

### Verify the Backend

After deploy, open:

- `https://YOUR-RENDER-APP.onrender.com/api/users`

If you get a JSON response (or a JSON error), the backend is reachable.

## 2) Deploy the Frontend on Vercel

### Create a New Project

1. Go to Vercel and create a new Project.
2. Import the same GitHub repository.
3. Set the Root Directory to `frontend-web`.

Recommended settings:

- Framework: Vite (or “Other”)
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

### Configure Environment Variables

The frontend API base URL defaults to Render in production, but you should set it explicitly.

In Vercel, set:

- `VITE_API_URL_PROD=https://YOUR-RENDER-APP.onrender.com`

Optional for local development:

- `VITE_API_URL_LOCAL=http://localhost:8080`

### SPA Routing (React Router)

This repo already includes a rewrite rule:

- `frontend-web/vercel.json`

It ensures routes like `/login` work when you refresh the page.

### Verify the Frontend

After deploy:

1. Open the Vercel URL.
2. Confirm login/signup pages load.
3. Confirm API calls reach the Render backend.

## Troubleshooting

### CORS errors

If you see CORS errors in the browser console:

- Confirm the backend is reachable
- Confirm the backend allows the Vercel origin

### Database connection errors on Render

If the backend fails to start because it cannot connect to Postgres:

- Verify `APP_DATASOURCE_PRIMARY_*` variables
- Verify the database allows connections from Render

