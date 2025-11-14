import { startCronService } from './cron';
import { startWebhookServer } from './webhook';

// Start both cron service and webhook server
startCronService();
startWebhookServer();
