# Deployment Guide

## Architecture

```
GitHub Pages (static frontend)  ──fetch──▶  Cloudflare Worker (API)
                                              ├── KV (messages)
                                              └── DashScope API (moderation)
```

---

## Part 1: Cloudflare Worker (Backend API)

### Prerequisites
- Cloudflare account (free tier: 100k req/day, 1GB KV)

### Setup

```bash
cd worker
npm install
```

1. **Create KV namespace**
   ```bash
   npx wrangler kv namespace create HELYCAT_KV
   ```
   Copy the output `id` into `wrangler.toml`, replacing `your-kv-namespace-id-here` in both `id` and `preview_id`.

2. **Set API key secret**
   ```bash
   npx wrangler secret put DASHSCOPE_API_KEY
   # Paste: sk-8652d71debe641cfaf3d540038935479
   ```

3. **Set default env vars (optional, defaults already in code)**
   ```bash
   npx wrangler secret put DASHSCOPE_BASE_URL
   npx wrangler secret put DASHSCOPE_MODEL_ID
   ```

4. **Deploy**
   ```bash
   npx wrangler deploy
   ```
   Note the Worker URL (e.g., `https://hellycat-api.YOUR_USERNAME.workers.dev`).

---

## Part 2: GitHub Pages (Frontend)

1. **Update API URL** in `App.tsx`:
   ```ts
   const API_BASE = 'https://hellycat-api.YOUR_USERNAME.workers.dev';
   ```
   Replace `YOUR_USERNAME` with your Cloudflare Worker subdomain.

2. **Build**
   ```bash
   npm run build
   ```

3. **Deploy** the `dist/` folder to GitHub Pages:
   - Settings → Pages → Source: Deploy from a branch → select `gh-pages` or use GitHub Actions
   - Ensure `base` in `vite.config.ts` matches your repo path (set to `/` if using custom domain)

### Quick deploy script (after initial setup)
```bash
npm run build && npx gh-pages -d dist
```

---

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/messages` | Fetch all messages (limit 100) |
| POST | `/api/messages` | Submit message (body: `{text: "..."}`) |
| GET | `/api/health` | Health check |

---

## Environment Variables (Worker Secrets)

| Variable | Description | Required |
|----------|-------------|----------|
| `DASHSCOPE_API_KEY` | DashScope API key | Yes |
| `DASHSCOPE_BASE_URL` | DashScope base URL | No |
| `DASHSCOPE_MODEL_ID` | Model ID for moderation | No |
