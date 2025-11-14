"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startWebhookServer = startWebhookServer;
const express_1 = __importDefault(require("express"));
const scrape_1 = require("./scrape");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.WEBHOOK_PORT || '3001', 10);
const SECRET = process.env.WEBHOOK_SECRET || 'change-me-in-production';
app.use(express_1.default.json());
let isRunning = false;
let lastRun = null;
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
        await (0, scrape_1.runAllScrapers)();
        lastRun = new Date();
    }
    catch (error) {
        console.error('Webhook trigger error:', error);
    }
    finally {
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
function startWebhookServer() {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Webhook server listening on port ${PORT}`);
    });
}
