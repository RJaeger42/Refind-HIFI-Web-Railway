#!/usr/bin/env npx ts-node
"use strict";
/**
 * Quick Smoke Test for TypeScript Scrapers
 * Tests basic functionality without hitting real websites
 *
 * Usage:
 *   npx ts-node test-quick.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
const SiteScrapers_1 = require("./SiteScrapers");
console.log('🧪 Starting Quick Smoke Tests...\n');
let passed = 0;
let failed = 0;
function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    }
    catch (error) {
        console.log(`❌ ${name}`);
        console.error(`   ${error instanceof Error ? error.message : error}`);
        failed++;
    }
}
// ============================================================================
// Utility Tests
// ============================================================================
console.log('📚 Testing Utility Functions\n');
test('extractPrice: Swedish format', () => {
    const result = (0, SiteScrapers_1.extractPrice)('1.234,56 kr');
    if (result !== 1234.56)
        throw new Error(`Expected 1234.56, got ${result}`);
});
test('extractPrice: Simple format', () => {
    const result = (0, SiteScrapers_1.extractPrice)('1000');
    if (result !== 1000)
        throw new Error(`Expected 1000, got ${result}`);
});
test('extractPrice: Invalid format', () => {
    const result = (0, SiteScrapers_1.extractPrice)('invalid');
    if (result !== undefined)
        throw new Error(`Expected undefined, got ${result}`);
});
test('normalizeUrl: Relative path', () => {
    const result = (0, SiteScrapers_1.normalizeUrl)('/products/123', 'https://example.com');
    if (!result.includes('example.com') || !result.includes('/products/123')) {
        throw new Error(`Got: ${result}`);
    }
});
test('normalizeUrl: Absolute URL', () => {
    const result = (0, SiteScrapers_1.normalizeUrl)('https://other.com/page', 'https://example.com');
    if (!result.includes('other.com'))
        throw new Error(`Got: ${result}`);
});
test('filterByPrice: Range filtering', () => {
    const listings = [
        { title: 'Item 1', price: 500, url: 'url1' },
        { title: 'Item 2', price: 2000, url: 'url2' },
        { title: 'Item 3', price: 6000, url: 'url3' },
    ];
    const result = (0, SiteScrapers_1.filterByPrice)(listings, 1000, 5000);
    if (result.length !== 1)
        throw new Error(`Expected 1, got ${result.length}`);
    if (result[0].price !== 2000)
        throw new Error(`Expected 2000, got ${result[0].price}`);
});
test('filterByQuery: Text matching', () => {
    const listings = [
        { title: 'Amplifier Pro', url: 'url1' },
        { title: 'Speaker Set', url: 'url2' },
        { title: 'Amplifier Mini', url: 'url3' },
    ];
    const result = (0, SiteScrapers_1.filterByQuery)(listings, 'amplifier');
    if (result.length !== 2)
        throw new Error(`Expected 2, got ${result.length}`);
});
test('deduplicateByUrl: Remove duplicates', () => {
    const listings = [
        { title: 'Item 1', url: 'url1' },
        { title: 'Item 2', url: 'url2' },
        { title: 'Item 1 dup', url: 'url1' },
        { title: 'Item 3', url: 'url3' },
    ];
    const result = (0, SiteScrapers_1.deduplicateByUrl)(listings);
    if (result.length !== 3)
        throw new Error(`Expected 3, got ${result.length}`);
});
// ============================================================================
// Scraper Interface Tests
// ============================================================================
console.log('\n🔧 Testing Scraper Interfaces\n');
const scrapers = [
    { name: 'AkkelisAudio', instance: new SiteScrapers_1.AkkelisAudioPlaywright() },
    { name: 'Blocket', instance: new SiteScrapers_1.BlocketPlaywright() },
    { name: 'HiFi Puls', instance: new SiteScrapers_1.HifiPulsPlaywright() },
    { name: 'HiFi Shark', instance: new SiteScrapers_1.HifiSharkPlaywright() },
    { name: 'HiFi Torget', instance: new SiteScrapers_1.HifiTorgetPlaywright() },
    { name: 'Tradera', instance: new SiteScrapers_1.TraderaPlaywright() },
    { name: 'ReferenceAudio', instance: new SiteScrapers_1.ReferenceAudioPlaywright() },
    { name: 'Ljudmakarn', instance: new SiteScrapers_1.LjudmakarnPlaywright() },
    { name: 'HiFi Punkten', instance: new SiteScrapers_1.HifiPunktenPlaywright() },
    { name: 'Facebook', instance: new SiteScrapers_1.FacebookPlaywright() },
    { name: 'AudioPerformance', instance: new SiteScrapers_1.AudioPerformancePlaywright() },
    { name: 'Rehifi', instance: new SiteScrapers_1.RehifiPlaywright() },
];
for (const { name, instance } of scrapers) {
    test(`${name}: has name property`, () => {
        if (!instance.name)
            throw new Error('Missing name');
    });
    test(`${name}: has baseUrl property`, () => {
        if (!instance.baseUrl)
            throw new Error('Missing baseUrl');
    });
    test(`${name}: has search method`, () => {
        if (typeof instance.search !== 'function')
            throw new Error('Missing search method');
    });
    test(`${name}: has close method`, () => {
        if (typeof instance.close !== 'function')
            throw new Error('Missing close method');
    });
}
// ============================================================================
// Registry Tests
// ============================================================================
console.log('\n📋 Testing Scraper Registry\n');
test('AVAILABLE_SCRAPERS has all scrapers', () => {
    const count = Object.keys(SiteScrapers_1.AVAILABLE_SCRAPERS).length;
    if (count < 12)
        throw new Error(`Expected 12+, got ${count}`);
});
test('getAvailableScrapers returns list', () => {
    const list = (0, SiteScrapers_1.getAvailableScrapers)();
    if (!Array.isArray(list) || list.length < 12) {
        throw new Error(`Expected 12+, got ${list.length}`);
    }
});
test('AVAILABLE_SCRAPERS has all major scrapers', () => {
    const required = [
        'akkelisaudio',
        'blocket',
        'hifipuls',
        'hifishark',
        'hifitorget',
        'tradera',
        'referenceaudio',
        'ljudmakarn',
        'hifipunkten',
        'facebook',
        'audioperformance',
        'rehifi',
    ];
    const available = Object.keys(SiteScrapers_1.AVAILABLE_SCRAPERS);
    for (const scraper of required) {
        if (!available.includes(scraper)) {
            throw new Error(`Missing scraper: ${scraper}`);
        }
    }
});
// ============================================================================
// Search Signature Tests
// ============================================================================
console.log('\n🔍 Testing Search Method Signatures\n');
test('AkkelisAudio.search: empty query returns empty array', async () => {
    const scraper = new SiteScrapers_1.AkkelisAudioPlaywright();
    const result = await scraper.search('');
    if (!Array.isArray(result) || result.length !== 0) {
        throw new Error(`Expected empty array, got ${JSON.stringify(result)}`);
    }
});
test('HifiPuls.search: accepts price filters', async () => {
    const scraper = new SiteScrapers_1.HifiPulsPlaywright();
    const result = scraper.search('test', 1000, 5000);
    if (!(result instanceof Promise))
        throw new Error('Should return Promise');
});
test('Tradera.search: accepts optional parameters', async () => {
    const scraper = new SiteScrapers_1.TraderaPlaywright();
    const result = scraper.search('test');
    if (!(result instanceof Promise))
        throw new Error('Should return Promise');
});
// ============================================================================
// Configuration Tests
// ============================================================================
console.log('\n⚙️  Testing Scraper Configuration\n');
test('Scraper accepts custom options', () => {
    const scraper = new SiteScrapers_1.HifiPulsPlaywright({
        timeout: 60000,
        requestDelay: 2000,
        maxPages: 10,
        headless: true,
    });
    if (scraper.name !== 'HiFi Puls')
        throw new Error('Configuration failed');
});
test('Scraper options have defaults', () => {
    const scraper = new SiteScrapers_1.AkkelisAudioPlaywright();
    // Should not throw, uses default options
    if (!scraper.name)
        throw new Error('Default options failed');
});
// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log('✅ Test Summary');
console.log('='.repeat(60));
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
if (failed === 0) {
    console.log('\n🎉 All tests passed! Scrapers are ready to use.\n');
    process.exit(0);
}
else {
    console.log(`\n⚠️  ${failed} test(s) failed. Check output above.\n`);
    process.exit(1);
}
//# sourceMappingURL=test-quick.js.map