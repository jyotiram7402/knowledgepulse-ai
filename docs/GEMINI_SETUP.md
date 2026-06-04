# Google Gemini Setup

KnowledgePulse AI uses two Gemini models:

| Purpose       | Model                  | Free tier limits (typical)       |
| ------------- | ---------------------- | -------------------------------- |
| Chat answers  | `gemini-1.5-flash`     | 15 req/min, 1500 req/day         |
| Embeddings    | `text-embedding-004`   | 1500 req/min                     |

> Limits may change. See [ai.google.dev pricing](https://ai.google.dev/pricing).

## 1. Create an API key

1. Go to [aistudio.google.com](https://aistudio.google.com).
2. Sign in with a Google account.
3. Click **Get API key** -> **Create API key** -> pick a Google Cloud project (or let it create one).
4. Copy the key (starts with `AIza...`).

## 2. Set the environment variables on Render

| Variable                  | Value                          |
| ------------------------- | ------------------------------ |
| `GEMINI_API_KEY`          | `AIza...` (your key)            |
| `GEMINI_CHAT_MODEL`       | `gemini-1.5-flash`              |
| `GEMINI_EMBEDDING_MODEL`  | `text-embedding-004`            |

The backend uses these via [`AppProperties.Gemini`](../backend/src/main/java/com/knowledgepulse/config/AppProperties.java) and calls the REST endpoints at `https://generativelanguage.googleapis.com/v1beta`.

## 3. Embedding dimensions

`text-embedding-004` returns 768-dimensional vectors. This matches the `vector(768)` column in `document_chunks`.

If you switch to a model with a different dimension:

1. Update `knowledgepulse.gemini.embeddingDimensions` in `backend/src/main/resources/application.yml`.
2. Recreate the column on Neon:

   ```sql
   ALTER TABLE document_chunks DROP COLUMN embedding;
   ALTER TABLE document_chunks ADD COLUMN embedding vector(<new_dim>);
   DROP INDEX IF EXISTS idx_chunks_embedding_cosine;
   CREATE INDEX idx_chunks_embedding_cosine
     ON document_chunks USING ivfflat (embedding vector_cosine_ops)
     WITH (lists = 100);
   ```

3. Re-upload your documents to regenerate embeddings.
