# KnowledgePulse AI

Enterprise-grade AI Knowledge Assistant powered by Spring Boot, React, PostgreSQL + pgvector, Gemini AI, and Retrieval Augmented Generation (RAG).

Upload your documents (PDF, DOCX, TXT) and chat with them. The system extracts text, generates semantic embeddings, stores them in PostgreSQL with the `pgvector` extension, retrieves relevant chunks for every question, and asks Google Gemini to produce a grounded answer with citations.

---

## Architecture

```
┌─────────────────┐         ┌─────────────────────┐         ┌──────────────────┐
│  React + Vite   │  HTTPS  │   Spring Boot 3.5   │  JPA    │  Neon Postgres   │
│  (Vercel)       │────────▶│   (Render)          │────────▶│  + pgvector      │
└─────────────────┘         └─────────────────────┘         └──────────────────┘
                                      │  │
                          ┌───────────┘  └───────────┐
                          ▼                          ▼
                   ┌──────────────┐          ┌──────────────┐
                   │  Gemini API  │          │  Cloudinary  │
                   │  (Embeddings │          │  (Original   │
                   │   + Chat)    │          │   Files)     │
                   └──────────────┘          └──────────────┘
```

### Stack

| Layer            | Technology                                                    |
| ---------------- | ------------------------------------------------------------- |
| Frontend         | React 18, Vite, TypeScript, Tailwind CSS, React Query, Router |
| Backend          | Java 21, Spring Boot 3.5, Spring Security, Spring AI, JPA     |
| Database         | PostgreSQL 16 + `pgvector` (Neon Free)                        |
| AI / Embeddings  | Google Gemini (`gemini-1.5-flash` + `text-embedding-004`)     |
| Object storage   | Cloudinary (Free)                                             |
| Auth             | JWT (HS256) + Spring Security                                 |
| Deployment       | Vercel (frontend) + Render (backend)                          |

---

## Repository Layout

```
.
├── backend/                Spring Boot service
│   ├── pom.xml
│   └── src/main/java/com/knowledgepulse/
├── frontend/               React + Vite app
│   ├── package.json
│   └── src/
├── database/               SQL schema & seed scripts
├── docs/                   Setup guides (Neon, Cloudinary, Gemini, Vercel, Render)
├── render.yaml             Render IaC manifest
└── README.md
```

---

## Quick Start (Zero-Local-Build Deployment)

You do **not** need to install Java, Node, Docker, or run any build commands locally. Everything builds in the cloud.

### 1. Provision free services

Follow the guides in [`docs/`](./docs):

1. [`docs/NEON_SETUP.md`](./docs/NEON_SETUP.md) — create a free Postgres database, enable `pgvector`, run the schema.
2. [`docs/GEMINI_SETUP.md`](./docs/GEMINI_SETUP.md) — create a free Gemini API key.
3. [`docs/CLOUDINARY_SETUP.md`](./docs/CLOUDINARY_SETUP.md) — create a free Cloudinary account.

### 2. Push this repo to GitHub

Upload the project to a new GitHub repository (web upload is fine — no git client needed).

### 3. Deploy the backend to Render

See [`docs/RENDER_DEPLOY.md`](./docs/RENDER_DEPLOY.md). Render reads `render.yaml`, builds the Spring Boot service with Maven, and runs the jar on a free instance.

Required environment variables on Render:

| Variable                  | Example                                                          |
| ------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`            | `jdbc:postgresql://ep-xxx.neon.tech/db?sslmode=require`          |
| `DATABASE_USERNAME`       | `neon_user`                                                      |
| `DATABASE_PASSWORD`       | `********`                                                       |
| `JWT_SECRET`              | 64+ character random string                                      |
| `JWT_EXPIRATION_MS`       | `86400000` (24h)                                                 |
| `GEMINI_API_KEY`          | `AIza...`                                                        |
| `GEMINI_CHAT_MODEL`       | `gemini-1.5-flash`                                               |
| `GEMINI_EMBEDDING_MODEL`  | `text-embedding-004`                                             |
| `CLOUDINARY_CLOUD_NAME`   | `your-cloud`                                                     |
| `CLOUDINARY_API_KEY`      | `123456789012345`                                                |
| `CLOUDINARY_API_SECRET`   | `********`                                                       |
| `CORS_ALLOWED_ORIGINS`    | `https://your-frontend.vercel.app`                               |
| `ADMIN_EMAIL`             | `admin@example.com`                                              |
| `ADMIN_PASSWORD`          | `ChangeMe!123`                                                   |

### 4. Deploy the frontend to Vercel

See [`docs/VERCEL_DEPLOY.md`](./docs/VERCEL_DEPLOY.md). Set the project's **root directory** to `frontend/` and add:

| Variable          | Value                                       |
| ----------------- | ------------------------------------------- |
| `VITE_API_URL`    | `https://your-backend.onrender.com/api/v1`  |

---

## Core Features

- JWT authentication with role-based access (`USER`, `ADMIN`)
- Upload PDF / DOCX / TXT documents to Cloudinary
- Text extraction (Apache PDFBox + Apache POI)
- Chunking with overlap, token-aware
- Embedding generation via Gemini `text-embedding-004` (768 dims)
- Vector similarity search using `pgvector` (`<=>` cosine distance)
- Chat sessions with history, grounded answers, and source citations
- Admin dashboard: users, documents, system metrics
- Dark mode, responsive, modern SaaS UI

---

## API

See [`docs/API.md`](./docs/API.md) for the full REST surface.

---

## License

MIT
