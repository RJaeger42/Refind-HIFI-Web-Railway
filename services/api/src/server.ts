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
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
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
    const params: any[] = [];
    let paramCount = 0;

    // Apply filters
    if (min_price) {
      paramCount++;
      params.push(parseFloat(min_price as string));
      query += ` AND price >= $${paramCount}`;
    }

    if (max_price) {
      paramCount++;
      params.push(parseFloat(max_price as string));
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
    params.push(parseInt(limit as string) || 100);
    query += ` LIMIT $${paramCount}`;

    paramCount++;
    params.push(parseInt(offset as string) || 0);
    query += ` OFFSET $${paramCount}`;

    const result = await pool.query(query, params);

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) FROM listings WHERE 1=1';
    const countParams: any[] = [];
    let countParamCount = 0;

    if (min_price) {
      countParamCount++;
      countParams.push(parseFloat(min_price as string));
      countQuery += ` AND price >= $${countParamCount}`;
    }
    if (max_price) {
      countParamCount++;
      countParams.push(parseFloat(max_price as string));
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
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: (parseInt(offset as string) + parseInt(limit as string)) < total
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

// Trigger scraper manually
app.post('/api/scrape/trigger', async (req, res) => {
  try {
    const { container } = req.body;
    const secret = process.env.WEBHOOK_SECRET || 'change-me-in-production';

    if (!['heavy', 'light', 'all'].includes(container)) {
      return res.status(400).json({ error: 'Invalid container. Must be: heavy, light, or all' });
    }

    const results: any[] = [];

    // Trigger heavy scrapers
    if (container === 'heavy' || container === 'all') {
      try {
        const response = await fetch('http://scrapers-heavy.railway.internal:3001/trigger', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        results.push({ container: 'heavy', success: response.ok, data });
      } catch (error: any) {
        results.push({ container: 'heavy', success: false, error: error.message });
      }
    }

    // Trigger light scrapers
    if (container === 'light' || container === 'all') {
      try {
        const response = await fetch('http://scrapers.railway.internal:3001/trigger', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${secret}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        results.push({ container: 'light', success: response.ok, data });
      } catch (error: any) {
        results.push({ container: 'light', success: false, error: error.message });
      }
    }

    res.json({ triggered: true, results });

  } catch (error) {
    console.error('Error triggering scrapers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get scraper status
app.get('/api/scrape/status', async (req, res) => {
  try {
    const results: any = {};

    // Get heavy scraper status
    try {
      const response = await fetch('http://scrapers-heavy.railway.internal:3001/status');
      results.heavy = await response.json();
    } catch (error: any) {
      results.heavy = { error: error.message };
    }

    // Get light scraper status
    try {
      const response = await fetch('http://scrapers.railway.internal:3001/status');
      results.light = await response.json();
    } catch (error: any) {
      results.light = { error: error.message };
    }

    res.json(results);

  } catch (error) {
    console.error('Error fetching scraper status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server - bind to 0.0.0.0 for Docker/Railway
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});
