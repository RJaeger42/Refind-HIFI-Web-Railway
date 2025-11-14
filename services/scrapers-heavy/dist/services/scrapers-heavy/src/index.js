"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cron_1 = require("./cron");
const webhook_1 = require("./webhook");
// Start both cron service and webhook server
(0, cron_1.startCronService)();
(0, webhook_1.startWebhookServer)();
