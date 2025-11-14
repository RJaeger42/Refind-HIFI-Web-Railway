"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveListing = saveListing;
exports.saveListings = saveListings;
exports.testConnection = testConnection;
exports.closeConnection = closeConnection;
exports.logScraperError = logScraperError;
const pg_1 = require("pg");
// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL && !process.env.DATABASE_PUBLIC_URL) {
    console.error('❌ FATAL: DATABASE_URL is not set');
    process.exit(1);
}
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});
async function saveListing(listing) {
    const query = `
    INSERT INTO listings (product, price, condition, url, site_source, description, image_url, location, posted_date, scraped_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
    ON CONFLICT (url) DO UPDATE
    SET
      price = EXCLUDED.price,
      product = EXCLUDED.product,
      condition = EXCLUDED.condition,
      description = EXCLUDED.description,
      image_url = EXCLUDED.image_url,
      location = EXCLUDED.location,
      posted_date = EXCLUDED.posted_date,
      scraped_at = NOW()
  `;
    await pool.query(query, [
        listing.product,
        listing.price,
        listing.condition,
        listing.url,
        listing.site_source,
        listing.description,
        listing.image_url,
        listing.location,
        listing.posted_date,
    ]);
}
async function saveListings(listings) {
    let saved = 0;
    for (const listing of listings) {
        try {
            await saveListing(listing);
            saved++;
        }
        catch (error) {
            console.error(`Failed to save listing ${listing.url}:`, error);
        }
    }
    return saved;
}
async function testConnection() {
    try {
        const result = await pool.query('SELECT NOW()');
        console.log('✅ Database connected:', result.rows[0].now);
        return true;
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}
async function closeConnection() {
    await pool.end();
}
async function logScraperError(scraperName, error) {
    try {
        await pool.query(`INSERT INTO scraper_errors (scraper_name, error_message, error_stack)
       VALUES ($1, $2, $3)`, [scraperName, error.message, error.stack]);
    }
    catch (dbError) {
        console.error('Failed to log scraper error to DB:', dbError);
        // Don't throw - logging errors shouldn't break scraping
    }
}
