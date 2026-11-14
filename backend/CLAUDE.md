# backend: FastAPI API (port 8080 locally)

- Run from this folder with the venv active: `uvicorn app.main:app --reload --port 8080`. Docs at `/docs`, health at `/api/v1/actuator/health`.
- Layers: `app/routers/` handle HTTP, auth and the DB session (`Depends(get_db)`); `app/services/` talk to Gemini and Cloudinary and do extraction, chunking and RAG; `app/models.py` holds the SQLAlchemy tables.
- Request and response models in `app/schemas.py` extend `CamelModel`, so the JSON is camelCase.
- Routes are plain `def` functions with synchronous SQLAlchemy sessions; FastAPI runs them in its thread pool.
- Auth: `get_current_user` reads `Authorization: Bearer <jwt>` and rejects disabled users. `require_admin` needs `ROLE_ADMIN`; the admin router applies it to every route.
- Startup: `bootstrap()` in `app/main.py` seeds `ROLE_USER`, `ROLE_ADMIN` and the admin user. It is idempotent.
- Limits: uploads up to 20 MB, extensions `.pdf`, `.docx`, `.txt`, `.md`. Retrieval defaults in `app/config.py`: chunk 900 characters with 150 overlap, top 5 chunks, similarity threshold 0.20.
- Errors raise `HTTPException`, which FastAPI returns as `{"detail": ...}`. The frontend expects `{message}`: a known mismatch.
- Deploy: `render.yaml` in the repo root builds this folder on Render. `Dockerfile` is an alternative that listens on `$PORT`, default 8080.
- No tests.
