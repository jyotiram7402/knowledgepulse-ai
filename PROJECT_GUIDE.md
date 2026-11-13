# KnowledgePulse AI — Complete Project & Interview Guide

> Enterprise AI Knowledge Assistant built with **RAG (Retrieval-Augmented Generation)**.
> Upload your documents → ask questions → get answers grounded in your content, with citations.

This document is a full hand-off + study guide. Read it top to bottom before an interview.

---

## Table of Contents

1. [What the App Does](#1-what-the-app-does)
2. [Who Can Use This App](#2-who-can-use-this-app)
3. [Detailed Tech Stack & Why](#3-detailed-tech-stack--why-we-chose-each)
4. [Architecture Overview](#4-architecture-overview)
5. [How the RAG Pipeline Works](#5-how-the-rag-pipeline-works-step-by-step)
6. [How Our AI Works — Tokens & Responses](#6-how-our-ai-works--tokens--responses)
7. [Using the App Efficiently (Low Tokens, High Output)](#7-using-the-app-efficiently-low-tokens-high-output)
8. [Setup Process — In Order](#8-setup-process--what-we-did-in-order)
9. [Free Services We Used](#9-free-services-we-used)
10. [Errors We Faced & How We Solved Them](#10-errors-we-faced--how-we-solved-them)
11. [How We Would Scale It](#11-how-we-would-scale-it-interview-answer)
12. [Future Functionality To Add](#12-future-functionality-to-add)
13. [Going to Production — What To Take Care Of](#13-going-to-production--what-to-take-care-of)
14. [Best Paid Services & Pricing (Cheapest Path)](#14-best-paid-services--pricing-cheapest-path)
15. [More Features We Could Add](#15-more-features-we-could-add)
16. [How To Explain This Project In An Interview](#16-how-to-explain-this-project-in-an-interview)
17. [Quick Cheat Sheet](#17-quick-cheat-sheet)

---

## 1. What the App Does

KnowledgePulse AI lets a user **upload their own documents** (PDF, DOCX, TXT) and then **chat with those documents** in natural language. Every answer is grounded strictly in the uploaded content and returns **citations** pointing to the exact source passages.

**The user journey in one line:**

> Register → upload a document → the system extracts, chunks, and embeds it → ask a question → the system finds the most relevant passages → Gemini answers using only those passages → you get a grounded answer with citations.

**Core features:**
- Authentication: register, login, logout, JWT, role-based access (USER / ADMIN)
- Document management: upload, list, search, delete (originals stored in Cloudinary)
- RAG pipeline: extraction → chunking → embeddings → vector storage → semantic search → grounded generation → citations
- Chat: multi-turn sessions, history, delete (each session scoped to one user)
- Admin dashboard: users, all documents, system metrics
- Modern SaaS UI: dark mode, responsive, loading skeletons, empty states, error toasts

---

## 2. Who Can Use This App

| User type | Use case |
|-----------|----------|
| **Students / researchers** | Upload textbooks, papers, notes; ask questions; study faster with cited answers |
| **Professionals / analysts** | Query reports, contracts, specs, policies without re-reading everything |
| **Support / HR teams** | Turn manuals, SOPs, and policy docs into a searchable Q&A assistant |
| **Developers** | Chat with technical docs, API references, runbooks |
| **Legal / finance** | Ask questions across long documents and get answers with source citations |
| **Anyone with documents** | Replace "Ctrl+F across 200 pages" with natural-language Q&A |

**Key differentiator:** unlike a generic chatbot, answers come **only from your uploaded files** — so it doesn't hallucinate and you can verify every claim via citations.

---

## 3. Detailed Tech Stack & Why We Chose Each

> In an interview, never just name a tool — explain the trade-off it solved.

### Frontend

| Technology | What it is | Why we used it |
|-----------|------------|----------------|
| **React 18** | UI library | Component model, huge ecosystem, most in-demand frontend skill |
| **Vite** | Build tool / dev server | Near-instant hot reload, very fast builds (vs Create-React-App) |
| **TypeScript** | Typed JavaScript | Compile-time safety; catches API-shape bugs before runtime; self-documenting |
| **Tailwind CSS** | Utility-first CSS | Consistent design system fast; easy dark mode; no separate CSS files |
| **React Query** | Server-state cache | Caching, background refetch, loading/error states for free |
| **React Router** | Client routing | SPA navigation with protected routes and role guards |
| **Zustand** | Client state | Tiny global store for auth + theme (lighter than Redux) |
| **Axios** | HTTP client | Interceptors auto-attach JWT and handle 401 redirects centrally |

### Backend

| Technology | What it is | Why we used it |
|-----------|------------|----------------|
| **Java 21** | Language | LTS, modern features (records, pattern matching), strong typing |
| **Spring Boot 3.5** | App framework | Production-ready defaults, DI, auto-config — industry standard for Java APIs |
| **Spring Security** | AuthN/AuthZ | Battle-tested filter chain, method-level security, role checks |
| **JWT (jjwt)** | Stateless auth | No server session storage; scales horizontally; token carries identity + roles |
| **JPA / Hibernate** | ORM | Maps Java entities to tables; managed transactions; less boilerplate SQL |
| **Apache PDFBox + POI** | Text extraction | PDFBox reads PDFs, POI reads DOCX — mature, pure-Java, no native deps |
| **WebFlux WebClient** | HTTP client | Non-blocking calls to Gemini's REST API with timeouts |
| **springdoc-openapi** | API docs | Auto-generates Swagger UI from controllers |

### Data, AI & Infrastructure

| Technology | What it is | Why we used it |
|-----------|------------|----------------|
| **PostgreSQL 16** | Relational DB | Reliable, ACID, great extension support — the standard open-source RDBMS |
| **pgvector** | Vector extension | Stores embeddings inside Postgres + similarity search — no separate vector DB |
| **Gemini `gemini-embedding-001`** | Embeddings | Turns text into 768-dim vectors capturing meaning; free tier |
| **Gemini Flash (chat)** | LLM | Fast, cheap, good quality; free tier; ideal for grounded Q&A |
| **Cloudinary** | Object storage | Free file storage + CDN for original uploads |
| **Neon** | Serverless Postgres | Free Postgres with pgvector preinstalled; no DB server to manage |
| **Render** | Backend host | Free Docker web service; auto-deploy from GitHub |
| **Vercel** | Frontend host | Free, fast SPA hosting; auto-deploy from GitHub; global CDN |
| **Docker** | Containerization | Reproducible backend build on Render |

### Why RAG instead of just asking the LLM?
- LLMs **hallucinate** and have **no knowledge of your private documents**.
- RAG **grounds** answers in your content → accurate and verifiable.
- **Citations** let users trust and check answers.
- Much **cheaper and faster** than fine-tuning, and updates instantly when you upload new docs.

---

## 4. Architecture Overview

```
                                              Google
   Browser                                    Gemini API
   (Vercel)                                   (embeddings + chat)
       |                                          ^
       |  HTTPS / JWT                             |  HTTPS
       v                                          |
+----------------+        JPA / JDBC      +----------------+
| Spring Boot    | ---------------------> | Neon Postgres  |
| (Render)       |                        | + pgvector     |
+----------------+ <--------------------- +----------------+
   |   ^
   |   | Cloudinary HTTP API
   v
 Cloudinary (original files)
```

**Backend layers:** `controller` (HTTP) → `service` (logic) → `repository` (JPA) → `entity` (tables), with `security`, `config`, `dto`, and `exception` packages.

**Database tables (6):** `users`, `roles`, `documents`, `document_chunks`, `chat_sessions`, `chat_messages`.

---

## 5. How the RAG Pipeline Works (Step by Step)

This is the heart of the project — know it cold.

### Ingestion (on document upload)
1. **Validate** the file (type PDF/DOCX/TXT/MD; size ≤ 20 MB).
2. **Upload original** to Cloudinary (so users can download it later).
3. **Extract text** (PDFBox for PDF, POI for DOCX, UTF-8 for TXT/MD).
4. **Chunk** into ~900-char windows with ~150-char overlap, breaking on sentence boundaries. *(Overlap prevents losing context that straddles a chunk boundary.)*
5. **Embed** each chunk via Gemini → a 768-dimension vector.
6. **Store** each chunk (text + vector + metadata) in `document_chunks`; the vector goes into a pgvector column.
7. Mark the document **READY** (or **FAILED** with an error message).

### Retrieval & Generation (on a question)
1. **Embed the question** into a 768-dim vector with the same model.
2. **Similarity search** in pgvector using cosine distance (`<=>` operator), filtered to the **current user's chunks only**, returning the **top-K** (default 5) closest chunks.
3. **Build the prompt:** strict system instruction + retrieved chunks as numbered context + chat history + the question.
4. **Call Gemini chat** to generate a grounded answer.
5. **Return** the answer + citation pointers `[1]`, `[2]`, … and persist both messages.

### Why cosine similarity?
Cosine distance compares the **direction** of two vectors, ignoring magnitude. Two passages about the same topic point in a similar direction even if one is longer — so cosine is the standard metric for semantic text search.

---

## 6. How Our AI Works — Tokens & Responses

### What is a token?
A **token** is roughly **4 characters** (~¾ of a word). "KnowledgePulse" ≈ 4 tokens. Gemini bills and rate-limits by tokens (input + output).

### Where tokens get used in this app

**A) Embeddings (cheap, happens once per chunk):**
- On upload: each chunk (~900 chars ≈ ~225 tokens) is embedded once.
- A 10-page doc ≈ 20–40 chunks ≈ a few thousand input tokens **total, one time**.
- On each question: the question is embedded once (~10–50 tokens).
- Embeddings produce **no output tokens** — they return a vector.

**B) Chat generation (the main cost, happens per question):**

Per question, the **input** sent to Gemini is roughly:

| Part | Approx tokens |
|------|--------------|
| System instruction | ~120–180 |
| Top-5 retrieved chunks (context) | ~1,000–1,500 |
| Chat history (previous turns) | grows over a session |
| The user's question | ~10–60 |
| **Total input** | **~1,200–2,500** (more as history grows) |

The **output** (the answer) is capped at **`maxOutputTokens = 1024`** in our config, so a typical answer is ~100–400 tokens.

### How a response is produced (flow)
```
question → embed → vector search (top-5 chunks) → build prompt
        → Gemini chat (input ≈ 1.5–2.5k tokens) → answer (≤1024 tokens)
        → attach citations → save to chat_messages → return to UI
```

### Why this design keeps cost low
- We **only** send the top-5 most relevant chunks, **not** the whole document.
- Embeddings are computed **once** at upload, then reused for every future question.
- We use **Flash** models (cheapest tier), not Pro.
- Output is **capped** so the model can't ramble.

---

## 7. Using the App Efficiently (Low Tokens, High Output)

Practical levers — some are usage habits, some are config in `application.yml`.

### As a user
- **Ask specific questions.** "What privileges does the restricted DB user have?" beats "tell me about my doc." Specific questions retrieve better chunks → better answers with fewer wasted tokens.
- **Start a new chat for a new topic.** Chat history is re-sent every turn, so long unrelated history wastes input tokens. A fresh session = smaller prompt.
- **Upload focused documents.** One topic per document → tighter, more relevant chunks.

### As a developer (config knobs in `knowledgepulse.rag`)
| Setting | Effect on tokens | Trade-off |
|---------|------------------|-----------|
| `topK` (default 5) | Lower = fewer input tokens | Too low may miss context |
| `chunkSize` (default 900) | Smaller chunks = more precise, fewer wasted tokens per chunk | Too small loses context |
| `chunkOverlap` (default 150) | Lower = fewer/smaller chunks stored | Too low risks splitting ideas |
| `maxOutputTokens` (1024) | Lower = shorter, cheaper answers | Too low truncates answers |
| Trim chat history sent | Send only last N turns instead of all | Loses long-range memory |

### Architecture-level efficiency (future)
- **Cache** answers for identical questions (Redis) → 0 LLM tokens on a repeat.
- **Cache** embeddings for identical text.
- **Rerank** top-20 with a cheap reranker, then send only the best 3–4 to the LLM → fewer input tokens, higher precision.
- **Summarize** old chat history into a short memory instead of resending every turn.

**Rule of thumb:** *Retrieve less but more relevant context, cap output, reuse embeddings, and cache repeats.* That's how you get high-quality answers at minimum token cost.

---

## 8. Setup Process — What We Did, In Order

The order matters: each step depends on the previous one.

### Phase 1 — Build the code
1. Designed the data model (6 tables).
2. Built the Spring Boot backend: entities, repositories, JWT security, services (auth, document, RAG, chat, admin), REST controllers.
3. Built the React frontend: all pages, shared components, API client, auth/theme stores.
4. Wrote `schema.sql` including the pgvector extension and indexes.
5. Added deployment files: `Dockerfile`, `render.yaml`, `vercel.json`, env templates.

### Phase 2 — Provision free services (in this order)
1. **Neon (database) FIRST** — created project, enabled pgvector, ran `schema.sql`. *The backend can't start without a database.*
2. **Gemini API key** — created in Google AI Studio.
3. **Cloudinary** — copied cloud name, API key, API secret.

### Phase 3 — Deploy
1. Pushed all code to **GitHub**.
2. Deployed backend to **Render** via `render.yaml`; set all env vars (DB, Gemini, Cloudinary, JWT, admin seed, CORS).
3. Deployed frontend to **Vercel** with root directory = `frontend` and `VITE_API_URL` pointing at Render.
4. Set `CORS_ALLOWED_ORIGINS` on Render to the Vercel URL.
5. Verified: `/actuator/health` returns UP → registered a user → uploaded a doc → chatted.

---

## 9. Free Services We Used

The entire stack runs on free tiers — **$0 to operate**.

| Service | Role | Free tier (approx.) | Limitation |
|---------|------|---------------------|------------|
| **Neon** | PostgreSQL + pgvector | ~0.5 GB storage | Compute auto-suspends when idle |
| **Render** | Backend host (Docker) | 512 MB RAM, 1 service | Sleeps after 15 min idle; ~30–60s cold start |
| **Vercel** | Frontend host | 100 GB bandwidth/mo | Hobby tier is non-commercial |
| **Cloudinary** | File storage + CDN | 25 GB storage / 25 GB bw | Soft limits on transformations |
| **Gemini API** | Embeddings + chat | ~15 req/min, ~1,500/day | Per-model free quota; can be 0 for some models |
| **GitHub** | Source control + CI trigger | Unlimited public repos | Build minutes limited on private |

**Insight:** free tiers force good engineering — JVM heap capped (~450 MB) to fit Render's 512 MB, pgvector index sized for the free tier, embeddings reduced to 768 dims to stay within Postgres index limits.

---

## 10. Errors We Faced & How We Solved Them

> This is gold in an interview — it proves real debugging ability. Each entry: **symptom → root cause → fix**.

### 10.1 Maven build failed — Cloudinary dependency not found
- **Symptom:** Render build error — could not resolve `com.cloudinary:cloudinary-http5:1.39.0`.
- **Root cause:** `cloudinary-http5` only exists at v2.x; the 1.39.0 release is published under `cloudinary-http44`.
- **Fix:** Changed `artifactId` from `cloudinary-http5` to `cloudinary-http44` (same API, no other change).

### 10.2 App crashed on startup — "detached entity passed to persist: Role"
- **Symptom:** Backend started, connected to DB, then failed creating the admin user.
- **Root cause:** The `User` entity cascaded `PERSIST` onto its roles, which already existed (seeded by `schema.sql`), so Hibernate tried to re-insert existing rows.
- **Fix:** Removed the cascade from the `User`→`Role` many-to-many. Attaching a user just writes join-table rows using existing role IDs.

### 10.3 Vercel showed "404: NOT_FOUND"
- **Symptom:** The deployed frontend URL returned Vercel's own 404 page.
- **Root cause:** The project's **Root Directory** was the repo root, where there's no `package.json`, so Vercel built nothing.
- **Fix:** Set **Root Directory = `frontend`** in Vercel settings, redeployed.

### 10.4 Frontend build failed — TypeScript type errors
- **Symptom:** `Cannot find module 'node:path'`, `Cannot find name '__dirname'`, `Property 'env' does not exist on ImportMeta`.
- **Root cause:** Missing Node type definitions; Vite client types not referenced.
- **Fix:** Added `@types/node` to devDependencies and created `src/vite-env.d.ts` with a `vite/client` reference + `ImportMetaEnv` interface.

### 10.5 Could not log in
- **Symptom:** The Sign in button hung; no user logged in.
- **Root cause:** The account was never registered (can't log into a nonexistent account). Also reinforced that `VITE_API_URL` must be baked in at build time and CORS must be set.
- **Fix:** Registered the account first; confirmed `VITE_API_URL` and `CORS_ALLOWED_ORIGINS`.

### 10.6 Embedding failed — "404 model text-embedding-004 not found"
- **Symptom:** Upload reached the embedding step then failed (status FAILED).
- **Root cause:** Google **retired** `text-embedding-004` for the v1beta `embedContent` endpoint.
- **Fix:** Switched the embedding model to `gemini-embedding-001`. Because it defaults to 3072 dims, added `outputDimensionality = 768` to the request to match the `vector(768)` column and stay under pgvector's index limit.

### 10.7 DB insert failed — "column embedding is of type vector but expression is character varying"
- **Symptom:** Embedding succeeded, but storing the chunk failed with a Postgres type error.
- **Root cause:** Hibernate bound the vector as a plain string; Postgres won't implicitly cast text → `vector`.
- **Fix:** Added `@ColumnTransformer(write = "CAST(? AS vector)")` to the embedding field so every insert wraps the value: `CAST('[...]' AS vector)`.

### 10.8 Chat failed — "429 quota exceeded (limit: 0)" for gemini-2.0-flash
- **Symptom:** First chat request returned 429 with `limit: 0`, before any real usage.
- **Root cause:** `limit: 0` means the API key had **no free-tier allowance** for that specific chat model — not that quota was used up.
- **Fix:** Switched to a chat model with free quota (e.g. `gemini-2.5-flash`) and/or generated a fresh API key in a new AI Studio project with free-tier access.

### 10.9 Answer said "I could not find that information"
- **Symptom:** A vague question ("tell me about my doc") returned a refusal even though chunks were retrieved.
- **Root cause:** Not a bug — the system prompt intentionally refuses unless the question maps to retrieved content; vague questions match weakly.
- **Fix / lesson:** Ask specific questions; optionally relax the prompt to summarize retrieved chunks for broad questions.

### Debugging lessons to state out loud
- Read the **actual error** and stack trace **bottom-up** — the root cause is usually the last `Caused by`.
- **Logs are the source of truth:** the exact HTTP status (404 vs 429) distinguished model-not-found from quota.
- **Cloud config** (env vars, root directory, CORS) is as much part of the system as the code.
- **Build-time vs runtime:** Vite bakes env vars at build → changing them needs a redeploy.

---

## 11. How We Would Scale It (Interview Answer)

If asked "how do you scale to thousands of users and millions of documents?", answer by layer.

### Application / compute
- Backend is **stateless (JWT)** → run multiple instances behind a load balancer.
- Move ingestion (extract/chunk/embed) to an **async queue** (RabbitMQ / SQS + workers). Upload returns immediately; status updates as processing completes.
- Add **Redis** caching for sessions, frequent queries, and repeated embeddings.

### Database & vectors
- Managed Postgres with **read replicas**; send searches to replicas.
- Upgrade the pgvector index to **HNSW** for faster approximate search; tune parameters.
- **Partition/shard** `document_chunks` by tenant; archive cold data.
- Move to a dedicated vector DB (Pinecone, Qdrant, Milvus) **only** when Postgres is truly the bottleneck.

### AI layer
- **Batch** embedding requests; add **retry with backoff** and rate limiting.
- **Cache** embeddings and answers.
- Add a **reranking** step after vector search for better top-K precision.
- **Stream** chat responses (SSE) for better perceived latency.

### Delivery & reliability
- CDN for frontend (Vercel) and files (Cloudinary).
- **Observability:** structured logs, metrics (Prometheus/Grafana), tracing, alerting.
- **CI/CD** with automated tests and staging environments.
- **Autoscaling** on CPU / queue depth.

---

## 12. Future Functionality To Add

Honest gaps in the current app — knowing what's missing shows maturity.

### Currently missing / could improve
- Email verification and **password reset** (forgot-password flow).
- **Refresh tokens** + token revocation/blacklist (currently one JWT until expiry).
- **Streaming** chat responses.
- **OCR** for scanned/image PDFs.
- Support more file types: **PPTX, XLSX, HTML, URLs/web pages**.
- **Folders/collections** and tagging of documents.
- **Sharing** documents/chats; team workspaces (multi-tenant).
- **Re-index** a document without re-uploading.
- **Automated tests** (unit/integration/e2e) and a CI pipeline.
- **Rate limiting** and abuse protection.

---

## 13. Going to Production — What To Take Care Of

### Security
- Store secrets in a **secrets manager** (AWS Secrets Manager, Vault) — never in plain env files/repo.
- **Rotate** JWT secret and API keys; least-privilege key restrictions.
- Add **refresh tokens**, short-lived access tokens, logout/revocation.
- Enforce **HTTPS**, strict **CORS**, security headers (CSP, HSTS), input sanitization.
- **Rate limiting**, WAF, brute-force/lockout protection on auth.
- Encrypt data at rest and in transit; scan dependencies (Snyk/Dependabot).

### Reliability & performance
- **Always-on** paid instances (no cold starts) with autoscaling and health checks.
- Managed Postgres with **automated backups**, PITR, read replicas.
- Background **job queue** for ingestion; idempotent, retryable workers.
- Redis cache; CDN for assets/files.
- Full **observability**: centralized logs, metrics, tracing, dashboards, on-call, SLOs.

### Data & AI cost control
- Monitor and **cap LLM/embedding spend**; budgets and alerts; cache aggressively.
- Paid Gemini tier (higher quotas) or a fallback model; track cost per request.
- Data **retention/deletion** policies; per-tenant isolation.

### Compliance & operations
- **GDPR/privacy:** data export and deletion, consent, audit logs.
- For sensitive data: SOC 2 / ISO 27001 considerations, DPAs with vendors.
- **Infrastructure-as-code** (Terraform), staging env, blue-green/canary deploys.
- Runbooks, incident response, **restore-tested** backups.

---

## 14. Best Paid Services & Pricing (Cheapest Path)

> Prices are approximate and change over time — always check the vendor. Goal: lowest cost that removes the free-tier pain (cold starts, idle suspends, low quotas).

### Cheapest realistic production stack

| Layer | Free now | Cheapest paid upgrade | Approx price |
|-------|----------|----------------------|--------------|
| **Backend host** | Render free | Render **Starter** (always-on, no sleep) | ~**$7/mo** per service |
| **Database** | Neon free | Neon **Launch** (more storage, no idle suspend) | ~**$19/mo** |
| **Frontend** | Vercel Hobby | Vercel **Pro** (commercial use, more bandwidth) | ~**$20/mo** |
| **File storage** | Cloudinary free | **AWS S3 + CloudFront** (pay-as-you-go) | ~**$1–5/mo** at small scale |
| **LLM / embeddings** | Gemini free | **Gemini API pay-as-you-go** | **cents per 1M tokens** (see below) |
| **Cache/Queue (optional)** | none | **Upstash Redis** (serverless, free→pay-as-you-go) | ~**$0–10/mo** |

**Rock-bottom monthly:** ~**$7–10** if you only pay for an always-on backend (Render Starter) + Gemini pay-as-you-go, and keep Neon/Vercel/Cloudinary on free tiers. A comfortable "real" setup is ~**$45–60/mo**.

### Gemini API pricing (pay-as-you-go, approximate)
- **Flash chat models** are extremely cheap — on the order of **cents per 1M input tokens** and a bit more per 1M output tokens.
- **Embeddings** are cheaper still per 1M tokens.
- Because we send only top-5 chunks and cap output, **per-question cost is a tiny fraction of a cent.** Thousands of questions still cost very little.
- Always confirm current rates at the official Gemini API pricing page.

### Cheaper alternatives to consider
- **Database:** Supabase (Postgres + pgvector, generous free tier; cheap paid).
- **Backend host:** Railway, Fly.io (usage-based, can be very cheap).
- **Vector DB (if needed):** Qdrant Cloud free tier, or self-hosted on a small VPS.
- **LLM (alternatives):** Groq (fast/cheap), OpenAI `gpt-4o-mini`, Mistral — keep your `GeminiService` behind an interface so you can swap providers.

**Money-saving tactics:** cache repeated answers, cap `maxOutputTokens`, lower `topK`, batch embeddings, and use the cheapest capable model. These keep AI spend near zero even in production.

---

## 15. More Features We Could Add

### Product features
- Highlight the **exact source sentence** an answer came from.
- **Export** a chat or answer to PDF/Markdown.
- **Usage analytics** per user (questions asked, docs used).
- **Multi-language** support and translation.
- **Voice input / text-to-speech** for answers.
- Per-user **configurable** model and retrieval settings (top-K, temperature).
- **"Chat with multiple documents at once"** / per-collection scoping.
- **Suggested questions** generated from each uploaded document.
- **Feedback buttons** (thumbs up/down) to improve retrieval over time.
- **Shareable read-only chat links.**

### Platform features
- Team/organization accounts with shared knowledge bases.
- Billing/subscription tiers (Stripe).
- Audit log + admin moderation tools.
- Webhooks / public API for integrations (Slack, Teams).

---

## 16. How To Explain This Project In An Interview

A clear narrative beats a feature list.

### The 30-second pitch
> "KnowledgePulse AI is a full-stack RAG application I built end to end. Users upload their own documents and chat with them — and every answer is grounded in their content with citations, so it doesn't hallucinate. The frontend is React with TypeScript, the backend is Java with Spring Boot, and it uses PostgreSQL with the pgvector extension to store embeddings and do semantic search. The AI layer is Google Gemini for both embeddings and chat. It's fully deployed on free cloud services."

### The 2-minute version (tell it as a flow)
- **Problem:** LLMs don't know your private documents and they hallucinate. I wanted trustworthy, cited answers from my own files.
- **Solution:** a Retrieval-Augmented Generation pipeline.
- **Ingestion:** extract text → split into overlapping chunks → embed each into a 768-dim vector → store in Postgres via pgvector.
- **Querying:** embed the question → cosine-similarity search for the most relevant chunks → send them + a strict instruction to Gemini so it answers only from that context with citations.
- **Engineering:** stateless JWT auth with roles, every query scoped to the owning user, Dockerized Spring Boot on Render, Vite/React on Vercel, Neon for the DB.

### Talk about trade-offs (impresses senior interviewers)
- **pgvector over a dedicated vector DB** → one datastore, simpler ops, right for the scale; I know when I'd switch.
- **RAG over fine-tuning** → cheaper, updates instantly, gives citations.
- **768-dim embeddings** → fits Postgres index limits and storage.
- **JWT** → stateless, horizontally scalable auth.

### Tell a debugging story
Pick **one** error from §10 and narrate it: the symptom, how you read the logs, the root cause, the one-line fix. The **pgvector cast error (10.7)** and **retired embedding model (10.6)** are great — they show you understand both the database and the AI layer.

### Questions you should be ready for
| Likely question | Your angle |
|-----------------|-----------|
| What is RAG? | Retrieve relevant context, then generate grounded answers with citations |
| Why pgvector? | One datastore, cosine search in SQL, simpler ops; switch to a vector DB only at scale |
| How do you stop hallucination? | Strict prompt + answer only from retrieved chunks + citations; refuse if not found |
| How is it secured? | JWT, BCrypt, role-based access, per-user data scoping, CORS, input/file validation |
| How do tokens work / cost? | Embed once at upload; per question ≈ 1.5–2.5k input tokens (top-5 chunks) + capped output |
| How would you scale it? | Async ingestion queue, stateless app + LB, read replicas, HNSW index, caching |
| What would you improve? | Refresh tokens, streaming, OCR, tests/CI, more file types |
| Hardest bug? | Tell a §10 story end to end |

### Closing line
> "I built and deployed the whole thing myself — frontend, backend, database, AI integration, and cloud deployment — and I debugged real production issues along the way. I understand not just how it works, but the trade-offs I made and how I'd take it to production scale."

---

## 17. Quick Cheat Sheet

| Number | Meaning |
|--------|---------|
| **768** | Embedding dimensions per chunk |
| **~900 / 150** | Chunk size / overlap (characters) |
| **Top-5** | Chunks retrieved per question (configurable) |
| **6 tables** | users, roles, documents, document_chunks, chat_sessions, chat_messages |
| **JWT 24h** | Default access-token lifetime |
| **`<=>`** | pgvector cosine distance operator used for search |
| **~1.5–2.5k** | Approx input tokens per question (system + top-5 chunks + question) |
| **≤1024** | Max output tokens per answer |
| **$0** | Current monthly cost (all free tiers) |
| **~$7–10/mo** | Cheapest always-on production path |

---

*End of guide — good luck in the interview!* 🚀
