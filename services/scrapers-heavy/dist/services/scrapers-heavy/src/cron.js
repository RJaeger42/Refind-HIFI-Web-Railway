"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCronService = startCronService;
const scrape_1 = require("./scrape");
/**
 * Simple cron-like scheduler
 * Runs scrapers every 6 hours
 */
const INTERVAL_HOURS = 6;
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000;
async function scheduledRun() {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`⏰ Scheduled scraper run triggered`);
    console.log(`${'='.repeat(60)}`);
    try {
        await (0, scrape_1.runAllScrapers)();
    }
    catch (error) {
        console.error('❌ Scheduled run failed:', error);
    }
    console.log(`\n⏰ Next run in ${INTERVAL_HOURS} hours`);
}
async function startCronService() {
    console.log('🚀 Starting Cron Service');
    console.log(`⏰ Schedule: Every ${INTERVAL_HOURS} hours`);
    console.log(`📅 Started at: ${new Date().toISOString()}\n`);
    // Run immediately on startup
    await scheduledRun();
    // Then run on interval
    setInterval(scheduledRun, INTERVAL_MS);
    // Keep process alive
    process.on('SIGTERM', () => {
        console.log('⚠️  SIGTERM received, shutting down gracefully...');
        process.exit(0);
    });
    process.on('SIGINT', () => {
        console.log('⚠️  SIGINT received, shutting down gracefully...');
        process.exit(0);
    });
}
if (require.main === module) {
    startCronService().catch((error) => {
        console.error('❌ Cron service failed to start:', error);
        process.exit(1);
    });
}
