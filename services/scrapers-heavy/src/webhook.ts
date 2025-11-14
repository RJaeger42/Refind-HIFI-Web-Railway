import express from 'express';
import { runAllScrapers } from './scrape';

const app = express();
const PORT = process.env.WEBHOOK_PORT || 3001;
const SECRET = process.env.WEBHOOK_SECRET || 'change-me-in-production';

app.use(express.json());

let isRunning = false;
let lastRun: Date | null = null;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'scrapers-heavy',
    isRunning,
    lastRun: lastRun?.toISOString() || null,
  });
});

// Trigger scraping
app.post('/trigger', async (req, res) => {
  const authHeader = req.headers.authorization;
  const providedSecret = authHeader?.replace('Bearer ', '');

  if (providedSecret !== SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (isRunning) {
    return res.status(429).json({ error: 'Scraping already in progress' });
  }

  // Start scraping in background
  isRunning = true;
  res.json({ triggered: true, message: 'Scraping started' });

  try {
    await runAllScrapers();
    lastRun = new Date();
  } catch (error) {
    console.error('Webhook trigger error:', error);
  } finally {
    isRunning = false;
  }
});

// Status endpoint
app.get('/status', (req, res) => {
  res.json({
    service: 'scrapers-heavy',
    isRunning,
    lastRun: lastRun?.toISOString() || null,
  });
});

export function startWebhookServer() {
  app.listen(PORT, () => {
    console.log(`🌐 Webhook server listening on port ${PORT}`);
  });
}
