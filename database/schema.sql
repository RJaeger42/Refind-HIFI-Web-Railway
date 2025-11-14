-- Hi-Fi Deals Aggregator Database Schema
-- Run this after creating the Postgres database on Railway

-- Main listings table
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  product VARCHAR(500) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  condition VARCHAR(100),
  url VARCHAR(1000) UNIQUE NOT NULL,
  site_source VARCHAR(100) NOT NULL,
  description TEXT,
  image_url VARCHAR(1000),
  location VARCHAR(200),
  posted_date TIMESTAMP,
  scraped_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_scraped_at ON listings(scraped_at);
CREATE INDEX IF NOT EXISTS idx_site_source ON listings(site_source);
CREATE INDEX IF NOT EXISTS idx_product_search ON listings USING gin(to_tsvector('english', product));
CREATE INDEX IF NOT EXISTS idx_created_at ON listings(created_at);

-- Price history tracking
CREATE TABLE IF NOT EXISTS price_history (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
  price DECIMAL(10,2) NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listing_id ON price_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON price_history(timestamp);

-- Scraper error tracking
CREATE TABLE IF NOT EXISTS scraper_errors (
  id SERIAL PRIMARY KEY,
  scraper_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_errors_name ON scraper_errors(scraper_name);
CREATE INDEX IF NOT EXISTS idx_scraper_errors_occurred ON scraper_errors(occurred_at);

-- Optional: Create a view for latest listings (one per URL)
CREATE OR REPLACE VIEW latest_listings AS
SELECT DISTINCT ON (url) *
FROM listings
ORDER BY url, scraped_at DESC;

-- Optional: Create a view for listings with price changes
CREATE OR REPLACE VIEW listings_with_price_history AS
SELECT
  l.*,
  COUNT(ph.id) as price_change_count,
  MIN(ph.price) as lowest_price,
  MAX(ph.price) as highest_price
FROM listings l
LEFT JOIN price_history ph ON l.id = ph.listing_id
GROUP BY l.id;

-- Create a function to automatically add price history on updates
CREATE OR REPLACE FUNCTION track_price_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if price has actually changed
  IF (TG_OP = 'UPDATE' AND OLD.price IS DISTINCT FROM NEW.price) THEN
    INSERT INTO price_history (listing_id, price, timestamp)
    VALUES (NEW.id, NEW.price, NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically track price changes
DROP TRIGGER IF EXISTS track_price_changes_trigger ON listings;
CREATE TRIGGER track_price_changes_trigger
  AFTER UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION track_price_changes();

-- Insert initial test data (optional - for verification)
INSERT INTO listings (product, price, condition, url, site_source, description)
VALUES
  ('Test Amplifier', 1000.00, 'Excellent', 'https://example.com/test-1', 'test_site', 'Test listing to verify database setup')
ON CONFLICT (url) DO NOTHING;

-- Verify setup
SELECT 'Schema created successfully!' as status;
SELECT COUNT(*) as test_listings_count FROM listings;
