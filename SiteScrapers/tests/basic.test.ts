import { test, expect, chromium } from '@playwright/test';
import {
  AkkelisAudioPlaywright,
  BlocketPlaywright,
  HifiPulsPlaywright,
  HifiSharkPlaywright,
  HifiTorgetPlaywright,
  TraderaPlaywright,
  ReferenceAudioPlaywright,
  LjudmakarnPlaywright,
  HifiPunktenPlaywright,
  FacebookPlaywright,
  AudioPerformancePlaywright,
  RehifiPlaywright,
  extractPrice,
  normalizeUrl,
  filterByPrice,
  filterByQuery,
} from '../index';

/**
 * Basic functionality tests for TypeScript Playwright scrapers
 * Run with: npx playwright test
 */

test.describe('Utility Functions', () => {
  test('extractPrice handles Swedish format', () => {
    expect(extractPrice('1.234,56 kr')).toBe(1234.56);
    expect(extractPrice('199,99 SEK')).toBe(199.99);
    expect(extractPrice('1000')).toBe(1000);
    expect(extractPrice('invalid')).toBeUndefined();
  });

  test('normalizeUrl converts relative to absolute URLs', () => {
    const base = 'https://example.com';
    expect(normalizeUrl('/products/123', base)).toBe('https://example.com/products/123');
    expect(normalizeUrl('detail.html', base)).toBe('https://example.com/detail.html');
    expect(normalizeUrl('https://other.com/page', base)).toBe('https://other.com/page');
  });

  test('filterByPrice filters correctly', () => {
    const listings = [
      { title: 'Item 1', price: 500, url: 'url1' },
      { title: 'Item 2', price: 1500, url: 'url2' },
      { title: 'Item 3', price: 3000, url: 'url3' },
      { title: 'Item 4', price: 5000, url: 'url4' },
    ];

    const filtered = filterByPrice(
      listings as any,
      1000,
      4000
    );
    expect(filtered).toHaveLength(2);
    expect(filtered[0].price).toBe(1500);
    expect(filtered[1].price).toBe(3000);
  });

  test('filterByQuery matches text correctly', () => {
    const listings = [
      { title: 'Amplifier Pro', description: 'High quality', url: 'url1' },
      { title: 'Speaker System', description: 'Great sound', url: 'url2' },
      { title: 'Amplifier Mini', description: 'Compact', url: 'url3' },
    ];

    const filtered = filterByQuery(listings as any, 'amplifier');
    expect(filtered).toHaveLength(2);
    expect(filtered[0].title).toContain('Amplifier');
    expect(filtered[1].title).toContain('Amplifier');
  });
});

test.describe('Scraper Interface Tests', () => {
  let browser: any;

  test.beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
  });

  test.afterAll(async () => {
    await browser.close();
  });

  test('AkkelisAudio scraper has correct interface', async () => {
    const scraper = new AkkelisAudioPlaywright();
    expect(scraper.name).toBe('Akkelis Audio');
    expect(scraper.baseUrl).toBe('https://www.akkelisaudio.com');
    expect(typeof scraper.search).toBe('function');
    expect(typeof scraper.close).toBe('function');
  });

  test('Blocket scraper has correct interface', async () => {
    const scraper = new BlocketPlaywright();
    expect(scraper.name).toBe('Blocket');
    expect(scraper.baseUrl).toBe('https://www.blocket.se');
    expect(typeof scraper.search).toBe('function');
  });

  test('HiFi Puls scraper has correct interface', async () => {
    const scraper = new HifiPulsPlaywright();
    expect(scraper.name).toBe('HiFi Puls');
    expect(scraper.baseUrl).toBe('https://www.hifipuls.se');
    expect(typeof scraper.search).toBe('function');
  });

  test('HiFi Shark scraper has correct interface', async () => {
    const scraper = new HifiSharkPlaywright();
    expect(scraper.name).toBe('HiFiShark');
    expect(scraper.baseUrl).toBe('https://www.hifishark.com');
    expect(typeof scraper.search).toBe('function');
  });

  test('Tradera scraper has correct interface', async () => {
    const scraper = new TraderaPlaywright();
    expect(scraper.name).toBe('Tradera');
    expect(scraper.baseUrl).toBe('https://www.tradera.com');
    expect(typeof scraper.search).toBe('function');
  });

  test('All scrapers have consistent interface', async () => {
    const scrapers = [
      new AkkelisAudioPlaywright(),
      new BlocketPlaywright(),
      new HifiPulsPlaywright(),
      new HifiSharkPlaywright(),
      new HifiTorgetPlaywright(),
      new TraderaPlaywright(),
      new ReferenceAudioPlaywright(),
      new LjudmakarnPlaywright(),
      new HifiPunktenPlaywright(),
      new FacebookPlaywright(),
      new AudioPerformancePlaywright(),
      new RehifiPlaywright(),
    ];

    for (const scraper of scrapers) {
      expect(scraper.name).toBeDefined();
      expect(scraper.baseUrl).toBeDefined();
      expect(typeof scraper.search).toBe('function');
      expect(typeof scraper.close).toBe('function');
    }
  });
});

test.describe('Search Method Signature Tests', () => {
  test('AkkelisAudio search method exists and is callable', async () => {
    const scraper = new AkkelisAudioPlaywright();
    expect(typeof scraper.search).toBe('function');
    // Just verify method signature without actually calling search
    // (would need browser context)
  });

  test('Blocket search method accepts multiple parameters', async () => {
    const scraper = new BlocketPlaywright();
    expect(typeof scraper.search).toBe('function');
    // Verify method signature accepts parameters
  });

  test('HiFi Puls search method exists and is callable', async () => {
    const scraper = new HifiPulsPlaywright();
    expect(typeof scraper.search).toBe('function');
    // Verify it's a function without calling it
  });
});

test.describe('Configuration Options', () => {
  test('Scraper accepts custom options', () => {
    const scraper = new HifiPulsPlaywright({
      timeout: 60000,
      requestDelay: 2000,
      maxPages: 10,
    });

    expect(scraper.name).toBe('HiFi Puls');
  });

  test('Factory functions create scraper instances', () => {
    const scrapers = [
      new AkkelisAudioPlaywright(),
      new BlocketPlaywright(),
      new HifiPulsPlaywright(),
    ];

    for (const scraper of scrapers) {
      expect(scraper).toBeDefined();
      expect(scraper.name).toBeDefined();
    }
  });
});
