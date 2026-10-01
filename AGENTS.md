# AGENTS.md

## Project overview
This repo is a full-stack shop website for a Nigerian-focused boutique business. The app includes product browsing, cart management, checkout, Google login, order persistence, and order confirmation emails.

## Stack
- Frontend: React + Vite + React Router
- Backend: Node.js + Express
- Database: Supabase Postgres
- Email: Mailgun
- Auth: Google OAuth 2.0

## Important workflow notes
- Keep secrets in `.env` files and never commit real credentials.
- Use the server environment variables from `server/.env` for production or local runs.
- Frontend reads the API base URL from `VITE_API_URL` when available; otherwise it falls back to the Render deployment URL.
- The server exposes `/api/auth`, `/api/products`, and `/api/orders` and should be run on port 3001 locally.
- Branding is "Shopping" everywhere (code, docs, emails). Keep names and colors consistent.
- CORS on the backend must allow both localhost and the deployed Vercel origin; avoid trailing slashes in `CLIENT_URL`.
- The frontend is a SPA and requires `client/vercel.json` rewrites so client-side routes do not 404 on Vercel.

## Core behavior to preserve
- Sign in via Google and keep the user in `localStorage` so the session survives browser reloads.
- Fetch orders by the customer email and display them in the My Orders page.
- On successful checkout, create the order in Supabase and send a confirmation email via Mailgun without failing the order if the email service is temporarily unavailable.
- Redirect successful Google logins to `/auth/callback` and then to `/` after storing user data locally.

## Local run commands
```bash
cd server && npm install && npm run dev
cd client && npm install && npm run dev
```

## Production checklist
- Set `CLIENT_URL`, `GOOGLE_REDIRECT_URI`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, and `MAILGUN_FROM_EMAIL` on the deployed backend.
- Add the deployed callback URL to the Google OAuth client configuration.
- Update Supabase CORS and security settings if the frontend is deployed on a different domain.

## Repository conventions
- Keep the app and docs aligned with live infrastructure.
- Prefer small, focused changes and verify with a build or local runtime check before completing work.
- Update this file whenever the architecture or deployment process changes.
