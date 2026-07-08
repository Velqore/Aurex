# 🚀 Deploy Aurex (friends test) — Quick Start

This is the **authoritative** deploy guide (supersedes the older `DEPLOYMENT.md`).
Aurex now runs a custom server (`server.js`) that serves Next.js **and** the
real-time chat (Socket.io) on one port. That means it must run on a host that
keeps a **long-lived container** and supports **WebSockets**:

> ✅ Railway · Render · Koyeb · Fly.io · a VPS  
> ❌ Vercel / Netlify (serverless — cannot hold the websocket)

The repo includes a **`Dockerfile`**, so most hosts deploy it with zero build
config. Total time: ~15 minutes.

---

## Step 0 — Merge the fixes into `main`

All the work lives on the `fix/build-nextjs16` branch. Merge it first so `main`
is deployable:

👉 https://github.com/Velqore/Aurex/pull/new/fix/build-nextjs16

(Open the PR → **Merge**. Then deploy `main`.)

---

## Step 1 — Get a free PostgreSQL database

You can skip this and the app still runs (data just resets on redeploy), but a
DB makes logins/users persist and is recommended.

**Option A — Neon (works with any host):**
1. Go to https://neon.tech → sign up → **Create project**.
2. Copy the **connection string** (looks like
   `postgresql://user:pass@ep-xxxx.aws.neon.tech/neondb?sslmode=require`).
3. Save it — that's your `DATABASE_URL`.

**Option B — Railway's built-in Postgres:** if you deploy on Railway, just add a
Postgres plugin (below) and reference its `DATABASE_URL`. No Neon needed.

> The database tables are created **automatically** on first run — no migration
> step required.

---

## Step 2 — Deploy on Railway (recommended, easiest)

1. Go to https://railway.app → **Login with GitHub**.
2. **New Project → Deploy from GitHub repo → `Velqore/Aurex`** (branch `main`).
   Railway detects the `Dockerfile` and builds it.
3. *(If using Railway's own DB)* **New → Database → PostgreSQL**.
4. Open your service → **Variables** → add the env vars from
   [the table below](#environment-variables). If you added Railway Postgres, set
   `DATABASE_URL` to `${{Postgres.DATABASE_URL}}`.
5. **Settings → Networking → Generate Domain**. That URL is your live app. 🎉

---

## Step 3 — Environment variables

Set these in your host's dashboard (Railway "Variables" / Render "Environment" /
Koyeb "Secrets"):

| Variable | Required | Value / how to generate |
|---|---|---|
| `JWT_SECRET` | **Yes** | Any 32+ char random string. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `DATABASE_URL` | Recommended | Your Neon / Railway Postgres connection string |
| `ADMIN_EMAIL` | Recommended | The email you want for the seeded admin account |
| `ADMIN_PASSWORD` | Recommended | A strong password for that admin (change from the default!) |
| `NEXTAUTH_SECRET` | Optional | Another random string |
| `FILE_ENCRYPTION_KEY` | Optional | 64 hex chars (only needed for encrypted file uploads) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Optional | Gmail/SendGrid, only if you want email OTP to actually send |

Notes:
- `NODE_ENV=production` is already baked into the Docker image — you don't need
  to set it (and you shouldn't set it to anything else).
- `PORT` is injected by the host automatically. Don't set it.
- The seeded admin has 2FA **off** by default so you can log in immediately.
  Set `ADMIN_2FA=true` to require an email OTP (needs SMTP configured).

---

## Step 4 — Smoke test (2 minutes)

1. Open your live URL — you should see the Aurex login screen.
2. Log in as the admin (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), **or** register a new
   account and log in.
3. Open the app in **two different browsers** (or a normal + incognito window),
   log in as two users, go to **Secure Communications**, pick the same room, and
   send a message — it should appear **instantly** in the other window. ✅

---

## What works vs. what doesn't (be honest with your testers)

**Works:** login/registration (persistent with Postgres), **real-time chat**,
profiles, some tools (whois, deobfuscate), threat feed (sample data).

**Not ready yet:**
- **Chat messages & rooms are still stored in a file**, so they reset on every
  redeploy and won't sync if you scale to more than one instance. (Next step:
  move them to Postgres — the code is already structured for it.)
- **Live terminal** is disabled here — it needs a sandbox before it's safe to
  expose. Don't enable it for a public test.
- **Email OTP** only sends if you configure SMTP; otherwise codes appear in the
  server logs.

---

## Alternatives

**Render:** New → **Web Service** → connect the repo → it detects the Dockerfile
→ add the env vars above → Create. (Free tier sleeps after ~15 min idle; first
request after that is slow.)

**Koyeb:** already configured via `koyeb-deploy.sh`. Create the app from the repo,
choose Docker, and set the same env vars as **secrets**. Make sure the service
port matches the app's `$PORT`.
