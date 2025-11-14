-- Add scraper error tracking table
CREATE TABLE IF NOT EXISTS scraper_errors (
  id SERIAL PRIMARY KEY,
  scraper_name VARCHAR(100) NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  occurred_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_errors_name ON scraper_errors(scraper_name);
CREATE INDEX IF NOT EXISTS idx_scraper_errors_occurred ON scraper_errors(occurred_at);

SELECT 'scraper_errors table created successfully!' as status;
