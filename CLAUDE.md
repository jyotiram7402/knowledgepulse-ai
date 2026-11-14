# CLAUDE.md: KnowledgePulse AI (Python edition)

## Overview
- Users upload documents (PDF, DOCX, TXT, MD) and chat with them. Answers are grounded in the user's own documents and carry numbered citations (retrieval-augmented generation). Admins see platform stats, users and documents.
- A FastAPI rewrite of an earlier Java version with the same API, database schema and React frontend (see README.md). The Java version is not in this repo.
- Naming trap: the first commit message says "SmartShield AI full-stack" and the original folder was `Ai-Python`, but this code is KnowledgePulse. Claude sessions opened in that folder were mostly about the SmartShield AI project, which lives in its own repo with its own CLAUDE.md.

## Tech stack
- `backend/`: Python 3.12 (Render pins 3.12.7, Docker uses `python:3.12-slim`), FastAPI 0.115.5, SQLAlchemy 2.0.36 with psycopg2, pgvector 0.3.6, Pydantic 2.10 and pydantic-settings, PyJWT and bcrypt, httpx, cloudinary, pypdf, python-docx.
- `frontend/`: React 18.3, Vite 5, TypeScript 5.6, Tailwind 3, React Router 6, TanStack Query 5, Zustand 5, axios, react-markdown, react-dropzone, react-hot-toast.
- Database: PostgreSQL 16 with pgvector, hosted on Neon. Schema in `database/schema.sql`.
- AI: Google Gemini REST API, `gemini-embedding-001` at 768 dimensions and `gemini-2.5-flash` for chat. Files are stored on Cloudinary.

## Setup on a fresh machine
1. Install Git, Python 3.12 and Node 20+. You need a PostgreSQL with pgvector: a Neon project, or a local Postgres with the `vector` extension (unverified).
2. `git clone https://github.com/jyotiram7402/knowledgepulse-ai.git` (private repo).
3. Run `database/schema.sql` once in the Neon SQL editor. It enables `pgcrypto` and `vector` and creates every table.
4. Backend: `cd backend`, `py -3.12 -m venv .venv`, `.\.venv\Scripts\Activate.ps1`, `pip install -r requirements.txt`, then copy `.env.example` to `.env` and fill it in.
5. Frontend: `cd frontend`, `npm install`, then copy `.env.example` to `.env`.
6. Start the backend, then the frontend, and open http://localhost:5173. On its first start the backend creates the two roles and the admin user from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

## Commands
| Task | Command |
|---|---|
| Backend install | `cd backend && pip install -r requirements.txt` (venv active) |
| Backend dev :8080 | `cd backend && uvicorn app.main:app --reload --port 8080` |
| API docs / health | http://localhost:8080/docs and http://localhost:8080/api/v1/actuator/health |
| Frontend install | `cd frontend && npm install` |
| Frontend dev :5173 | `cd frontend && npm run dev` |
| Frontend build | `cd frontend && npm run build` (runs `tsc -b`, output in `dist/`); `npm run preview` serves it |
| Backend container | `docker build -t knowledgepulse-backend backend`, then `docker run -p 8080:8080 --env-file backend/.env knowledgepulse-backend` (unverified) |
| Tests | None: no test suite and no CI. |
| Lint / format | None configured. `npm run build` type-checks with `tsc -b`, the only static check. |
| DB migrations | None. Apply `database/schema.sql` by hand and keep `backend/app/models.py` in sync with it. |
| Deploy backend | Render Blueprint from `render.yaml` (root `backend`, free plan, auto-deploy on push) |
| Deploy frontend | Vercel with Root Directory `frontend` and `VITE_API_URL` set to the Render URL plus `/api/v1` |

## Project map
- `backend/app/main.py`: FastAPI app, CORS, all routers under `/api/v1`, the health route, and `bootstrap()` which seeds roles and the admin on startup.
- `backend/app/config.py`: every setting, read from env by pydantic-settings. `backend/app/database.py`: engine, `SessionLocal`, the `get_db` dependency.
- `backend/app/models.py`: tables `roles`, `users`, `user_roles`, `documents`, `document_chunks` (`Vector(768)`), `chat_sessions`, `chat_messages`.
- `backend/app/schemas.py`: request and response models built on `CamelModel`. `security.py`: bcrypt and HS256 JWTs. `deps.py`: `get_current_user`, `require_admin`.
- `backend/app/routers/`: `auth` (register, login), `users` (me), `documents` (upload, list, search, get, delete), `chat` (sessions, messages), `admin` (stats, users, documents).
- `backend/app/services/`: `extraction` (pypdf, python-docx, text), `chunking`, `gemini` (embed, chat), `cloudinary_service`, `rag` (`answer()` and the system prompt).
- `frontend/src/App.tsx`: routes `/`, `/login`, `/register`, and the protected `/app/*` pages. `src/api/client.ts` is the axios client; `src/api/endpoints.ts` holds one function per backend call.
- `frontend/src/store/`: Zustand stores `auth` and `theme`. `src/pages/`, `src/components/`, `src/types/index.ts` mirror the API.
- Upload flow: `POST /documents` checks size and type, extracts text, uploads the file to Cloudinary, splits it into chunks, embeds each chunk with one Gemini call, then saves the chunks and marks the document `READY` or `FAILED`. All of it runs inside the request.
- Chat flow: `POST /chat/sessions/{id}/messages` embeds the question and takes the 5 nearest chunks of that user by cosine distance. Chunks below similarity 0.20 are dropped, but the closest one is always kept. Gemini gets numbered context plus the session history, and the answer is stored with its citations.

