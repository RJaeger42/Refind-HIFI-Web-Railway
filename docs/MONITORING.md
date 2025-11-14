# Monitoring & Alerting Guide

## Quick Start

### 1. Run Smoke Test After Deploy
```bash
# Test production deployment
./scripts/smoke-test.sh

# Or test specific URL
./scripts/smoke-test.sh https://your-api-url.railway.app
```

### 2. Check Error Dashboard
Visit: `https://your-api-url.railway.app/api/errors`

## Health Checks

### Comprehensive Health Endpoint
`GET /health`

Returns:
```json
{
  "status": "ok",           // "ok" or "degraded"
  "timestamp": "2025-11-14T...",
  "checks": {
    "database": "ok",        // DB connection
    "scrapersLight": "ok",   // Light scraper service
    "scrapersHeavy": "ok"    // Heavy scraper service
  }
}
```

- **200**: All systems operational
- **503**: Database failed (degraded state)

### Individual Service Health
- Light scrapers: `http://scrapers.railway.internal:3001/health`
- Heavy scrapers: `http://scrapers-heavy.railway.internal:3001/health`

## Error Tracking

### View Recent Errors
`GET /api/errors?limit=50`

Returns last 50 errors with 24h summary:
```json
{
  "errors": [
    {
      "id": 123,
      "scraper_name": "hifitorget",
      "error_message": "Connection timeout",
      "error_stack": "...",
      "occurred_at": "2025-11-14T..."
    }
  ],
  "stats": {
    "total_errors": 5,
    "affected_scrapers": 2,
    "last_error": "2025-11-14T..."
  }
}
```

### Filter by Scraper
`GET /api/errors?scraper=facebook&limit=20`

### What Gets Logged
- Scraper crashes (network, parsing, etc.)
- Database insert failures
- All errors automatically captured in `scraper_errors` table

## Railway Alerts Setup

### Step 1: Enable Crash Detection
1. Railway Dashboard → Select service (API, scrapers, or scrapers-heavy)
2. Settings → Deploys → Enable "Send restart notifications"
3. Enter email or webhook URL

### Step 2: Configure Log Alerts
1. Service → Observability → Create Alert
2. Alert conditions:
   - **5xx errors**: Regex `HTTP 5\d{2}`
   - **Database errors**: Keyword `❌ Database`
   - **Scraper failures**: Keyword `❌ Error running`
3. Set threshold (e.g., 5 occurrences in 10 min)
4. Add notification channel (email/Slack/Discord)

### Step 3: Uptime Monitoring (External)
Railway doesn't have built-in uptime checks. Use free external:

**UptimeRobot** (free 50 monitors):
1. Add HTTP(s) monitor
2. URL: `https://your-api.railway.app/health`
3. Interval: 5 minutes
4. Alert when down > 2 minutes

**Better Uptime** (free 10 monitors):
- Similar setup
- Can check response body for `"status": "ok"`

## What to Monitor

### Critical (Alert Immediately)
- [ ] `/health` returns 503 or times out
- [ ] Database connection failures
- [ ] Service crashes/restarts

### Important (Daily Check)
- [ ] `GET /api/errors` - check 24h error count
- [ ] Railway logs - scan for repeated warnings
- [ ] `GET /api/stats` - verify `last_scrape` is recent

### Nice to Have
- [ ] Track listing growth trends
- [ ] Monitor scraper run duration
- [ ] Price history completeness

## Manual Checks

### Check if scrapers are running
```bash
curl https://your-api.railway.app/api/scrape/status
```

### Check database has recent data
```bash
curl https://your-api.railway.app/api/stats | jq '.last_scrape'
```

### Trigger manual scrape (if needed)
```bash
curl -X POST https://your-api.railway.app/api/scrape/trigger \
  -H "Content-Type: application/json" \
  -d '{"container": "all"}'
```

## Railway Log Patterns

### Good Signs
```
✅ Database connection successful
✅ Saved 42 listings to database
✅ Scraping complete!
```

### Bad Signs
```
❌ Database connection failed
❌ Error running hifitorget: TimeoutError
❌ Uncaught Exception
502 Bad Gateway
```

### Filter Railway Logs
- Service dropdown → Select "API" or "scrapers"
- Search box → Enter keyword (e.g., `❌` or `Error`)
- Time range → Last 24h

## Troubleshooting

### High Error Rate in /api/errors
1. Check specific scrapers failing: `GET /api/errors?scraper=facebook`
2. Common causes:
   - Site changed HTML structure
   - IP blocked (move to local if persistent)
   - Network timeouts (increase timeout in scraper code)

### Health Check Shows Database Failed
1. Railway Dashboard → Database service → Metrics
2. Check connection limit reached
3. Verify `DATABASE_URL` env var set correctly
4. Check SSL settings (should use SSL in production)

### Scrapers Unreachable in Health Check
- Normal during scraper restarts
- If persistent: check scraper service logs
- Verify webhook server started: look for "🌐 Webhook server listening"

## Cost Optimization

Railway charges for:
- Compute time (all 4 services running)
- Database storage
- Egress bandwidth

To reduce costs:
- Run scrapers less frequently (edit cron schedule)
- Reduce scraper timeout values
- Use `LIMIT` in queries to reduce response size
- Archive old listings (>90 days)

## Schema Migration

If you need to add the error tracking table to existing DB:
```sql
-- Run in Railway DB query console
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

## Useful Railway CLI Commands

```bash
# View live logs
railway logs --service api --follow

# Check service status
railway status

# Run smoke test against Railway
railway run bash scripts/smoke-test.sh
```
