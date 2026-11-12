# Portfolio Visitor Counter — Deployment Guide

This guide explains how to deploy the **Cloudflare Worker + KV** visitor counter that powers the "Total Visitors" stat on your GitHub Pages portfolio.

---

## Why Cloudflare Worker + KV?

| Requirement | Solution |
|-------------|----------|
| **Free** | Cloudflare Workers: 100k req/day free; KV: 1 GB free |
| **Works on `github.io`** | No custom domain needed — runs on `*.workers.dev` |
| **Live counter** | Server-side increment, returns JSON to browser |
| **Location data** | Cloudflare injects `cf-ipcountry`, `cf-ipcity` headers automatically |
| **Your data** | You own the KV namespace; no 3rd-party analytics |
| **Zero config after deploy** | Just update `WORKER_URL` in `script.js` |

---

## Step-by-Step Deployment

### 1. Create a KV Namespace
```bash
# Option A: Dashboard
# 1. Go to dash.cloudflare.com → Workers & Pages → KV
# 2. Create namespace → name it "portfolio-visitor-kv"
# 3. Note the namespace ID

# Option B: Wrangler CLI (recommended)
npx wrangler kv:namespace create "VISITOR_KV"
# Output: { "id": "abc123...", "title": "VISITOR_KV" }
```

### 2. Create the Worker
```bash
# Option A: Dashboard (simplest)
# 1. dash.cloudflare.com → Workers & Pages → Create Application
# 2. Choose "Workers" → "Hello World" → Deploy
# 3. Name it (e.g., "portfolio-visitor-counter")
# 4. Copy the worker code from `worker.js` into the editor
# 5. In Settings → Bindings → Add KV namespace binding:
#    - Variable name: `VISITOR_KV`
#    - KV namespace: select "portfolio-visitor-kv"
# 6. Save & Deploy

# Option B: Wrangler CLI
npm install -g wrangler
wrangler login
# Create wrangler.toml (see below) then:
wrangler deploy
```

### 3. wrangler.toml (if using CLI)
```toml
name = "portfolio-visitor-counter"
main = "worker.js"
compatibility_date = "2024-11-12"

[[kv_namespaces]]
binding = "VISITOR_KV"
id = "YOUR_KV_NAMESPACE_ID_FROM_STEP_1"
# preview_id = "YOUR_PREVIEW_KV_ID"  # optional for preview env
```

### 4. Get Your Worker URL
After deploy, you'll get a URL like:
```
https://portfolio-visitor-counter.YOUR_SUBDOMAIN.workers.dev
```
Or if using custom domain:
```
https://counter.yourdomain.com
```

### 5. Update `script.js`
In `script.js`, replace the placeholder:
```js
const WORKER_URL = 'https://portfolio-visitor-counter.YOUR_SUBDOMAIN.workers.dev';
```
With your actual deployed Worker URL.

### 6. Deploy Portfolio
```bash
git add index.html style.css script.js
git commit -m "feat: add visitor counter with Cloudflare Worker"
git push origin main
```
GitHub Actions will deploy to GitHub Pages automatically.

---

## What You Get

| Feature | Implementation |
|---------|----------------|
| **Total visit count** | Atomic increment in KV, animated on page like other stats |
| **Visitor country** | From `cf-ipcountry` header (ISO code, e.g., "US", "IN", "DE") |
| **Visitor city** | From `cf-ipcity` header (when available) |
| **Cloudflare PoP** | From `cf-ray` header (shows which edge location served the request) |
| **Timezone** | From `cf-timezone` header |
| **Privacy-friendly** | No cookies, no personal identifiers, no 3rd parties |

---

## Local Testing (Optional)

```bash
# Test worker locally
wrangler dev --local
# Then open http://localhost:8787 in browser
```

---

## Monitoring

- **Worker logs**: `wrangler tail` or Dashboard → Workers → Logs
- **KV usage**: Dashboard → Workers & Pages → KV → portfolio-visitor-kv → Metrics
- **Analytics**: Dashboard → Workers → Analytics (requests, errors, CPU time)

---

## Costs (Free Tier Limits)

| Resource | Free Limit | Your Usage |
|----------|------------|------------|
| Worker requests | 100,000/day | ~1 per page view |
| KV reads | 100,000/day | 1 per page view |
| KV writes | 1,000/day | 1 per unique visitor (deduplicate if needed) |
| KV storage | 1 GB | < 1 KB |

For a personal portfolio, this will never hit limits.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Counter shows `—` / `Counter unavailable` | Check browser console → network tab → verify worker URL returns 200 |
| CORS error | Worker includes `Access-Control-Allow-Origin: *` — should work |
| Count doesn't increment | Verify KV binding name matches `VISITOR_KV` exactly |
| Location shows "Unknown" | Some regions/VPNs don't return `cf-ipcity`; country usually works |
| Want to reset count | In Dashboard → KV → portfolio-visitor-kv → delete key `portfolio:total_visits` |

---

## Optional Enhancements

1. **Deduplicate** (count unique visitors, not page views):
   - Set a cookie with 24h expiry on client side
   - Only call worker if cookie not present

2. **Daily/Weekly/Monthly breakdowns**:
   - Use KV keys like `portfolio:visits:2024-11-12`
   - Worker increments both total + daily key

3. **Dashboard page** (protected by simple auth):
   - Separate Worker route `/admin` returning full KV data
   - Or use Cloudflare Access (free for 50 users)

4. **Referrer tracking**:
   - Read `referer` header in Worker
   - Store top referrers in KV

---

## Files in This Repo

| File | Purpose |
|------|---------|
| `worker.js` | Cloudflare Worker code (deploy this) |
| `script.js` | Client-side fetch + animation (update WORKER_URL) |
| `index.html` | Added 5th stat card `#visitorCount` + `#visitorLocation` |
| `style.css` | Grid layout for 5 stats, responsive breakpoints |
| `DEPLOY_VISITOR_COUNTER.md` | This guide |

---

## Quick Verify After Deploy

1. Open your live portfolio: `https://gurjyot-gurz.github.io/Tech-Portfolio/`
2. Scroll to **GitHub / Open Source** section
3. 5th card should show animated count + location (e.g., "IN, Bengaluru")
4. Refresh → count increments
5. Ask a friend to visit → count increments again

---

**That's it!** Once deployed, you'll have a live, privacy-friendly visitor counter with geographic data — all free, all yours.