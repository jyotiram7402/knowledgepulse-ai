# Architecture

## High-level

```
                                                  Google
   Browser                                        Gemini API
   (Vercel)                                       (chat + embeddings)
       |                                              ^
       |  HTTPS                                       |  HTTPS
       v                                              |
+----------------+        JPA / JDBC          +----------------+
| Spring Boot    | -------------------------> | Neon Postgres  |
| (Render)       |                            | + pgvector     |
+----------------+ <-------------------------- +----------------+
   |   ^
   |   | Cloudinary HTTP API
   v
 Cloudinary (original files)
```

## Backend layers

```
controller/   Thin HTTP layer. Validates DTOs. Calls services.
service/      Domain logic. AuthService, DocumentService, RagService, ChatService, AdminService,
              CloudinaryService, GeminiService, ChunkingService, TextExtractionService.
repository/   Spring Data JPA. Native vector query lives in DocumentChunkRepository.
entity/       JPA entities mapped to schema.sql tables.
security/     JWT filter, UserDetailsService, JwtAuthenticationEntryPoint, SecurityUtils.
config/       SecurityConfig, AppProperties, CloudinaryConfig, WebClientConfig, OpenApiConfig.
dto/          Java records for request / response payloads.
exception/    ApiException hierarchy + GlobalExceptionHandler.
```

## RAG flow

1. **Ingestion** (`DocumentService.upload`)
   - Validate file (max 20 MB, allowed extensions).
   - Extract text via `TextExtractionService`:
     - PDF: Apache PDFBox 3.
     - DOCX: Apache POI XWPF.
     - TXT/MD: UTF-8 decoder.
   - Upload original to Cloudinary (`CloudinaryService`, resource_type=raw).
   - `ChunkingService` produces 900-char windows with 150-char overlap, breaking on sentence boundaries when possible.
   - For each chunk, `GeminiService.embed(...)` returns a 768-float vector.
   - Persist `DocumentChunk` rows with `embedding` cast into `vector(768)`.

2. **Retrieval** (`RagService.answer`)
   - Embed the user's question.
   - Native query on `document_chunks` using `embedding <=> :query` (cosine distance) filtered by `owner_id`.
   - Top-K (default 5) chunks become the "context snippets" block of the LLM prompt.

3. **Generation**
   - System instruction forces grounded answers and disallows fabricated citations.
   - Chat history is sent as Gemini `contents` turns (`role: user|model`).
   - The response text is saved as an `ASSISTANT` message, with citations JSON.

## Security

- JWT (HS256) signed with `JWT_SECRET`, validated by `JwtAuthenticationFilter`.
- BCrypt password hashing.
- Method security (`@EnableMethodSecurity`) + path-based rules (`/admin/**` -> `ROLE_ADMIN`).
- CORS limited to `CORS_ALLOWED_ORIGINS`.
- File-type and size validation on upload.
- Owner-scoped queries everywhere - users can never see another user's data.

## Free-tier sizing

| Service     | Free quota                           | This app's usage          |
| ----------- | ------------------------------------ | ------------------------- |
| Neon        | 3 GB storage                         | Plenty for ~100k chunks   |
| Render      | 512 MB RAM, sleeps after 15min       | Tuned JVM heap = 450 MB   |
| Vercel      | 100 GB bandwidth / month             | Static SPA                |
| Cloudinary  | 25 GB storage, 25 GB bandwidth       | Original uploads only     |
| Gemini      | 1500 free chat req / day             | OK for personal / demo    |
