"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const pg_1 = __importDefault(require("pg"));
const { Pool } = pg_1.default;
const app = (0, express_1.default)();
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
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
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
