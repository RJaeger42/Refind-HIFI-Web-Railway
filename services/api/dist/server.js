"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
console.log('🚀 API Server starting...');
console.log('📍 PORT:', process.env.PORT || 3000);
console.log('📍 NODE_ENV:', process.env.NODE_ENV);
console.log('📍 DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
// Validate required env vars
if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
    console.error('❌ FATAL: DATABASE_URL is not set');
    process.exit(1);
}
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const pg_1 = __importDefault(require("pg"));
console.log('✅ Imports loaded');
const { Pool } = pg_1.default;
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
console.log('✅ Express app created');
// Database connection pool
let pool;
try {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });
    console.log('✅ Database pool created');
    // Test connection
    pool.query('SELECT 1').then(() => {
        console.log('✅ Database connection successful');
    }).catch(err => {
        console.error('❌ Database connection test failed:', err.message);
    });
}
catch (error) {
    console.error('❌ Failed to create database pool:', error);
    throw error;
}
// Middleware
console.log('📦 Loading middleware...');
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
console.log('✅ Middleware loaded');
// Health check endpoint - comprehensive checks
app.get('/health', async (req, res) => {
    const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        checks: {}
    };
    // Check database
    try {
        await pool.query('SELECT 1');
        health.checks.database = 'ok';
    }
    catch (error) {
        health.checks.database = 'failed';
        health.checks.databaseError = error.message;
        health.status = 'degraded';
    }
    // Check scrapers (optional - don't fail health if scrapers are down)
    try {
        const heavyResponse = await fetch('http://scrapers-heavy.railway.internal:3001/health', {
            signal: AbortSignal.timeout(2000)
        });
        health.checks.scrapersHeavy = heavyResponse.ok ? 'ok' : 'failed';
    }
    catch (error) {
        health.checks.scrapersHeavy = 'unreachable';
    }
    try {
        const lightResponse = await fetch('http://scrapers.railway.internal:3001/health', {
            signal: AbortSignal.timeout(2000)
        });
        health.checks.scrapersLight = lightResponse.ok ? 'ok' : 'failed';
    }
    catch (error) {
        health.checks.scrapersLight = 'unreachable';
    }
    const statusCode = health.status === 'ok' ? 200 : 503;
    res.status(statusCode).json(health);
});
// Get all listings with filters
app.get('/api/listings', async (req, res) => {
    try {
        const { min_price, max_price, site, search, limit = 100, offset = 0 } = req.query;
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
    }
    catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get single listing by ID
app.get('/api/listings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM listings WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Listing not found' });
        }
        res.json(result.rows[0]);
    }
    catch (error) {
        console.error('Error fetching listing:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get price history for a listing
app.get('/api/listings/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`SELECT * FROM price_history
       WHERE listing_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`, [id]);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get available sites/sources
app.get('/api/sites', async (req, res) => {
    try {
        const result = await pool.query('SELECT DISTINCT site_source FROM listings ORDER BY site_source');
        res.json(result.rows.map(row => row.site_source));
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get recent scraper errors
app.get('/api/errors', async (req, res) => {
    try {
        const { scraper, limit = 50, offset = 0 } = req.query;
        let query = 'SELECT * FROM scraper_errors WHERE 1=1';
        const params = [];
        let paramCount = 0;
        if (scraper) {
            paramCount++;
            params.push(scraper);
            query += ` AND scraper_name = $${paramCount}`;
        }
        query += ' ORDER BY occurred_at DESC';
        paramCount++;
        params.push(parseInt(limit) || 50);
        query += ` LIMIT $${paramCount}`;
        paramCount++;
        params.push(parseInt(offset) || 0);
        query += ` OFFSET $${paramCount}`;
        const result = await pool.query(query, params);
        // Get summary stats
        const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_errors,
        COUNT(DISTINCT scraper_name) as affected_scrapers,
        MAX(occurred_at) as last_error
      FROM scraper_errors
      WHERE occurred_at > NOW() - INTERVAL '24 hours'
    `);
        res.json({
            errors: result.rows,
            stats: statsResult.rows[0]
        });
    }
    catch (error) {
        console.error('Error fetching scraper errors:', error);
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
        const results = [];
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
            }
            catch (error) {
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
            }
            catch (error) {
                results.push({ container: 'light', success: false, error: error.message });
            }
        }
        res.json({ triggered: true, results });
    }
    catch (error) {
        console.error('Error triggering scrapers:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get scraper status
app.get('/api/scrape/status', async (req, res) => {
    try {
        const results = {};
        // Get heavy scraper status
        try {
            const response = await fetch('http://scrapers-heavy.railway.internal:3001/status');
            results.heavy = await response.json();
        }
        catch (error) {
            results.heavy = { error: error.message };
        }
        // Get light scraper status
        try {
            const response = await fetch('http://scrapers.railway.internal:3001/status');
            results.light = await response.json();
        }
        catch (error) {
            results.light = { error: error.message };
        }
        res.json(results);
    }
    catch (error) {
        console.error('Error fetching scraper status:', error);
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
// Start server - bind to 0.0.0.0 for Docker/Railway
console.log(`🌐 Attempting to start server on port ${PORT}...`);
try {
    const server = app.listen(PORT, '0.0.0.0', () => {
        console.log(`✅ ✅ ✅ API server running on port ${PORT} ✅ ✅ ✅`);
    });
    server.on('error', (error) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${PORT} is already in use`);
        }
        process.exit(1);
    });
}
catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
}
// Process error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, closing server...');
    await pool.end();
    process.exit(0);
});
