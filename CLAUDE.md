# Hi-Fi Deals Aggregator - Project Memory

## Project Overview
Building a HiFiShark-style deal aggregator for personal use. Scraping hi-fi equipment listings from multiple sites, storing in Postgres, displaying via web frontend. This is an MVP for learning the architecture before potentially scaling to multi-user.

## Business Context
- **Current Goal**: Personal use MVP - build to understand how it works
- **Future Goal**: Multi-user platform (HiFiShark on steroids)
- **Monetization**: Not a priority for MVP (considered: affiliate links, ads - skipped for now)
- **Value Proposition**: Better UI, notifications, AI-infused search capabilities

## Tech Stack
- **Hosting**: Railway.app (all services)
- **Database**: Postgres on Railway
- **Scrapers**: 15 existing Node.js scrapers
- **Backend API**: Node.js/Express
- **Frontend**: React with Nginx
- **Scheduling**: Cron (within containers)

## Architecture - 4 Services on Railway

### Service 1: Postgres Database
- Railway Postgres plugin
- Stores listings and price history
- Connection string shared across all services via environment variables
- Automatic backups provided by Railway

### Service 2: Node Scrapers Service
- Runs all 15 Node.js scrapers on cron schedule
- Pushes data directly to Postgres
- Schedule: Every 6 hours (configurable)
- Supports manual trigger via API endpoint

### Service 3: Backend API Service
- Express REST API
- Endpoints: 
  - GET /api/listings (with filters: min_price, max_price, site, search)
  - GET /api/listings/:id/history
  - POST /api/scrape/trigger (manual scraper trigger)
  - GET /api/scrape/status (scraper status)
- Port: 3000
- Provides data to frontend

### Service 4: Frontend Service
- React SPA with Nginx
- Features: search, price filters, listing display
- Proxies /api requests to backend
- Public-facing web interface

## Database Schema

```sql
-- Main listings table
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  product VARCHAR(500) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  condition VARCHAR(100),
  url VARCHAR(1000) UNIQUE NOT NULL,
  site_source VARCHAR(100) NOT NULL,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_price ON listings(price);
CREATE INDEX idx_scraped_at ON listings(scraped_at);
CREATE INDEX idx_site_source ON listings(site_source);
CREATE INDEX idx_product_search ON listings USING gin(to_tsvector('english', product));

-- Price history tracking
CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  price DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listing_id ON price_history(listing_id);
```

## Key Implementation Requirements

### Scrapers
- Keep existing scraper logic intact
- Add Postgres connection and insert at the end
- Use `ON CONFLICT (url) DO UPDATE` for upserts (prevents duplicates)
- Connect via `DATABASE_URL` environment variable
- Log to stdout for Railway logs
- Each scraper should be idempotent (safe to run multiple times)

### Backend API
- Use connection pooling (pg Pool) for efficiency
- Enable CORS for frontend communication
- Query parameters: min_price, max_price, site, search
- Return max 100 results per query (pagination can be added later)
- Handle errors gracefully with proper HTTP status codes

### Frontend
- Fetch from `/api/listings` on component mount
- Filter changes trigger new API calls
- Display fields: product name, price, condition, site source, link to original
- Simple responsive grid layout
- Loading states and error handling

### Deployment Strategy
1. **First**: Create Postgres database on Railway
2. **Second**: Run schema SQL to create tables and indexes
3. **Third**: Deploy scraper service (it will start populating data)
4. **Fourth**: Deploy backend API
5. **Fifth**: Deploy frontend last (depends on API being available)

### Environment Variables
- `DATABASE_URL`: Postgres connection string (Railway provides this automatically)
- `PORT`: 3000 for API (Railway requires this)
- Set via Railway dashboard for each service

## Contingency Plans

### If IP Blocking Occurs
- Move scrapers to local machine (residential IP)
- Keep same Postgres connection from local to Railway
- Use cron/n8n locally instead of container cron
- Backend + Frontend + Database stay on Railway
- Only scrapers move local

### If Railway Limits Hit
- Scrapers can run less frequently
- Implement smarter caching
- Consider upgrading Railway plan
- Alternative: move to Fly.io or DigitalOcean

## Current Project Status
- ✅ 15 working Node.js scrapers exist
- ⏳ Need to containerize scrapers for Railway
- ⏳ Need to build backend API
- ⏳ Need to build frontend interface
- ⏳ Need to deploy all services to Railway
- ⏳ Need to implement logging system
- ⏳ Need to add testing framework
- ⏳ Need to implement manual scrape trigger

## Development Principles
- Build for personal use first - no users to support
- Keep it simple - avoid over-engineering
- Make it work, then make it better
- No monetization pressure - pure learning exercise
- Add complexity only when needed (YAGNI principle)

## Future Enhancements (Post-MVP)
1. **AI-powered features** (using LLM APIs, not local models):
   - Price intelligence ("20% below market average")
   - Natural language search ("warm tube amp under $2000")
   - Deal scoring and recommendations
   - Smart matching (alternative products)

2. **User features** (when going multi-user):
   - Authentication via Supabase or similar
   - Personal watchlists
   - Price drop alerts (email/push)
   - Saved searches
   - User preferences

3. **Data features**:
   - Historical price graphs
   - Market trends analysis
   - Seller reputation tracking
   - Bundling opportunities

4. **Technical improvements**:
   - Better error handling and retry logic
   - More sophisticated caching
   - Rate limiting for scrapers
   - Monitoring and alerting

## Important Context & Decisions

### Why Railway over Fly.io?
- Initially considered Fly.io
- Switched to Railway for simpler deployment experience
- Railway has better dashboard and easier database setup
- Either platform would work fine

### Why Not Supabase?
- Initially considered Supabase for free Postgres
- Decided against it to reduce external dependencies
- Simpler to have everything in one platform (Railway)
- Supabase auth features not needed for single-user MVP

### Why Not Rust?
- Considered converting TypeScript scrapers to Rust
- Web scraping is I/O bound, not CPU bound
- Rust wouldn't provide meaningful performance improvement
- Python/Node are faster to develop and debug

### Scraper IP Strategy
- Starting with Railway (datacenter IPs)
- If blocked, move scrapers local (residential IP)
- Most hi-fi sites probably won't block
- Implement retry logic and rate limiting as needed

## Technical Notes

### Scraper Integration Pattern
```javascript
// Existing scraper logic
const results = await scrapeWebsite();

// Add Postgres insert
for (const item of results) {
  await pool.query(`
    INSERT INTO listings (product, price, condition, url, site_source, scraped_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (url) DO UPDATE 
    SET price = EXCLUDED.price, scraped_at = NOW()
  `, [item.product, item.price, item.condition, item.url, 'source_name']);
}
```

### Cron Job Pattern
```
# Run every 6 hours
0 */6 * * * cd /app && node scraper.js >> /var/log/cron.log 2>&1
```

### API Query Pattern
```javascript
// With optional filters
GET /api/listings?min_price=100&max_price=500&search=amplifier&site=ebay
```

## User (Rickard) Context
- Building UAP link analysis system (separate project)
- Has iPhone 13 Pro, interested in tech
- Audiophile/hi-fi enthusiast (hence this project)
- Prefers simple explanations without jargon
- Values being challenged when assumptions are wrong
- Wants honest "I don't know" responses
- Show him step by step. He is a novice

## Communication Preferences
- Don't use excessive jargon
- Challenge incorrect assumptions
- Be direct and honest
- Keep explanations practical and actionable
- Focus on solving real problems, not theoretical optimization