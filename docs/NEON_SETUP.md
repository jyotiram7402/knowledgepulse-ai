# Neon PostgreSQL Setup

KnowledgePulse AI uses Neon's free serverless Postgres tier (3 GB storage, includes `pgvector`).

## 1. Create a project

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Click **New Project** -> name it `knowledgepulse`.
3. Pick a region close to your Render service (e.g. **AWS us-east-2 / Ohio** if Render is in Oregon use **us-west-2**).
4. Keep the default PostgreSQL version (16+).

## 2. Enable `pgvector` and apply the schema

1. In the project dashboard, open the **SQL Editor**.
2. Paste the contents of [`database/schema.sql`](../database/schema.sql) and click **Run**.

The script:
- enables `pgvector` and `pgcrypto`
- creates tables `users`, `roles`, `user_roles`, `documents`, `document_chunks`, `chat_sessions`, `chat_messages`
- creates an `ivfflat` index on `document_chunks.embedding` for cosine similarity

> Already migrated? Re-running the script is safe - it uses `IF NOT EXISTS` everywhere.

## 3. Grab the connection string

1. In Neon, click **Dashboard** -> **Connection Details**.
2. Choose the **JDBC** driver and copy the URL. It looks like:

   ```
   jdbc:postgresql://ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

3. Note the username and password shown.

## 4. Configure the backend

In Render's service environment variables (see [`RENDER_DEPLOY.md`](./RENDER_DEPLOY.md)) set:

| Variable            | Value                          |
| ------------------- | ------------------------------ |
| `DATABASE_URL`      | the JDBC URL from Neon          |
| `DATABASE_USERNAME` | the Neon username               |
| `DATABASE_PASSWORD` | the Neon password               |

Neon supports SNI; the JDBC driver bundled in Spring Boot is up to date and works out of the box. `sslmode=require` is mandatory on Neon and is included in the URL Neon generates.

## 5. (Optional) Bump `ivfflat` lists for larger datasets

The schema uses `lists = 100`, suitable for up to ~1M rows on the free tier. If you grow past that, recreate the index:

```sql
DROP INDEX IF EXISTS idx_chunks_embedding_cosine;
CREATE INDEX idx_chunks_embedding_cosine
  ON document_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 1000);
ANALYZE document_chunks;
```
