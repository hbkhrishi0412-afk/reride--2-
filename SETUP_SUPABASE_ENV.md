# Supabase environment setup

Do **not** paste real Supabase keys into this repository or any committed file. Use **local** env files and your host’s secret store (Vercel, GitHub Actions secrets, etc.).

## Local web / Vite

1. Copy **`.env.example`** to **`.env.local`** (preferred) or run `npm run env:copy` to create `.env` from `.env.example` if it does not exist.
   - Do **not** use the stub file `env.example` — it only points at `.env.example`.
2. From [Supabase Dashboard](https://supabase.com/dashboard) → **Project Settings** → **API**:
   - **Project URL** → `VITE_SUPABASE_URL` (and optionally `SUPABASE_URL` for server tooling).
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` (client-safe).
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` **only** in server-side / CI secrets — never in the browser bundle or mobile app assets.

3. Restart the dev server after changing env vars.

## Android / Capacitor builds

Use the same `VITE_SUPABASE_*` values when running `npm run android` / `npm run android:bundle`. Missing keys produce a white screen or dead auth inside the WebView.

Open **only** the `android/` folder in Android Studio — not the repo root (there is no Android project at the root).

## Production (example: Vercel)

Set the same variables in the project **Environment Variables** UI for each environment (Production / Preview). Use **secrets** for `SUPABASE_SERVICE_ROLE_KEY`.

## Rotation

If a service_role or anon key was ever committed or exposed:

1. In Supabase Dashboard → **Project Settings** → **API**, rotate the affected key.
2. Update all deployment secrets and local `.env.local`.
3. Optionally rewrite git history to remove old blobs (e.g. `git filter-repo`); alerts may persist until history is cleaned.

## Further reading

- `.env.example` — canonical variable names and short comments.
- `ANDROID_BUILD.md` — Android Studio / Capacitor build steps.
- `docs/SUPABASE_MOBILE.md` — mobile-specific notes.
