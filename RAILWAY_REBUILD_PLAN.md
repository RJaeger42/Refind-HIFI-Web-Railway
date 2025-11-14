# Railway Rebuild Plan - Debug Strategy

## Overview
Delete all services, rebuild one-by-one with testing at each step.

---

## Phase 1: Clean Slate

### Step 1.1: Delete All Services
Railway Dashboard:
1. Delete `api` service
2. Delete `scrapers` service
3. Delete `scrapers-heavy` service
4. Keep `Postgres` service (preserve data)

---

## Phase 2: Deploy Database Only

### Step 2.1: Verify Postgres Service
Railway Dashboard → Postgres service:
1. Check status: Should show "Active"
2. Note the connection info (Variables tab)
3. Copy `DATABASE_URL` value

### Step 2.2: Test DB Connection Locally
```bash
# Get DATABASE_URL from Railway
railway variables --service Postgres

# Test connection (replace with actual URL)
psql "postgresql://user:pass@host:port/dbname" -c "SELECT 1"
```

Expected: `?column? 1` response

### Step 2.3: Apply Full Schema
```bash
# Use Railway dashboard OR:
railway run --service Postgres psql < database/schema.sql

# Verify tables exist
psql "postgresql://..." -c "\dt"
```

Expected tables:
- `listings`
- `price_history`
- `scraper_errors`

**✅ Checkpoint: Database ready**

---

## Phase 3: Deploy API Service Only

### Step 3.1: Create API Service
Railway Dashboard:
1. New → GitHub Repo → Select this repo
2. Service name: `api`
3. Root directory: `/` (repo root)
4. Build command: `cd services/api && npm install && npm run build`
5. Start command: `cd services/api && npm start`

### Step 3.2: Configure API Variables
Railway Dashboard → api service → Variables:
1. Add `DATABASE_URL` → **Reference** → Postgres → DATABASE_URL
2. Add `NODE_ENV` → `production`
3. Add `PORT` → `3000` (Railway auto-sets this, but be explicit)

### Step 3.3: Watch Deployment
Railway Dashboard → api → Deployments → Latest deployment:

**Look for these log patterns:**

✅ **Success indicators:**
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

❌ **Failure indicators:**
```
❌ FATAL: DATABASE_URL is not set
❌ Database connection test failed
❌ Failed to create database pool
Port 3000 is already in use
```

### Step 3.4: Test API Endpoints

Once deployed, get the public URL from Railway dashboard:

```bash
# Save API URL
API_URL="https://api-production-xxxx.up.railway.app"

# Test 1: Basic health
curl -v $API_URL/health
# Expected: 200 OK
# Body: {"status":"ok" or "degraded","timestamp":"...","checks":{...}}

# Test 2: Stats endpoint
curl $API_URL/api/stats
# Expected: {"total_listings":N,"total_sites":N,...}

# Test 3: Listings (should be empty or have test data)
curl $API_URL/api/listings?limit=5
# Expected: {"data":[...],"pagination":{...}}

# Test 4: Errors endpoint
curl $API_URL/api/errors
# Expected: {"errors":[],"stats":{...}}

# Test 5: Sites list
curl $API_URL/api/sites
# Expected: [] or list of site names
```

### Step 3.5: Unit Test - API Only
```bash
# Create quick test script
cat > test_api.sh << 'SCRIPT'
#!/bin/bash
API_URL="${1:-https://your-api-url.railway.app}"
echo "Testing $API_URL"

# Health check
echo -n "Health: "
curl -s "$API_URL/health" | jq -r '.status'

# Stats
echo -n "Total listings: "
curl -s "$API_URL/api/stats" | jq -r '.total_listings'

# Errors endpoint exists
echo -n "Errors endpoint: "
curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/errors"
echo ""
SCRIPT

chmod +x test_api.sh
./test_api.sh $API_URL
```

**✅ Checkpoint: API service healthy, all endpoints responding**

---

## Phase 4: Deploy Light Scrapers Service

### Step 4.1: Create Scrapers Service
Railway Dashboard:
1. New → GitHub Repo → Select this repo
2. Service name: `scrapers`
3. Root directory: `/`
4. Build command: `cd services/scrapers && npm install && npm run build`
5. Start command: `cd services/scrapers && npm start`

### Step 4.2: Configure Scrapers Variables
Railway Dashboard → scrapers service → Variables:
1. Add `DATABASE_URL` → **Reference** → Postgres → DATABASE_URL
2. Add `NODE_ENV` → `production`
3. Add `WEBHOOK_PORT` → `3001`
4. Add `WEBHOOK_SECRET` → Generate strong secret (save it!)

### Step 4.3: Watch Scrapers Deployment
Look for:
```
✅ Database connected: [timestamp]
🌐 Webhook server listening on port 3001
⏰ Cron schedule: 0 */6 * * * (every 6 hours)
Cron job scheduled
```

### Step 4.4: Test Scrapers Service

```bash
# Test 1: Scraper health (internal Railway URL)
# From API service logs or create test endpoint
curl http://scrapers.railway.internal:3001/health
# Expected: {"status":"ok","service":"scrapers-light","isRunning":false,"lastRun":null}

# Test 2: Check scraper status via API
curl $API_URL/api/scrape/status
# Expected: {"light":{"service":"scrapers-light",...},"heavy":{...}}

# Test 3: Manual trigger (use saved WEBHOOK_SECRET)
curl -X POST $API_URL/api/scrape/trigger \
  -H "Content-Type: application/json" \
  -d '{"container":"light"}'
# Expected: {"triggered":true,"results":[...]}

# Wait 30 seconds, then check for new listings
sleep 30
curl $API_URL/api/stats | jq '.total_listings'
```

### Step 4.5: Monitor Scraper Run
Railway Dashboard → scrapers → Logs:

