# Database

PostgreSQL 16 schema with the `pgvector` extension.

## Apply the schema on Neon

1. Open the SQL editor in your Neon project.
2. Paste the contents of [`schema.sql`](./schema.sql).
3. Click **Run**.

`pgvector` is pre-installed in Neon's image — `CREATE EXTENSION vector` enables it on your database.

The embedding column is `vector(768)`. That matches Gemini's `text-embedding-004` model. If you switch the model, update the column dimension *and* the value of `knowledgepulse.gemini.embeddingDimensions` in `application.yml`.
