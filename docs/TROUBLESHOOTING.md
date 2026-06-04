# Troubleshooting

## Backend won't start: "ERROR: type \"vector\" does not exist"

You forgot to run the schema. In Neon's SQL editor run [`database/schema.sql`](../database/schema.sql) - the first lines enable `pgvector`.

## "401 Unauthorized" immediately after login

- Confirm the backend `JWT_SECRET` is set and at least 32 bytes.
- Confirm the frontend's `VITE_API_URL` points at the exact backend `/api/v1` path (no trailing slash).

## CORS errors in the browser

- On Render, set `CORS_ALLOWED_ORIGINS` to your Vercel URL (no trailing slash). Multiple values are comma-separated.
- Redeploy the backend after editing env vars - Render restarts the instance.

## "File exceeds 20MB limit" or "Allowed file types..."

The backend rejects files >20MB or with unsupported extensions. PDF / DOCX / TXT / MD only.

## Document status stays "FAILED"

Check the Render logs. Most common causes:
- Gemini API key invalid or quota exhausted -> `Embedding service error`.
- A PDF with no extractable text (scanned image) -> add OCR or upload a text-based PDF.

## "I could not find that information in your knowledge base."

The RAG retriever found no chunks above the similarity threshold for this user. Either upload more relevant material or lower `knowledgepulse.rag.similarityThreshold` in `application.yml`.

## Render service is slow on first request

Free instances sleep after 15 minutes of inactivity. The first request after sleep takes ~30 s. Set a free uptime monitor to ping `/api/v1/actuator/health` every 10 minutes.

## Admin user can't sign in

The admin user is created on startup only if `ADMIN_EMAIL` and `ADMIN_PASSWORD` are set. If you changed them after the first deploy, the existing seeded row is **not** updated automatically - delete it from Neon and restart, or update the row's password by hand.