## Where to start for common tasks
- **API endpoint:** add a route to the matching `backend/app/routers/<area>.py` and its models to `schemas.py` on `CamelModel`. Protect it with `Depends(get_current_user)` or `require_admin`. Then add a function to `frontend/src/api/endpoints.ts` and types to `src/types/index.ts`.
- **Table or column:** edit `database/schema.sql`, apply the change in Neon by hand, and update `backend/app/models.py`.
- **Answer quality:** `backend/app/services/rag.py` holds the prompt and citation logic; `CHUNK_SIZE`, `CHUNK_OVERLAP`, `TOP_K` and `SIMILARITY_THRESHOLD` tune retrieval.
- **New file type:** `ALLOWED` in `routers/documents.py`, the parser in `services/extraction.py`, and the `accept` map in `frontend/src/pages/Upload.tsx`.
- **New page:** a component in `frontend/src/pages/`, a `<Route>` in `src/App.tsx` under `/app`, and a nav entry in `src/components/Layout.tsx`. Admin pages get `requireAdmin`.

## Conventions
- All configuration comes from `Settings` in `backend/app/config.py`; env names match the field names, case-insensitive. No code reads `os.environ` directly.
- JSON is camelCase in both directions through `CamelModel` (`alias_generator=to_camel`, `populate_by_name`). Python stays snake_case.
- Every user query is scoped by `owner_id` of the current user. The admin router applies `require_admin` to all of its routes.
- Errors are raised as `fastapi.HTTPException`; failures of Gemini become 502.
- Role names are Spring-style strings `ROLE_USER` and `ROLE_ADMIN`, kept from the Java version.
- Frontend: `@/` is `src/`. Server data uses TanStack Query, client state uses Zustand, notifications use react-hot-toast, and localStorage keys start with `kp-`.
- The API contract must stay identical to the Java version, because the frontend is shared (README.md).

## Env variables & external services
Placeholders are in `backend/.env.example` and `frontend/.env.example`. Never commit a real `.env`.
- `DATABASE_URL`: Neon dashboard connection string, kept with `sslmode=require`. `jdbc:` and `postgres://` prefixes are rewritten automatically.
- `JWT_SECRET`: a long random string you generate; Render generates one. `JWT_EXPIRATION_MINUTES`: token lifetime.
- `GEMINI_API_KEY`: from Google AI Studio (aistudio.google.com). `GEMINI_CHAT_MODEL`, `GEMINI_EMBEDDING_MODEL`: model names.
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: from the Cloudinary dashboard.
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend URLs; empty or `*` allows every origin.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`: the admin account seeded on startup; choose them yourself.
- Optional, with defaults in `config.py`: `JWT_ISSUER`, `GEMINI_BASE_URL`, `EMBEDDING_DIMENSIONS`, `CLOUDINARY_FOLDER`, `CHUNK_SIZE`, `CHUNK_OVERLAP`, `TOP_K`, `SIMILARITY_THRESHOLD`. `PORT` is read only by the Docker and Render start commands.
- `frontend/.env`: `VITE_API_URL`, the backend base URL including `/api/v1`, baked in at build time. Unset, it falls back to `/api/v1`.
- Services: Neon (Postgres and pgvector), Google Gemini API, Cloudinary, Render for the backend, Vercel for the frontend. Whether they are live today is unverified.

## Gotchas
- Error format mismatch: FastAPI answers `{"detail": ...}`, but the frontend's `ApiError` expects the Java version's `{message, ...}`. Users therefore see axios's generic "Request failed" text instead of the server's message. Verified in code, not run.
- `EMBEDDING_DIMENSIONS` (768) must equal `vector(768)` in `schema.sql` and `models.py`. A different embedding size needs a schema change and re-embedding of every chunk.
- Uploads are synchronous, with one Gemini call per chunk of about 900 characters, while the frontend gives up after 90 s. Large files can time out. If embedding fails, the file stays on Cloudinary and the document is marked `FAILED`.
- The Gemini key travels as a `?key=` query parameter in `services/gemini.py`. Never log request URLs.
- Apply the schema before the first start. Otherwise `bootstrap()` logs "Bootstrap failed (is the schema applied?)" and runs on without seeding.
- The JWT lives in localStorage under `kp-token`. Any 401 clears it and redirects to `/login`.
- The vector index is ivfflat with `lists = 100`, sized for the Neon free tier.

## Current status (13 Nov 2026)
- Moved to its own GitHub repo, `jyotiram7402/knowledgepulse-ai`, on 14 Nov 2026. Before that it existed only on the author's old laptop, with a remote pointing at the unrelated `smartshield` repo.
- Known bug: the error-format mismatch above.
- Missing: tests, lint and format config, CI, migrations.
- Unverified: whether the Render, Vercel and Neon deployments still exist.

When you change commands, structure, env vars or conventions, update this file in the same commit.
