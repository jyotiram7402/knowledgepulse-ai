# Vercel Deployment - Frontend

The React + Vite app deploys to Vercel's free Hobby tier in one click.

## 1. Connect the repo

1. Sign up at [vercel.com](https://vercel.com) (use **Continue with GitHub**).
2. Click **Add New** -> **Project** -> import your GitHub repo.
3. On the project setup screen:
   - **Framework Preset**: Vite (auto-detected).
   - **Root Directory**: click **Edit** and set to `frontend`.
   - **Build Command**: leave the default `npm run build`.
   - **Output Directory**: leave the default `dist`.

## 2. Environment variables

Add a single variable:

| Variable        | Value                                              |
| --------------- | -------------------------------------------------- |
| `VITE_API_URL`  | `https://<your-backend>.onrender.com/api/v1`       |

Vercel injects this at build time. After the first deploy, copy the Vercel URL (`https://<name>.vercel.app`) and add it to the backend's `CORS_ALLOWED_ORIGINS` on Render so the API will accept calls from it.

## 3. Build and deploy

Click **Deploy**. The first build takes ~2 minutes. Subsequent pushes to `main` redeploy automatically.

The repo already contains [`frontend/vercel.json`](../frontend/vercel.json) which:

- declares the framework
- adds a SPA rewrite to serve `index.html` for any client-side route
- sets sensible security headers

## 4. Custom domain (optional)

In **Settings -> Domains** add your domain. Vercel auto-issues a TLS certificate via Let's Encrypt.

## 5. Verifying

1. Open `https://<your-vercel-url>` - you should see the landing page.
2. Click **Get started**, create an account.
3. Upload a small PDF, then go to **Chat** and ask a question. Each answer shows expandable source citations.