Watch for:
```
🚀 Starting Light Scraper Service
⏰ Time: [timestamp]
✅ Database connected
📋 Running 11 light scrapers...

🔍 Running scraper: hifitorget
   Found X results
   Y valid listings (with price & URL)
   ✅ Saved Y listings to database

[repeat for each scraper]

✅ Scraping complete!
   Total listings saved: Z
   Duration: X.XXs
```

**Check for errors:**
```
❌ Error running [scraper]: [error message]
```

If errors occur:
```bash
# Check error tracking
curl $API_URL/api/errors | jq '.errors'
```

**✅ Checkpoint: Light scrapers running, data flowing to DB**

---

## Phase 5: Deploy Heavy Scrapers Service

### Step 5.1: Create Scrapers-Heavy Service
Railway Dashboard:
1. New → GitHub Repo → Select this repo
2. Service name: `scrapers-heavy`
3. Root directory: `/`
4. Build command: `cd services/scrapers-heavy && npm install && npm run build`
5. Start command: `cd services/scrapers-heavy && npm start`

### Step 5.2: Configure Scrapers-Heavy Variables
Same as light scrapers:
1. `DATABASE_URL` → **Reference** → Postgres → DATABASE_URL
2. `NODE_ENV` → `production`
3. `WEBHOOK_PORT` → `3001`
4. `WEBHOOK_SECRET` → **Same secret as light scrapers**

### Step 5.3: Test Heavy Scrapers
```bash
# Test heavy scraper status via API
curl $API_URL/api/scrape/status
# Should show both light and heavy

# Trigger heavy scrapers (Facebook + HifiShark)
curl -X POST $API_URL/api/scrape/trigger \
  -H "Content-Type: application/json" \
  -d '{"container":"heavy"}'
```

**Note:** Heavy scrapers use Playwright - expect longer run times.

**✅ Checkpoint: All services running**

---

## Phase 6: Final Validation

### Step 6.1: Run Full Smoke Test
```bash
./scripts/smoke-test.sh $API_URL
```

Expected output:
```
🧪 Running smoke tests against: https://...

1. Testing /health endpoint... ✓ PASS (HTTP 200)
2. Testing /api/listings endpoint... ✓ PASS (HTTP 200)
3. Testing /api/stats endpoint... ✓ PASS (HTTP 200)
4. Testing /api/errors endpoint... ✓ PASS (HTTP 200)
5. Testing /api/sites endpoint... ✓ PASS (HTTP 200)

✓ All smoke tests passed!
```

### Step 6.2: Verify All Services Healthy
```bash
curl $API_URL/health | jq
```

Expected:
```json
{
  "status": "ok",
  "timestamp": "...",
  "checks": {
    "database": "ok",
    "scrapersLight": "ok",
    "scrapersHeavy": "ok"
  }
}
```

### Step 6.3: Verify Data Pipeline
```bash
# Check recent scrapes
curl $API_URL/api/stats | jq '{
  total_listings,
  total_sites,
  last_scrape
}'

# View sample listings
curl "$API_URL/api/listings?limit=3" | jq '.data[].product'

# Check for recent errors
curl $API_URL/api/errors | jq '.stats'
```

**✅ Final Checkpoint: Full system operational**

---

## Troubleshooting Guide

### Issue: API Logs Show "DATABASE_URL is not set"
**Fix:**
1. Railway → api service → Variables
2. Delete existing `DATABASE_URL` (if exists as string)
3. Add Variable → Name: `DATABASE_URL` → Type: **Reference** → Service: Postgres → Variable: DATABASE_URL
4. Redeploy

### Issue: "relation 'scraper_errors' does not exist"
**Fix:**
```bash
# Apply missing schema
railway run --service Postgres psql < database/add_error_table.sql
```

### Issue: Scrapers Can't Connect to DB
**Fix:** Same as API - ensure DATABASE_URL is Reference variable, not string

### Issue: API Returns 502 After Deployment
**Causes:**
1. Service crashed during startup → Check logs
2. Port not binding → Ensure PORT env var set
3. Build failed → Check build logs

**Debug:**
```bash
railway logs --service api --lines 200
```

### Issue: Scrapers Run But No Data Appears
**Check:**
1. Scraper logs for errors
2. `curl $API_URL/api/errors` for logged failures
3. Database has data: `psql $DATABASE_URL -c "SELECT COUNT(*) FROM listings"`

### Issue: Health Check Shows Scrapers "unreachable"
**Normal** if:
- Scrapers just restarted
- During scraping run (high CPU)

**Problem** if persistent:
- Check scraper service logs
- Verify webhook server started: Look for "🌐 Webhook server listening"

---

## Rollback Strategy

If any phase fails:
1. Note the error in logs
2. Delete the failing service
3. Fix the issue (env vars, code, schema)
4. Retry from that phase

Previous working commit (before monitoring changes): `dce2577`
Current commit (with monitoring): `e30934d`

To rollback code:
```bash
git checkout dce2577
git push -f origin master
```

---

## Success Criteria

All must pass:
- [ ] Postgres service active, all tables exist
- [ ] API responds 200 on `/health`
- [ ] `/api/listings` returns data (even if empty)
- [ ] `/api/errors` endpoint exists
- [ ] Scrapers webhook server responds on port 3001
- [ ] Manual scrape trigger works
- [ ] Smoke test passes completely
- [ ] Health check shows all services "ok"

---

## Post-Deployment Tasks

Once all services healthy:
1. Set up Railway alerts (see `docs/MONITORING.md`)
2. Configure UptimeRobot for `/health` endpoint
3. Monitor `/api/errors` daily for first week
4. Verify cron jobs running (check `last_scrape` in stats)
5. Test frontend deployment (separate phase)
