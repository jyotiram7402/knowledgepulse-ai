-- KnowledgePulse AI - PostgreSQL schema with pgvector
-- Target: Neon Postgres 16+

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS vector;

-- ---------- ROLES ----------
CREATE TABLE IF NOT EXISTS roles (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(40) NOT NULL UNIQUE
);

INSERT INTO roles (name) VALUES ('ROLE_USER')
ON CONFLICT (name) DO NOTHING;
INSERT INTO roles (name) VALUES ('ROLE_ADMIN')
ON CONFLICT (name) DO NOTHING;

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(80)  NOT NULL,
    email       VARCHAR(160) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    enabled     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS user_roles (
    user_id  UUID   NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id  BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- ---------- DOCUMENTS ----------
CREATE TABLE IF NOT EXISTS documents (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    filename              VARCHAR(255) NOT NULL,
    content_type          VARCHAR(100) NOT NULL,
    file_size             BIGINT NOT NULL,
    cloudinary_url        VARCHAR(1000),
    cloudinary_public_id  VARCHAR(500),
    status                VARCHAR(20) NOT NULL,
    chunk_count           INTEGER NOT NULL DEFAULT 0,
    error_message         VARCHAR(1000),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_owner  ON documents (owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (status);

-- ---------- DOCUMENT CHUNKS (pgvector) ----------
CREATE TABLE IF NOT EXISTS document_chunks (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id  UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    owner_id     UUID NOT NULL REFERENCES users(id)     ON DELETE CASCADE,
    chunk_index  INTEGER NOT NULL,
    content      TEXT    NOT NULL,
    token_count  INTEGER,
    embedding    vector(768),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks (document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_owner    ON document_chunks (owner_id);

-- Approximate nearest neighbor index (cosine). 'lists' is conservative for Neon free tier.
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_cosine
    ON document_chunks USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ---------- CHAT ----------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_owner ON chat_sessions (owner_id);

CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role        VARCHAR(20) NOT NULL,
    content     TEXT NOT NULL,
    citations   TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages (session_id);

-- ---------- ANALYZE for planner ----------
ANALYZE roles;
ANALYZE users;
ANALYZE documents;
ANALYZE document_chunks;
ANALYZE chat_sessions;
ANALYZE chat_messages;
