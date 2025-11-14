# Railway Deployment Status

## Project: hifi-deals-aggregator
**Railway Dashboard:** https://railway.com/project/bc4c5205-dba5-4603-8887-5dc4978bd817

## Services Deployed

### 1. Postgres Database ✅
- **Status:** Running
- **Database:** railway
- **Connection:** Configured via `DATABASE_URL` variable
- **Schema:** Initialized successfully
  - Tables: `listings`, `price_history`, `latest_listings` (view), `listings_with_price_history` (view)
  - Test listing added: 1 record

### 2. Scrapers Service
- **Service ID:** 93b6990b-d391-423c-a23d-c0705d252b20
- **Build Logs:** https://railway.com/project/bc4c5205-dba5-4603-8887-5dc4978bd817/service/93b6990b-d391-423c-a23d-c0705d252b20?id=87671f81-d984-4b3f-9eeb-b2015182055f&
- **Variables Set:**
  - `DATABASE_URL` → Referenced from Postgres service
- **Function:** Runs all 15 scrapers every 6 hours
- **Note:** Check build logs for deployment status

### 3. API Service
- **Service ID:** a5bae4a8-e978-4112-94a7-646b6f27218f
- **Build Logs:** https://railway.com/project/bc4c5205-dba5-4603-8887-5dc4978bd817/service/a5bae4a8-e978-4112-94a7-646b6f27218f?id=22d91908-46ca-4595-bb6e-e5168c798328&
- **Public URL:** https://api-production-d092.up.railway.app
- **Variables Set:**
  - `DATABASE_URL` → Referenced from Postgres service
- **Endpoints:**
  - `GET /health`
  - `GET /api/listings`
  - `GET /api/listings/:id`
  - `GET /api/listings/:id/history`
  - `GET /api/sites`
  - `GET /api/stats`
- **Status:** Currently returning 502 - check build logs

### 4. Frontend Service
- **Service ID:** 8729ab3e-8203-4e60-b1b5-14279de6aeaf
- **Build Logs:** https://railway.com/project/bc4c5205-dba5-4603-8887-5dc4978bd817/service/8729ab3e-8203-4e60-b1b5-14279de6aeaf?id=74bc8415-f15f-487f-9e26-40a53e63b615&
- **Public URL:** https://frontend-production-5a41.up.railway.app
- **Configuration:**
  - Nginx proxy configured to API at: https://api-production-d092.up.railway.app
- **Status:** Currently returning 502 - check build logs

## Next Steps

### 1. Check Build Status
Visit Railway dashboard and check build logs for each service:
- API and Frontend showing 502 errors (builds may still be in progress or failed)
- Check logs for build errors

### 2. Common Issues to Check

**If API build fails:**
- Check that all dependencies installed correctly
- Verify TypeScript compilation succeeded
- Check that PORT environment variable is set correctly

**If Frontend build fails:**
- Check React build process completed
- Verify nginx configuration is valid
- Check that build artifacts copied to correct location

**If Scrapers service fails:**
- Check Playwright installation in Docker
- Verify SiteScrapers directory copied correctly
- Check TypeScript build with correct rootDir

### 3. Monitor Scraper Runs
Once scrapers service is running:
```bash
railway service scrapers
railway logs
```

Expected output:
- "Starting Cron Service"
- "Running X scrapers..."
- "Saved Y listings to database"

### 4. Test API Endpoints
Once API is running:
```bash
# Health check
curl https://api-production-d092.up.railway.app/health

# Get stats
curl https://api-production-d092.up.railway.app/api/stats

# Get listings
curl https://api-production-d092.up.railway.app/api/listings
```

### 5. Access Frontend
Once frontend is running:
- Open: https://frontend-production-5a41.up.railway.app
- Should display listings from database
- Test filters and search functionality

## Deployment Commands Used

```bash
# Initialize database
node init-db.js

# Deploy scrapers
railway service scrapers
cd services/scrapers
railway up --detach

# Deploy API
railway service api
cd services/api
railway up --detach
railway domain  # Generated domain

# Deploy frontend
railway service frontend
cd services/frontend
railway up --detach
railway domain  # Generated domain

# Link services to Postgres
railway service scrapers
railway variables --set "DATABASE_URL=${{Postgres.DATABASE_URL}}"

railway service api
railway variables --set "DATABASE_URL=${{Postgres.DATABASE_URL}}"
```

## Troubleshooting

### View Service Logs
```bash
railway service <service-name>
railway logs
```

### Redeploy Service
```bash
railway service <service-name>
railway up --detach
```

### Check Variables
```bash
railway service <service-name>
railway variables
```

### Update Variables
```bash
railway service <service-name>
railway variables --set "KEY=value"
```

## Architecture Summary

```
┌─────────────────┐
│    Postgres     │ ← Schema initialized ✅
│   (Database)    │
└────────┬────────┘
         │
         ├─────────────────┬─────────────────┐
         │                 │                 │
    ┌────▼─────┐     ┌────▼────┐      ┌────▼────┐
    │ Scrapers │     │   API   │      │Frontend │
    │  Service │     │ Service │      │ Service │
    └──────────┘     └────┬────┘      └────┬────┘
         │                │                 │
    Runs every       Serves REST        React SPA
    6 hours          endpoints          with nginx
                          │                 │
                     Public URL         Public URL
```

## Cost Monitoring

Railway free tier includes:
- $5 credit/month
- After credit used, ~$0.000231/GB-hour

Expected usage:
- 4 services running 24/7
- Est: $5-15/month

Monitor usage in Railway dashboard.
