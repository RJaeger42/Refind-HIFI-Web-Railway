import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export interface Listing {
  product: string;
  price: number;
  condition?: string;
  url: string;
  site_source: string;
  description?: string;
  image_url?: string;
  location?: string;
  posted_date?: Date;
}

export async function saveListing(listing: Listing): Promise<void> {
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

export async function saveListings(listings: Listing[]): Promise<number> {
  let saved = 0;
  for (const listing of listings) {
    try {
      await saveListing(listing);
      saved++;
    } catch (error) {
      console.error(`Failed to save listing ${listing.url}:`, error);
    }
  }
  return saved;
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

export async function closeConnection(): Promise<void> {
  await pool.end();
}

export async function logScraperError(scraperName: string, error: Error): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO scraper_errors (scraper_name, error_message, error_stack)
       VALUES ($1, $2, $3)`,
      [scraperName, error.message, error.stack]
    );
  } catch (dbError) {
    console.error('Failed to log scraper error to DB:', dbError);
    // Don't throw - logging errors shouldn't break scraping
  }
}
