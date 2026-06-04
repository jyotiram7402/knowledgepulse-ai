# Cloudinary Setup

Cloudinary stores the **original** uploaded files (PDF / DOCX / TXT) so users can download them later. Extracted text and embeddings live in Postgres.

The free tier includes 25 GB of storage and 25 GB monthly bandwidth, plenty for personal and small-team use.

## 1. Create a free account

1. Go to [cloudinary.com](https://cloudinary.com) and sign up.
2. After confirming your email, open the **Dashboard**.

## 2. Copy the credentials

On the dashboard you will see three values you need:

- **Cloud name** -> `CLOUDINARY_CLOUD_NAME`
- **API Key**    -> `CLOUDINARY_API_KEY`
- **API Secret** -> `CLOUDINARY_API_SECRET`

## 3. Set them on Render

Open your backend service on Render -> **Environment** -> add the three variables above.

The backend uploads files as `resource_type=raw` (since these are not images) under the folder `knowledgepulse/<userId>/<uuid>` so each user's files are isolated.

## 4. Optional: tighten access

Files are uploaded with a public URL by default (Cloudinary's free tier does not support signed URLs without code changes). The URL is unguessable thanks to the per-upload UUID. If you need stricter access, you can:

1. Add a Spring controller that signs requests via `cloudinary.url().signed(true).generate(publicId)`.
2. Replace the stored `cloudinaryUrl` with a relative path and resolve through the signed URL endpoint.

For most internal knowledge-base use cases this is unnecessary, so the default flow is wired straight to `secure_url`.
