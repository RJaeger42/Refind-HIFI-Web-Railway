# Phase 3: Deploy API Service

## Prerequisites
✅ Phase 2 complete (Postgres verified, schema applied)

## Step 1: Create API Service (Railway Dashboard)

1. Go to: https://railway.app → hifi-deals-aggregator
2. Click: "New Service" → "GitHub Repo"
3. Select: Your repo (Refind-HIFI-Web-Railway)
4. Service name: `api`

## Step 2: Configure Build Settings

Railway Dashboard → api service → Settings:

**Root Directory:** Leave empty (uses repo root)

**Build Command:**
```
cd services/api && npm install && npm run build
```

**Start Command:**
```
cd services/api && npm start
```

**Watch Paths:** (optional, improves rebuild performance)
```
services/api/**
```

## Step 3: Add Environment Variables

Railway Dashboard → api service → Variables → New Variable:

1. **DATABASE_URL** (CRITICAL)
   - Click "New Variable"
   - Name: `DATABASE_URL`
   - Type: **Variable Reference** (not Raw Text!)
   - Service: `Postgres`
   - Variable: `DATABASE_URL`

2. **NODE_ENV**
   - Name: `NODE_ENV`
   - Value: `production`

3. **PORT** (Railway usually auto-sets, but verify)
   - Should appear automatically
   - Value: `3000` or Railway's assigned port

## Step 4: Deploy

Click "Deploy" or it will auto-deploy after variable setup.

## Step 5: Watch Deployment Logs

Railway Dashboard → api → Deployments → Latest

**✅ Look for SUCCESS patterns:**
```
🚀 API Server starting...
📍 PORT: 3000
📍 NODE_ENV: production
📍 DATABASE_URL: SET
✅ Imports loaded
✅ Express app created
✅ Database pool created
✅ Database connection successful
✅ Middleware loaded
🌐 Attempting to start server on port 3000...
✅ ✅ ✅ API server running on port 3000 ✅ ✅ ✅
```

**❌ FAILURE patterns:**
```
❌ FATAL: DATABASE_URL is not set
  → Fix: DATABASE_URL must be Reference variable, not string

❌ Database connection test failed
  → Fix: Check Postgres is running, URL is correct

relation "scraper_errors" does not exist
  → Fix: Rerun Phase 2 schema

Port 3000 is already in use
  → Fix: Railway should auto-assign PORT
```

## Step 6: Get Public URL

Railway Dashboard → api service → Settings → Domains

Copy the public URL (e.g., `https://api-production-xxxx.up.railway.app`)

## Step 7: Run Unit Tests

```bash
# Save API URL
export API_URL="https://api-production-xxxx.up.railway.app"

# Run tests
./scripts/test-api-unit.sh $API_URL
```

**Expected output:**
```
🧪 Testing API service: https://...

1. Health endpoint: ✅ PASS
   Status: ok
   DB: ok
2. Stats endpoint: ✅ PASS
   Listings: 1
   Sites: 1
3. Listings endpoint: ✅ PASS
4. Errors endpoint: ✅ PASS
5. Sites endpoint: ✅ PASS

✅ All API unit tests passed!
```

## Step 8: Manual Health Check

```bash
curl $API_URL/health | jq
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-14T...",
  "checks": {
    "database": "ok",
    "scrapersLight": "unreachable",
    "scrapersHeavy": "unreachable"
  }
}
```

Note: Scrapers showing "unreachable" is **normal** - they're not deployed yet.

## Troubleshooting

### API Returns 502
- Check deployment logs for errors
- Verify DATABASE_URL is Reference variable
- Ensure schema was applied

### Health Check Shows DB Failed
```bash
# Test DB connection directly
railway run --service Postgres psql -c "SELECT 1"
```

### Build Fails
```bash
# Check if TypeScript compiles locally
cd services/api
npm install
npm run build
```

## Success Criteria

✅ All must pass:
- [ ] Deployment logs show "API server running"
- [ ] Public URL returns 200 on `/health`
- [ ] All 5 unit tests pass
- [ ] `/api/stats` returns data
- [ ] `/api/errors` endpoint works

## Next: Phase 4
Once API is healthy, deploy light scrapers service.
