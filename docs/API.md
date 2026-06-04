# API Reference

All endpoints are served under `/api/v1`. Endpoints other than `auth/*`, `actuator/*`, and swagger require a `Authorization: Bearer <jwt>` header.

Interactive docs (Swagger UI) live at `/api/v1/swagger-ui.html`.

## Auth

| Method | Path                | Body                                            | Returns                    |
| ------ | ------------------- | ----------------------------------------------- | -------------------------- |
| POST   | `/auth/register`    | `{ name, email, password }`                     | `{ token, user }`          |
| POST   | `/auth/login`       | `{ email, password }`                           | `{ token, user }`          |

## Users

| Method | Path           | Body                                                       | Returns      |
| ------ | -------------- | ---------------------------------------------------------- | ------------ |
| GET    | `/users/me`    | -                                                          | `User`       |
| PUT    | `/users/me`    | `{ name?, currentPassword?, newPassword? }`                | `User`       |

## Documents

| Method | Path                          | Body / Params                                  | Returns                       |
| ------ | ----------------------------- | ---------------------------------------------- | ----------------------------- |
| POST   | `/documents`                  | multipart `file`                               | `DocumentResponse`            |
| GET    | `/documents?page=&size=`      | -                                              | `Page<DocumentResponse>`      |
| GET    | `/documents/search?q=`        | -                                              | `DocumentResponse[]`          |
| GET    | `/documents/{id}`             | -                                              | `DocumentResponse`            |
| DELETE | `/documents/{id}`             | -                                              | `204`                         |

`DocumentResponse` fields: `id, filename, contentType, fileSize, url, status, chunkCount, errorMessage, createdAt`. `status` is one of `PENDING | PROCESSING | READY | FAILED`.

## Chat

| Method | Path                                          | Body                | Returns                  |
| ------ | --------------------------------------------- | ------------------- | ------------------------ |
| GET    | `/chat/sessions`                              | -                   | `ChatSession[]`          |
| POST   | `/chat/sessions`                              | `{ title? }`        | `ChatSession`            |
| GET    | `/chat/sessions/{id}/messages`                | -                   | `ChatMessage[]`          |
| POST   | `/chat/sessions/{id}/messages`                | `{ content }`       | `ChatMessage`            |
| DELETE | `/chat/sessions/{id}`                         | -                   | `204`                    |

`ChatMessage.role` is `USER | ASSISTANT | SYSTEM`. Assistant messages carry a `citations` array of `{ marker, chunkId, documentId, chunkIndex, similarity, snippet }`.

## Admin (role `ROLE_ADMIN` only)

| Method | Path                   | Returns                   |
| ------ | ---------------------- | ------------------------- |
| GET    | `/admin/stats`         | `AdminStats`              |
| GET    | `/admin/users`         | `User[]`                  |
| GET    | `/admin/documents`     | `AdminDocument[]`         |

`AdminStats`: `{ totalUsers, activeUsers, totalDocuments, totalChunks, totalSessions, totalMessages }`.

## Error format

All failures return JSON shaped like:

```json
{
  "timestamp": "2026-06-02T14:25:01Z",
  "status": 400,
  "error": "Bad Request",
  "message": "File exceeds 20MB limit",
  "path": "/api/v1/documents"
}
```

## RAG pipeline summary

1. `POST /documents` -> file uploaded -> Cloudinary stores the original.
2. Backend extracts text (PDFBox / POI / UTF-8) and chunks it (default size 900 chars, overlap 150).
3. Each chunk is embedded via `text-embedding-004` (768 dims).
4. Vectors are stored in `document_chunks.embedding` (pgvector).
5. `POST /chat/sessions/{id}/messages` -> the user's question is embedded.
6. Top-K nearest chunks (cosine distance) for the **current user only** are retrieved.
7. Gemini-1.5-Flash is called with the chunks as numbered context plus the chat history.
8. The grounded answer is returned with citation pointers `[1]`, `[2]`, ...
