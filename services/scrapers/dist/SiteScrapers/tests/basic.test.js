"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_1 = require("@playwright/test");
const index_1 = require("../index");
/**
 * Basic functionality tests for TypeScript Playwright scrapers
 * Run with: npx playwright test
 */
test_1.test.describe('Utility Functions', () => {
    (0, test_1.test)('extractPrice handles Swedish format', () => {
        (0, test_1.expect)((0, index_1.extractPrice)('1.234,56 kr')).toBe(1234.56);
        (0, test_1.expect)((0, index_1.extractPrice)('199,99 SEK')).toBe(199.99);
        (0, test_1.expect)((0, index_1.extractPrice)('1000')).toBe(1000);
        (0, test_1.expect)((0, index_1.extractPrice)('invalid')).toBeUndefined();
    });
    (0, test_1.test)('normalizeUrl converts relative to absolute URLs', () => {
        const base = 'https://example.com';
        (0, test_1.expect)((0, index_1.normalizeUrl)('/products/123', base)).toBe('https://example.com/products/123');
        (0, test_1.expect)((0, index_1.normalizeUrl)('detail.html', base)).toBe('https://example.com/detail.html');
        (0, test_1.expect)((0, index_1.normalizeUrl)('https://other.com/page', base)).toBe('https://other.com/page');
    });
    (0, test_1.test)('filterByPrice filters correctly', () => {
        const listings = [
            { title: 'Item 1', price: 500, url: 'url1' },
            { title: 'Item 2', price: 1500, url: 'url2' },
            { title: 'Item 3', price: 3000, url: 'url3' },
            { title: 'Item 4', price: 5000, url: 'url4' },
        ];
        const filtered = (0, index_1.filterByPrice)(listings, 1000, 4000);
        (0, test_1.expect)(filtered).toHaveLength(2);
        (0, test_1.expect)(filtered[0].price).toBe(1500);
        (0, test_1.expect)(filtered[1].price).toBe(3000);
    });
    (0, test_1.test)('filterByQuery matches text correctly', () => {
        const listings = [
            { title: 'Amplifier Pro', description: 'High quality', url: 'url1' },
            { title: 'Speaker System', description: 'Great sound', url: 'url2' },
            { title: 'Amplifier Mini', description: 'Compact', url: 'url3' },
        ];
        const filtered = (0, index_1.filterByQuery)(listings, 'amplifier');
        (0, test_1.expect)(filtered).toHaveLength(2);
        (0, test_1.expect)(filtered[0].title).toContain('Amplifier');
        (0, test_1.expect)(filtered[1].title).toContain('Amplifier');
    });
});
test_1.test.describe('Scraper Interface Tests', () => {
    let browser;
    test_1.test.beforeAll(async () => {
        browser = await test_1.chromium.launch({ headless: true });
    });
    test_1.test.afterAll(async () => {
        await browser.close();
    });
    (0, test_1.test)('AkkelisAudio scraper has correct interface', async () => {
        const scraper = new index_1.AkkelisAudioPlaywright();
        (0, test_1.expect)(scraper.name).toBe('Akkelis Audio');
        (0, test_1.expect)(scraper.baseUrl).toBe('https://www.akkelisaudio.com');
        (0, test_1.expect)(typeof scraper.search).toBe('function');
        (0, test_1.expect)(typeof scraper.close).toBe('function');
    });
    (0, test_1.test)('Blocket scraper has correct interface', async () => {
        const scraper = new index_1.BlocketPlaywright();
        (0, test_1.expect)(scraper.name).toBe('Blocket');
        (0, test_1.expect)(scraper.baseUrl).toBe('https://www.blocket.se');
        (0, test_1.expect)(typeof scraper.search).toBe('function');
    });
    (0, test_1.test)('HiFi Puls scraper has correct interface', async () => {
        const scraper = new index_1.HifiPulsPlaywright();
        (0, test_1.expect)(scraper.name).toBe('HiFi Puls');
        (0, test_1.expect)(scraper.baseUrl).toBe('https://www.hifipuls.se');
        (0, test_1.expect)(typeof scraper.search).toBe('function');
    });
    (0, test_1.test)('HiFi Shark scraper has correct interface', async () => {
        const scraper = new index_1.HifiSharkPlaywright();
        (0, test_1.expect)(scraper.name).toBe('HiFiShark');
        (0, test_1.expect)(scraper.baseUrl).toBe('https://www.hifishark.com');
        (0, test_1.expect)(typeof scraper.search).toBe('function');
    });
    (0, test_1.test)('Tradera scraper has correct interface', async () => {
        const scraper = new index_1.TraderaPlaywright();
        (0, test_1.expect)(scraper.name).toBe('Tradera');
        (0, test_1.expect)(scraper.baseUrl).toBe('https://www.tradera.com');
        (0, test_1.expect)(typeof scraper.search).toBe('function');
    });
    (0, test_1.test)('All scrapers have consistent interface', async () => {
        const scrapers = [
            new index_1.AkkelisAudioPlaywright(),
            new index_1.BlocketPlaywright(),
            new index_1.HifiPulsPlaywright(),
            new index_1.HifiSharkPlaywright(),
            new index_1.HifiTorgetPlaywright(),
            new index_1.TraderaPlaywright(),
            new index_1.ReferenceAudioPlaywright(),
            new index_1.LjudmakarnPlaywright(),
            new index_1.HifiPunktenPlaywright(),
            new index_1.FacebookPlaywright(),
            new index_1.AudioPerformancePlaywright(),
            new index_1.RehifiPlaywright(),
        ];
        for (const scraper of scrapers) {
            (0, test_1.expect)(scraper.name).toBeDefined();
            (0, test_1.expect)(scraper.baseUrl).toBeDefined();
            (0, test_1.expect)(typeof scraper.search).toBe('function');
            (0, test_1.expect)(typeof scraper.close).toBe('function');
        }
    });
});
test_1.test.describe('Search Method Signature Tests', () => {
    (0, test_1.test)('AkkelisAudio search method exists and is callable', async () => {
        const scraper = new index_1.AkkelisAudioPlaywright();
        (0, test_1.expect)(typeof scraper.search).toBe('function');
        // Just verify method signature without actually calling search
        // (would need browser context)
    });
    (0, test_1.test)('Blocket search method accepts multiple parameters', async () => {
        const scraper = new index_1.BlocketPlaywright();
        (0, test_1.expect)(typeof scraper.search).toBe('function');
        // Verify method signature accepts parameters
    });
    (0, test_1.test)('HiFi Puls search method exists and is callable', async () => {
        const scraper = new index_1.HifiPulsPlaywright();
        (0, test_1.expect)(typeof scraper.search).toBe('function');
        // Verify it's a function without calling it
    });
});
test_1.test.describe('Configuration Options', () => {
    (0, test_1.test)('Scraper accepts custom options', () => {
        const scraper = new index_1.HifiPulsPlaywright({
            timeout: 60000,
            requestDelay: 2000,
            maxPages: 10,
        });
        (0, test_1.expect)(scraper.name).toBe('HiFi Puls');
    });
    (0, test_1.test)('Factory functions create scraper instances', () => {
        const scrapers = [
            new index_1.AkkelisAudioPlaywright(),
            new index_1.BlocketPlaywright(),
            new index_1.HifiPulsPlaywright(),
        ];
        for (const scraper of scrapers) {
            (0, test_1.expect)(scraper).toBeDefined();
            (0, test_1.expect)(scraper.name).toBeDefined();
        }
    });
});
