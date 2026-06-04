# Render Deployment - Backend

Render builds and runs the Spring Boot backend on its free tier. The repo contains a [`render.yaml`](../render.yaml) blueprint and a [`backend/Dockerfile`](../backend/Dockerfile), so deployment is fully declarative.

## 1. Push to GitHub

Upload the entire project to a new GitHub repository. (Either via the GitHub web UI or any Git client.)

## 2. Create the Render service

1. Sign up at [render.com](https://render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repo and pick the one you just pushed.
4. Render reads `render.yaml`. Confirm the service name (`knowledgepulse-backend`).
5. Hit **Apply** - the first build takes 4-6 minutes.

The Dockerfile uses a Maven build stage and Eclipse Temurin 21 JRE for the runtime. The image is tuned to fit inside the Render free instance's 512 MB RAM.

## 3. Configure environment variables

In the Render dashboard for `knowledgepulse-backend`, open **Environment** and add:

| Variable                  | Where to get it                                          |
| ------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`            | Neon - JDBC connection string                            |
| `DATABASE_USERNAME`       | Neon                                                     |
| `DATABASE_PASSWORD`       | Neon                                                     |
| `GEMINI_API_KEY`          | Google AI Studio                                         |
| `GEMINI_CHAT_MODEL`       | `gemini-1.5-flash` (default in render.yaml)              |
| `GEMINI_EMBEDDING_MODEL`  | `text-embedding-004` (default in render.yaml)            |
| `CLOUDINARY_CLOUD_NAME`   | Cloudinary dashboard                                     |
| `CLOUDINARY_API_KEY`      | Cloudinary dashboard                                     |
| `CLOUDINARY_API_SECRET`   | Cloudinary dashboard                                     |
| `CORS_ALLOWED_ORIGINS`    | Your Vercel URL, e.g. `https://kp-ai.vercel.app`         |
| `ADMIN_EMAIL`             | The seed admin account email                             |
| `ADMIN_PASSWORD`          | The seed admin account password (>=8 chars)              |

`JWT_SECRET` is generated automatically by Render (`generateValue: true` in `render.yaml`).

> **Tip:** for `CORS_ALLOWED_ORIGINS` you can pass a comma-separated list to allow both the production Vercel URL and preview deployments.

## 4. Verify the deployment

1. Once the build succeeds, hit `https://<your-service>.onrender.com/api/v1/actuator/health` - it should return `{"status":"UP"}`.
2. Swagger UI is at `https://<your-service>.onrender.com/api/v1/swagger-ui.html`.
3. The first login as the admin uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`. The `AuthService.bootstrap()` method seeds the row on startup.

## 5. Free-tier behavior

Render's free instance sleeps after 15 minutes of inactivity. The first request after a sleep takes ~30 seconds to wake. To keep it warm:

- Use a free uptime monitor (UptimeRobot, BetterStack) to ping `/api/v1/actuator/health` every 10 minutes.

## 6. Re-deploy

Render auto-deploys whenever you push to `main`. Trigger manual deploys with the **Manual Deploy** button.
