# Deployment Status - Railway

## Current Issue: API Returning 502

**Symptoms:**
- API returns 502 Bad Gateway  
- Railway logs show only "Starting Container"
- No application logs visible

**Root Cause:** Likely DATABASE_URL not properly linked OR missing scraper_errors table

## Required Fixes (Railway Dashboard)

### 1. Verify DATABASE_URL Reference (CRITICAL)
API service → Variables:
- Confirm `DATABASE_URL` is **Reference Variable** → Postgres service
- NOT a static string

If missing:
```
Add Variable → DATABASE_URL → Reference → Postgres → DATABASE_URL
```

### 2. Apply DB Schema
Postgres service → Data → Query:
```sql
CREATE TABLE IF NOT EXISTS scraper_errors (
  id SERIAL PRIMARY KEY,
  scraper_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  occurred_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scraper_errors_name ON scraper_errors(scraper_name);
CREATE INDEX IF NOT EXISTS idx_scraper_errors_occurred ON scraper_errors(occurred_at);
```

### 3. Check Detailed Logs
Railway Dashboard → API service → Deployments → Latest → View Logs

Look for:
- `❌ FATAL: DATABASE_URL is not set`
- `❌ Database connection test failed`  
- `relation "scraper_errors" does not exist`

## Verify After Fix

```bash
# Test health
curl https://api-production-d092.up.railway.app/health

# Run smoke test
./scripts/smoke-test.sh https://api-production-d092.up.railway.app
```

## Changes Deployed
- Enhanced `/health` with DB + scraper checks
- `/api/errors` endpoint for error tracking
- DATABASE_URL validation (fails fast if missing)
- Smoke test script + monitoring docs
