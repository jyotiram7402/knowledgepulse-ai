# Local Development (Optional)

You can deploy this project entirely from GitHub -> Vercel/Render without ever running it locally. This document is purely for contributors who *do* want to run it on their own machine.

## Prerequisites

- Java 21
- Maven 3.9+
- Node.js 20+
- A Postgres database with `pgvector` (either a Neon free DB or local: `docker run -p 5432:5432 -e POSTGRES_PASSWORD=pw pgvector/pgvector:pg16`)

## Backend

```bash
cd backend

# Copy and edit env values
cp .env.example .env

# Apply schema (psql or any client)
psql "$DATABASE_URL" -f ../database/schema.sql

# Run
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080/api/v1`.

## Frontend

```bash
cd frontend
cp .env.example .env
# Edit VITE_API_URL if needed (default works for the backend on :8080)

npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173`.

## Useful URLs

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:8080/api/v1/actuator/health`
- Swagger UI: `http://localhost:8080/api/v1/swagger-ui.html`
