# Phase 2: Verify Postgres & Apply Schema

## After Deleting Services

Run verification script:
```bash
./scripts/verify-postgres.sh
```

**Or manual steps:**

### Step 1: Get DATABASE_URL
```bash
railway variables --service Postgres | grep DATABASE_URL
```

Copy the URL (will look like: `postgresql://postgres:...@...railway.app:5432/railway`)

### Step 2: Test Connection
```bash
# Replace with actual URL
psql "postgresql://..." -c "SELECT 1"
```

Expected: 
```
 ?column? 
----------
        1
```

### Step 3: Apply Schema
```bash
psql "postgresql://..." -f database/schema.sql
```

Should see:
```
CREATE TABLE
CREATE INDEX
...
status
----------------------------------
Schema created successfully!
```

### Step 4: Verify Tables
```bash
psql "postgresql://..." -c "\dt"
```

Expected tables:
- `listings`
- `price_history`
- `scraper_errors`

### Step 5: Check Data
```bash
psql "postgresql://..." -c "SELECT COUNT(*) FROM listings"
```

## Troubleshooting

**Error: "psql: command not found"**
```bash
# Install PostgreSQL client
# macOS:
brew install postgresql

# Linux:
sudo apt-get install postgresql-client
```

**Error: "connection refused"**
- Check Railway Postgres service is active
- Verify DATABASE_URL is correct
- Ensure no firewall blocking port 5432

## Success Criteria

✅ All must pass:
- [ ] psql connects successfully
- [ ] All 3 tables exist (listings, price_history, scraper_errors)
- [ ] Can run SELECT queries
- [ ] Schema shows test listing (if fresh DB)

## Next: Phase 3
Once Postgres verified, you're ready to deploy API service.
