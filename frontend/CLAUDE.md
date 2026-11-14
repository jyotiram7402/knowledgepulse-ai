# frontend: React + Vite single-page app (port 5173)

- `npm run dev`, `npm run build` (`tsc -b` then `vite build` into `dist/`), `npm run preview`. No lint or test setup.
- Env: `VITE_API_URL` in `frontend/.env`, the backend base URL including `/api/v1`. It falls back to `/api/v1` and is baked in at build time.
- `src/api/client.ts`: axios with a 90 s timeout. It sends the JWT stored under localStorage `kp-token`; a 401 clears it and redirects to `/login`; 403 and 5xx show toasts.
- `src/api/endpoints.ts` has one function per backend call. `src/types/index.ts` mirrors the camelCase API.
- Routes are in `src/App.tsx`. Logged-in pages sit under `/app` inside `<ProtectedRoute><Layout/>`; `/app/admin` also needs `requireAdmin`. Nav entries are in `src/components/Layout.tsx`.
- Server data uses TanStack Query (client set up in `src/main.tsx`). Zustand stores in `src/store/`: `auth` and `theme` (localStorage `kp-theme`).
- Deploy: Vercel with Root Directory `frontend`. `vercel.json` rewrites every path to `index.html` and sets security headers.
- Shared with the Java version of the product, so keep the API contract unchanged.
- Known bug: `ApiError` in `src/types/index.ts` expects `{message}`, but FastAPI sends `{detail}`.
