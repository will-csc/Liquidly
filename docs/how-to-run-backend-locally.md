# How to Run the Backend Locally (Spring Boot)

This guide explains how to run the Liquidly backend API on your machine.

## Prerequisites

- Java 17 (JDK 17)
- Maven 3.9+
- PostgreSQL (recommended) or you can use the H2 fallback

## Project Location

- Backend folder: `backend-api`

## Database Strategy (Important)

The backend uses a failover strategy in this order:

1. Primary database (configured via `app.datasource.primary.*`)
2. Backup database (configured via `app.datasource.backup.*`)
3. Fallback: in-memory H2 database

The configuration is in:

- `backend-api/src/main/resources/application.properties`
- `backend-api/src/main/java/com/liquidly/api/config/DatabaseConfig.java`

## Option A: Run with Local PostgreSQL (Recommended)

1. Install PostgreSQL.
2. Create a database (example):
   - Database name: `liquidly`
3. Configure the connection in `application.properties` using the backup datasource keys:
   - `app.datasource.backup.url`
   - `app.datasource.backup.username`
   - `app.datasource.backup.password`

Tip: you can also override Spring properties using environment variables (useful to avoid committing credentials).

## Option B: Run with H2 (No PostgreSQL)

If no Primary/Backup database is reachable, the backend automatically falls back to H2 (in-memory).

This is useful for quickly testing endpoints, but data will be lost when you stop the app.

## Start the Backend

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

## Quick Smoke Test

Open in your browser:

- `http://localhost:8080/api/users`

If you get a response (or an error JSON), the server is running.

## Common Issues

### Port already in use

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

### PostgreSQL connection errors

If PostgreSQL is not running or the credentials are wrong, you will see connection logs and the app may fall back to H2.

Check:

- PostgreSQL is running
- The database exists
- The URL/username/password are correct

