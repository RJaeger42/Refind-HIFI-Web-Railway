# Hi-Fi Deals Aggregator - Detailed Deployment Plan

## Table of Contents
1. [Railway Setup](#railway-setup)
2. [Database Setup](#database-setup)
3. [Python Scrapers Service](#python-scrapers-service)
4. [Node Scrapers Service](#node-scrapers-service)
5. [Backend API Service](#backend-api-service)
6. [Frontend Service](#frontend-service)
7. [Deployment Steps](#deployment-steps)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting](#troubleshooting)

---

## Railway Setup

### Prerequisites
```bash
# Install Railway CLI
npm install -g @railway/cli

# Or using brew (macOS)
brew install railway

# Login to Railway
railway login
```

### Create New Project
```bash
# Create project
railway init

# Link to existing project (if already created)
railway link
```

---

## Database Setup

### 1. Create Postgres Database

**Via Railway Dashboard:**
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Provision PostgreSQL"
4. Database will be created automatically

**Via CLI:**
```bash
railway add --database postgres
```

### 2. Get Database Connection

Railway automatically provides `DATABASE_URL` environment variable.

Format: `postgresql://user:password@host:port/database`

### 3. Initialize Schema

**Connect to database:**
```bash
railway connect postgres
```

**Run schema SQL:**
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
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_listing_id ON price_history(listing_id);
CREATE INDEX idx_timestamp ON price_history(timestamp);

-- Optional: Create a view for latest prices
CREATE VIEW latest_listings AS
SELECT DISTINCT ON (url) *
FROM listings
ORDER BY url, scraped_at DESC;
```

---

## Python Scrapers Service

### Directory Structure
```
python-scrapers/
├── Dockerfile
├── requirements.txt
├── crontab
├── scrapers/
│   ├── scraper1.py
│   ├── scraper2.py
│   ├── scraper3.py
│   └── ...
└── railway.json
```

### Dockerfile
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    cron \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy scraper scripts
COPY scrapers/ ./scrapers/

# Setup cron
COPY crontab /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron && \
    crontab /etc/cron.d/scraper-cron && \
    touch /var/log/cron.log

# Start cron in foreground
CMD cron && tail -f /var/log/cron.log
```

### requirements.txt
```txt
psycopg2-binary==2.9.9
requests==2.31.0
beautifulsoup4==4.12.2
lxml==4.9.3
python-dotenv==1.0.0
```

### crontab
```cron
# Run Python scrapers every 6 hours
0 */6 * * * cd /app && python scrapers/scraper1.py >> /var/log/cron.log 2>&1
15 */6 * * * cd /app && python scrapers/scraper2.py >> /var/log/cron.log 2>&1
30 */6 * * * cd /app && python scrapers/scraper3.py >> /var/log/cron.log 2>&1
# Add more scrapers with staggered times (15 min apart) to avoid rate limiting
```

### Example Scraper Template (scraper1.py)
```python
import os
import psycopg2
from datetime import datetime
import requests
from bs4 import BeautifulSoup

DATABASE_URL = os.environ.get('DATABASE_URL')

def scrape_site():
    """
    Your existing scraping logic here.
    Returns list of dictionaries with scraped data.
    """
    results = []
    
    # Example scraping logic (replace with your actual code)
    try:
        response = requests.get('https://example.com/listings')
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Parse listings
        # ... your scraping logic ...
        
        # Example result structure
        results.append({
            'product': 'McIntosh MC275',
            'price': 4500.00,
            'condition': 'Excellent',
            'url': 'https://example.com/listing/12345',
            'site_source': 'example_site'
        })
        
    except Exception as e:
        print(f"Error scraping: {e}")
    
    return results

def save_to_db(results):
    """Save scraped results to Postgres."""
    if not DATABASE_URL:
        print("ERROR: DATABASE_URL not set")
        return
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        for item in results:
            # Insert with upsert logic
            cur.execute("""
                INSERT INTO listings (product, price, condition, url, site_source, scraped_at)
                VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (url) DO UPDATE 
                SET 
                    price = EXCLUDED.price,
                    condition = EXCLUDED.condition,
                    product = EXCLUDED.product,
                    scraped_at = NOW()
                RETURNING id, price
            """, (
                item['product'],
                item['price'],
                item['condition'],
                item['url'],
                item['site_source']
            ))
            
            listing_id, new_price = cur.fetchone()
            
            # Add to price history
            cur.execute("""
                INSERT INTO price_history (listing_id, price, timestamp)
                VALUES (%s, %s, NOW())
            """, (listing_id, new_price))
        
        conn.commit()
        print(f"Successfully saved {len(results)} listings")
        
    except Exception as e:
        print(f"Database error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == '__main__':
    print(f"Starting scraper at {datetime.now()}")
    results = scrape_site()
    print(f"Scraped {len(results)} items")
    
    if results:
        save_to_db(results)
    
    print(f"Finished at {datetime.now()}")
```

### railway.json (optional config)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

---

## Node Scrapers Service

### Directory Structure
```
node-scrapers/
├── Dockerfile
├── package.json
├── crontab
├── scrapers/
│   ├── scraper1.js
│   ├── scraper2.js
│   ├── scraper3.js
│   └── ...
└── railway.json
```

### Dockerfile
```dockerfile
FROM node:18-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    cron \
    && rm -rf /var/lib/apt/lists/*

# Install Node dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy scraper scripts
COPY scrapers/ ./scrapers/

# Setup cron
COPY crontab /etc/cron.d/scraper-cron
RUN chmod 0644 /etc/cron.d/scraper-cron && \
    crontab /etc/cron.d/scraper-cron && \
    touch /var/log/cron.log

# Start cron in foreground
CMD cron && tail -f /var/log/cron.log
```

### package.json
```json
{
  "name": "hifi-scrapers-node",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "pg": "^8.11.3",
    "axios": "^1.6.2",
    "cheerio": "^1.0.0-rc.12",
    "dotenv": "^16.3.1"
  }
}
```

### crontab
```cron
# Run Node scrapers every 6 hours (offset from Python scrapers)
45 */6 * * * cd /app && node scrapers/scraper1.js >> /var/log/cron.log 2>&1
0 1-23/6 * * * cd /app && node scrapers/scraper2.js >> /var/log/cron.log 2>&1
15 1-23/6 * * * cd /app && node scrapers/scraper3.js >> /var/log/cron.log 2>&1
# Add more scrapers with staggered times
```

### Example Scraper Template (scraper1.js)
```javascript
import pg from 'pg';
import axios from 'axios';
import * as cheerio from 'cheerio';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function scrapeSite() {
  /**
   * Your existing scraping logic here.
   * Returns array of objects with scraped data.
   */
  const results = [];
  
  try {
    const response = await axios.get('https://example.com/listings');
    const $ = cheerio.load(response.data);
    
    // Parse listings
    // ... your scraping logic ...
    
    // Example result structure
    results.push({
      product: 'Klipsch Heresy IV',
      price: 3200.00,
      condition: 'New',
      url: 'https://example.com/listing/67890',
      site_source: 'example_site'
    });
    
  } catch (error) {
    console.error('Error scraping:', error.message);
  }
  
  return results;
}

async function saveToDB(results) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    for (const item of results) {
      // Insert with upsert logic
      const insertResult = await client.query(`
        INSERT INTO listings (product, price, condition, url, site_source, scraped_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (url) DO UPDATE 
        SET 
          price = EXCLUDED.price,
          condition = EXCLUDED.condition,
          product = EXCLUDED.product,
          scraped_at = NOW()
        RETURNING id, price
      `, [item.product, item.price, item.condition, item.url, item.site_source]);
      
      const { id: listingId, price: newPrice } = insertResult.rows[0];
      
      // Add to price history
      await client.query(`
        INSERT INTO price_history (listing_id, price, timestamp)
        VALUES ($1, $2, NOW())
      `, [listingId, newPrice]);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully saved ${results.length} listings`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Database error:', error.message);
  } finally {
    client.release();
  }
}

async function main() {
  console.log(`Starting scraper at ${new Date().toISOString()}`);
  
  const results = await scrapeSite();
  console.log(`Scraped ${results.length} items`);
  
  if (results.length > 0) {
    await saveToDB(results);
  }
  
  console.log(`Finished at ${new Date().toISOString()}`);
  await pool.end();
  process.exit(0);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

---

## Backend API Service

### Directory Structure
```
api/
├── Dockerfile
├── package.json
├── server.js
├── routes/
│   └── listings.js
└── railway.json
```

### Dockerfile
```dockerfile
FROM node:18-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
```

### package.json
```json
{
  "name": "hifi-api",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "compression": "^1.7.4"
  }
}
```

### server.js
```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import pg from 'pg';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 3000;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all listings with filters
app.get('/api/listings', async (req, res) => {
  try {
    const { 
      min_price, 
      max_price, 
      site, 
      search, 
      limit = 100,
      offset = 0 
    } = req.query;
    
    let query = 'SELECT * FROM listings WHERE 1=1';
    const params = [];
    let paramCount = 0;
    
    // Apply filters
    if (min_price) {
      paramCount++;
      params.push(parseFloat(min_price));
      query += ` AND price >= $${paramCount}`;
    }
    
    if (max_price) {
      paramCount++;
      params.push(parseFloat(max_price));
      query += ` AND price <= $${paramCount}`;
    }
    
    if (site) {
      paramCount++;
      params.push(site);
      query += ` AND site_source = $${paramCount}`;
    }
    
    if (search) {
      paramCount++;
      params.push(`%${search}%`);
      query += ` AND product ILIKE $${paramCount}`;
    }
    
    // Add ordering and pagination
    query += ' ORDER BY scraped_at DESC';
    
    paramCount++;
    params.push(parseInt(limit) || 100);
    query += ` LIMIT $${paramCount}`;
    
    paramCount++;
    params.push(parseInt(offset) || 0);
    query += ` OFFSET $${paramCount}`;
    
    const result = await pool.query(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM listings WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;
    
    if (min_price) {
      countParamCount++;
      countParams.push(parseFloat(min_price));
      countQuery += ` AND price >= $${countParamCount}`;
    }
    if (max_price) {
      countParamCount++;
      countParams.push(parseFloat(max_price));
      countQuery += ` AND price <= $${countParamCount}`;
    }
    if (site) {
      countParamCount++;
      countParams.push(site);
      countQuery += ` AND site_source = $${countParamCount}`;
    }
    if (search) {
      countParamCount++;
      countParams.push(`%${search}%`);
      countQuery += ` AND product ILIKE $${countParamCount}`;
    }
    
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
    
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single listing by ID
app.get('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM listings WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error fetching listing:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get price history for a listing
app.get('/api/listings/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM price_history 
       WHERE listing_id = $1 
       ORDER BY timestamp DESC 
       LIMIT 100`,
      [id]
    );
    
    res.json(result.rows);
    
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available sites/sources
app.get('/api/sites', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT site_source FROM listings ORDER BY site_source'
    );
    
    res.json(result.rows.map(row => row.site_source));
    
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_listings,
        COUNT(DISTINCT site_source) as total_sites,
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price,
        MAX(scraped_at) as last_scrape
      FROM listings
    `);
    
    res.json(result.rows[0]);
    
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});
```

---

## Frontend Service

### Directory Structure
```
frontend/
├── Dockerfile
├── nginx.conf
├── package.json
├── public/
│   └── index.html
└── src/
    ├── App.js
    ├── index.js
    ├── components/
    │   ├── ListingCard.js
    │   ├── FilterBar.js
    │   └── Stats.js
    └── styles/
        └── App.css
```

### Dockerfile (Multi-stage build)
```dockerfile
# Build stage
FROM node:18-slim AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf
```nginx
server {
    listen 80;
    server_name _;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy (replace with your Railway API URL)
    location /api {
        proxy_pass https://hifi-api.up.railway.app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### package.json
```json
{
  "name": "hifi-frontend",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.2"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "devDependencies": {
    "react-scripts": "5.0.1"
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}
```

### src/App.js
```javascript
import React, { useState, useEffect } from 'react';
import './styles/App.css';

const API_URL = process.env.REACT_APP_API_URL || '/api';

function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [sites, setSites] = useState([]);
  
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    search: '',
    site: ''
  });

  // Fetch listings
  useEffect(() => {
    fetchListings();
    fetchStats();
    fetchSites();
  }, [filters]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.search) params.append('search', filters.search);
      if (filters.site) params.append('site', filters.site);
      
      const response = await fetch(`${API_URL}/listings?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      setListings(data.data || data);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_URL}/stats`);
      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchSites = async () => {
    try {
      const response = await fetch(`${API_URL}/sites`);
      const data = await response.json();
      setSites(data);
    } catch (err) {
      console.error('Error fetching sites:', err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      search: '',
      site: ''
    });
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Hi-Fi Deals Aggregator</h1>
        {stats && (
          <div className="stats">
            <span>{stats.total_listings} listings</span>
            <span>{stats.total_sites} sites</span>
            <span>Avg: ${parseFloat(stats.avg_price).toFixed(2)}</span>
          </div>
        )}
      </header>

      <div className="filters">
        <input 
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
        />
        
        <input 
          type="number"
          placeholder="Min Price"
          value={filters.minPrice}
          onChange={(e) => handleFilterChange('minPrice', e.target.value)}
        />
        
        <input 
          type="number"
          placeholder="Max Price"
          value={filters.maxPrice}
          onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
        />
        
        <select 
          value={filters.site}
          onChange={(e) => handleFilterChange('site', e.target.value)}
        >
          <option value="">All Sites</option>
          {sites.map(site => (
            <option key={site} value={site}>{site}</option>
          ))}
        </select>
        
        <button onClick={clearFilters}>Clear Filters</button>
      </div>

      <main className="content">
        {loading && <div className="loading">Loading...</div>}
        
        {error && <div className="error">Error: {error}</div>}
        
        {!loading && !error && listings.length === 0 && (
          <div className="empty">No listings found</div>
        )}
        
        {!loading && !error && listings.length > 0 && (
          <div className="listings-grid">
            {listings.map(listing => (
              <div key={listing.id} className="listing-card">
                <h3>{listing.product}</h3>
                <div className="price">${parseFloat(listing.price).toFixed(2)}</div>
                <div className="condition">{listing.condition}</div>
                <div className="meta">
                  <span className="site">{listing.site_source}</span>
                  <span className="date">
                    {new Date(listing.scraped_at).toLocaleDateString()}
                  </span>
                </div>
                <a 
                  href={listing.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="view-link"
                >
                  View Deal →
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
```

### src/styles/App.css
```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f5f5f5;
  color: #333;
}

.App {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: #2c3e50;
  color: white;
  padding: 2rem;
  text-align: center;
}

.header h1 {
  margin-bottom: 1rem;
}

.stats {
  display: flex;
  gap: 2rem;
  justify-content: center;
  font-size: 0.9rem;
}

.filters {
  background: white;
  padding: 1.5rem;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  border-bottom: 1px solid #ddd;
}

.filters input,
.filters select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.filters input[type="text"] {
  flex: 2;
  min-width: 200px;
}

.filters input[type="number"],
.filters select {
  flex: 1;
  min-width: 120px;
}

.filters button {
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.filters button:hover {
  background: #2980b9;
}

.content {
  flex: 1;
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.loading,
.error,
.empty {
  text-align: center;
  padding: 3rem;
  font-size: 1.2rem;
}

.error {
  color: #e74c3c;
}

.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.listing-card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.listing-card h3 {
  margin-bottom: 1rem;
  color: #2c3e50;
  font-size: 1.1rem;
}

.price {
  font-size: 1.5rem;
  font-weight: bold;
  color: #27ae60;
  margin-bottom: 0.5rem;
}

.condition {
  color: #7f8c8d;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  font-size: 0.85rem;
  color: #95a5a6;
}

.view-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #3498db;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  transition: background 0.2s;
}

.view-link:hover {
  background: #2980b9;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
  }
  
  .filters input,
  .filters select {
    width: 100%;
  }
  
  .listings-grid {
    grid-template-columns: 1fr;
  }
  
  .stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

---

## Deployment Steps

### Step-by-Step Deployment

#### 1. Setup Railway Project
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init
```

#### 2. Deploy Database
```bash
# Add Postgres to project
railway add --database postgres

# Connect to database
railway connect postgres

# Run schema SQL (paste the CREATE TABLE statements)
```

#### 3. Deploy Python Scrapers
```bash
cd python-scrapers/

# Create new service
railway up

# Set environment variables in Railway dashboard:
# DATABASE_URL (automatically added by Railway)

# Verify deployment
railway logs
```

#### 4. Deploy Node Scrapers
```bash
cd node-scrapers/

# Create new service
railway up

# Set environment variables in Railway dashboard:
# DATABASE_URL (automatically added by Railway)

# Verify deployment
railway logs
```

#### 5. Deploy Backend API
```bash
cd api/

# Create new service
railway up

# Set environment variables:
# DATABASE_URL (automatically added)
# PORT (Railway provides this)

# Get the public URL from Railway dashboard
# Example: https://hifi-api.up.railway.app

# Verify deployment
railway logs

# Test API
curl https://your-api-url.up.railway.app/health
```

#### 6. Deploy Frontend
```bash
cd frontend/

# Update nginx.conf with your actual API URL
# Replace: proxy_pass https://hifi-api.up.railway.app;
# With your actual Railway API URL

# Create new service
railway up

# Verify deployment
railway logs

# Open in browser (get URL from Railway dashboard)
```

---

## Testing & Verification

### 1. Database Verification
```bash
# Connect to database
railway connect postgres

# Check tables exist
\dt

# Check if any data exists
SELECT COUNT(*) FROM listings;
SELECT COUNT(*) FROM price_history;

# View recent listings
SELECT * FROM listings ORDER BY scraped_at DESC LIMIT 10;
```

### 2. Scraper Verification
```bash
# Check Python scraper logs
railway logs --service python-scrapers

# Check Node scraper logs
railway logs --service node-scrapers

# Should see output like:
# "Starting scraper at..."
# "Scraped X items"
# "Successfully saved X listings"
```

### 3. API Verification
```bash
# Test health endpoint
curl https://your-api-url.up.railway.app/health

# Test listings endpoint
curl https://your-api-url.up.railway.app/api/listings

# Test with filters
curl "https://your-api-url.up.railway.app/api/listings?min_price=100&max_price=1000"

# Test stats
curl https://your-api-url.up.railway.app/api/stats

# Test sites
curl https://your-api-url.up.railway.app/api/sites
```

### 4. Frontend Verification
1. Open frontend URL in browser
2. Check if listings load
3. Test filters (search, price range, site filter)
4. Click "View Deal" links - should open in new tab
5. Test responsive design on mobile

---

## Troubleshooting

### Scrapers Not Running
**Problem**: No data appearing in database

**Solutions**:
1. Check Railway logs for errors
2. Verify DATABASE_URL is set correctly
3. Check cron is running: `railway run ps aux | grep cron`
4. Manually run a scraper: `railway run python scrapers/scraper1.py`
5. Check if scraper is actually scraping data (print statements)

### Database Connection Issues
**Problem**: "Connection refused" or timeout errors

**Solutions**:
1. Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
2. Check SSL settings (Railway requires SSL)
3. Test connection: `railway run psql $DATABASE_URL`
4. Check firewall/network settings in Railway

### API Not Responding
**Problem**: 500 errors or timeouts

**Solutions**:
1. Check Railway logs: `railway logs --service api`
2. Verify DATABASE_URL is set
3. Check database connection pool settings
4. Test database query directly
5. Check if PORT environment variable is set correctly

### Frontend Not Loading Data
**Problem**: Empty listings or errors in browser console

**Solutions**:
1. Check browser console for errors
2. Verify API URL in nginx.conf
3. Check CORS settings in API
4. Test API endpoint directly with curl
5. Check network tab in browser dev tools

### Cron Jobs Not Running
**Problem**: Scrapers scheduled but not executing

**Solutions**:
1. Verify crontab file format (no syntax errors)
2. Check cron is running: `ps aux | grep cron`
3. Check cron logs: `tail -f /var/log/cron.log`
4. Verify file permissions on crontab
5. Test manual execution first

### Railway-Specific Issues

**Services Won't Deploy**:
- Check Dockerfile syntax
- Verify all required files are present
- Check build logs in Railway dashboard
- Try deploying with `railway up --verbose`

**High Resource Usage**:
- Monitor usage in Railway dashboard
- Optimize scraper frequency
- Add delays between requests in scrapers
- Consider upgrading Railway plan

**Environment Variables Not Working**:
- Verify variables are set in Railway dashboard
- Check variable names (case-sensitive)
- Restart service after changing variables
- Use `railway variables` to list all variables

### Getting Help
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app
- Check Railway status: https://status.railway.app

---

## Monitoring & Maintenance

### Regular Checks
1. **Daily**: Check if scrapers are running (view Railway logs)
2. **Weekly**: Check database size and clean old data if needed
3. **Monthly**: Review Railway usage and costs

### Database Maintenance
```sql
-- Remove duplicates (keep most recent)
DELETE FROM listings a USING listings b
WHERE a.id < b.id AND a.url = b.url;

-- Clean old price history (older than 90 days)
DELETE FROM price_history 
WHERE timestamp < NOW() - INTERVAL '90 days';

-- Vacuum database
VACUUM ANALYZE;
```

### Log Monitoring
```bash
# Stream logs from all services
railway logs --follow

# Filter by service
railway logs --service python-scrapers

# Export logs
railway logs > logs.txt
```

---

## Next Steps After MVP

1. **Add authentication** (when going multi-user)
2. **Implement caching** (Redis on Railway)
3. **Add email alerts** (SendGrid or similar)
4. **Implement rate limiting** in API
5. **Add analytics** (PostHog, Plausible)
6. **Set up monitoring** (Sentry for errors)
7. **Add AI features** (price analysis, smart search)
8. **Optimize database** (indexes, partitioning)
9. **Add tests** (unit tests, integration tests)
10. **Setup CI/CD** (GitHub Actions + Railway)

---

## Cost Estimates (Railway)

**Starter Plan ($5/month)**:
- 512 MB RAM per service
- $5 of usage included
- Additional usage: ~$0.000231/GB-hour

**Expected costs for MVP**:
- 5 services running 24/7
- Low resource usage
- Estimate: $5-15/month total

**To reduce costs**:
- Run scrapers less frequently
- Use Railway's sleep feature for unused services
- Optimize database queries
- Implement better caching

---

## Project Checklist

### Pre-Deployment
- [ ] Railway account created
- [ ] Railway CLI installed
- [ ] All scraper code ready
- [ ] Database schema prepared
- [ ] Environment variables documented

### Deployment
- [ ] Database created and schema applied
- [ ] Python scrapers deployed
- [ ] Node scrapers deployed
- [ ] Backend API deployed
- [ ] Frontend deployed
- [ ] All services connected to database

### Verification
- [ ] Database has data
- [ ] Scrapers running on schedule
- [ ] API endpoints responding
- [ ] Frontend loading and functional
- [ ] Filters working correctly
- [ ] Links opening correctly

### Post-Deployment
- [ ] Monitor logs for errors
- [ ] Check scraper frequency is appropriate
- [ ] Verify data quality
- [ ] Test from multiple devices
- [ ] Document any issues
- [ ] Plan next features

---

## Support & Resources

- **Railway Documentation**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Railway Status**: https://status.railway.app
- **Railway Blog**: https://blog.railway.app

**This completes your comprehensive deployment plan for Railway.app!**