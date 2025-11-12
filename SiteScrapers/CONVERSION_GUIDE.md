# TypeScript Scraper Conversion Guide

## Overview

This guide helps convert Python web scrapers to TypeScript Playwright modules implementing the `SiteScraper` interface. The conversion modernizes your scrapers from synchronous requests-based scripts to asynchronous Playwright browser automation.

## Architecture

- **`types.ts`**: Defines `SiteScraper` interface, `ListingResult`, and `ScraperOptions`
- **`BaseScraper.ts`**: Abstract base class with browser management and utilities
- **`utils.ts`**: Helper functions (price extraction, URL normalization, filtering)
- **`scrapers/`**: Individual site scraper implementations (one file per site)

## Conversion Checklist

### 1. Analyze the Python Scraper

Before starting conversion, understand the original implementation:

- [ ] Identify the site's base URL
- [ ] Determine scraping pattern (static HTML, paginated, API, etc.)
- [ ] Check for authentication requirements
- [ ] Note any special headers or parameters
- [ ] Understand price/currency format used
- [ ] Identify pagination strategy if any

### 2. Create TypeScript Module

Create a new file in `SiteScrapers/scrapers/SiteName.ts`:

```typescript
import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

export class SiteNamePlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.site.com', 'Site Name', options);
  }

  async search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]> {
    // Implementation here
  }
}

export function createSiteNamePlaywright(
  options?: ScraperOptions
): SiteNamePlaywright {
  return new SiteNamePlaywright(options);
}
```

Naming convention:
- Class: `{SiteName}Playwright` (replace "Scraper" with "Playwright")
- Factory function: `create{SiteName}Playwright()`
- File: `{SiteName}.ts`

### 3. Implement Search Method

Replace BeautifulSoup HTML parsing with Playwright selectors:

#### Key Playwright APIs

```typescript
// Navigate to URL
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

// Wait for element to appear
await page.waitForSelector('.selector', { timeout: 5000 });

// Get all matching elements
const items = await page.locator('.item').all();

// Get text content
const text = await element.textContent();

// Get attribute
const href = await element.getAttribute('href');

// Execute JavaScript in page context
const data = await page.evaluate(() => {
  return JSON.parse(document.getElementById('data').textContent);
});

// Click and wait for navigation
await page.click('a.next');
await page.waitForNavigation();
```

### 4. Use Helper Functions

Import and use utilities from `utils.ts`:

```typescript
import { extractPrice, normalizeUrl, filterByPrice, filterByQuery } from '../utils';

// Extract price from text (handles Swedish format: 1.234,56)
const price = extractPrice('1.234,56 kr');  // Returns: 1234.56

// Normalize relative URLs to absolute
const fullUrl = normalizeUrl('/product/123', this.baseUrl);

// Filter listings by price range
const filtered = filterByPrice(listings, minPrice, maxPrice);

// Filter by query string match
const matched = filterByQuery(listings, query);
```

### 5. Error Handling

Implement graceful error handling:

```typescript
try {
  const page = await this.newPage();
  try {
    await page.goto(url);
    // ... scraping logic
  } finally {
    await page.close();
  }
} catch (error) {
  console.error(`Error in ${this.name}:`, error instanceof Error ? error.message : 'Unknown error');
  return []; // Return empty results on error
}
```

## Common Patterns

### Pattern 1: Simple HTML Search

**Used by**: Akkelis Audio, HiFi Experience

Single page with items already loaded or accessible via search.

```typescript
async search(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<ListingResult[]> {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    await this.rateLimit();
    await page.goto(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);

    // Wait for results
    await page.waitForSelector('.product-item', { timeout: 5000 });

    // Extract results
    const items = await page.locator('.product-item').all();
    const results: ListingResult[] = [];

    for (const item of items) {
      const title = await item.locator('.title').textContent();
      if (!title?.toLowerCase().includes(query.toLowerCase())) continue;

      results.push({
        title: title.trim(),
        url: normalizeUrl(await item.locator('a').getAttribute('href') || '', this.baseUrl),
        price: extractPrice(await item.locator('.price').textContent() || ''),
        description: await item.locator('.desc').textContent(),
        imageUrl: await item.locator('img').getAttribute('src'),
      });
    }

    return filterByPrice(results, minPrice, maxPrice);
  } finally {
    await page.close();
  }
}
```

### Pattern 2: Paginated Search

**Used by**: HiFi Puls, HiFi Shark, Tradera

Multiple pages with navigation between them.

```typescript
async search(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<ListingResult[]> {
  if (!query?.trim()) return [];

  const results: ListingResult[] = [];
  let page = 1;

  while (page <= this.options.maxPages) {
    await this.rateLimit();

    const playwright = await this.newPage();
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}`;
      await playwright.goto(url);

      await playwright.waitForSelector('.product-item', { timeout: 5000 }).catch(() => {});

      const items = await playwright.locator('.product-item').all();
      if (items.length === 0) break;

      for (const item of items) {
        const title = await item.locator('.title').textContent();
        if (!title?.toLowerCase().includes(query.toLowerCase())) continue;

        results.push({
          title: title.trim(),
          url: normalizeUrl(await item.locator('a').getAttribute('href') || '', this.baseUrl),
          price: extractPrice(await item.locator('.price').textContent() || ''),
          description: await item.locator('.desc').textContent(),
          imageUrl: await item.locator('img').getAttribute('src'),
        });
      }

      page++;
    } finally {
      await playwright.close();
    }
  }

  return filterByPrice(results, minPrice, maxPrice);
}
```

### Pattern 3: JSON API

**Used by**: Common, Tradera (some endpoints)

API endpoints returning JSON data.

```typescript
async search(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<ListingResult[]> {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    await this.rateLimit();

    const url = `${this.baseUrl}/api/products?search=${encodeURIComponent(query)}`;
    const response = await page.goto(url);
    const data = await response?.json();

    const results = (data?.products || []).map((p: any) => ({
      title: p.name || '',
      url: normalizeUrl(p.url, this.baseUrl),
      price: typeof p.price === 'number' ? p.price : extractPrice(p.price),
      description: p.description,
      imageUrl: p.image?.url,
      postedDate: p.date,
      rawData: { product_id: p.id },
    }));

    return filterByPrice(results, minPrice, maxPrice);
  } finally {
    await page.close();
  }
}
```

### Pattern 4: JSON Embedded in HTML

**Used by**: Blocket, Facebook

JSON data embedded in HTML script tags.

```typescript
async search(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<ListingResult[]> {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    await this.rateLimit();
    await page.goto(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);

    // Extract JSON from script tag
    const data = await page.evaluate(() => {
      const script = document.querySelector('script[type="application/json"]');
      return JSON.parse(script?.textContent || '{}');
    });

    const results = (data.listings || []).map((item: any) => ({
      title: item.title || '',
      url: normalizeUrl(item.url, 'https://www.site.com'),
      price: extractPrice(item.price),
      description: item.description,
      imageUrl: item.image_url,
      location: item.location,
      postedDate: item.posted_date,
    }));

    return filterByPrice(results, minPrice, maxPrice);
  } finally {
    await page.close();
  }
}
```

### Pattern 5: Dynamic JavaScript Rendered Content

**Used by**: Modern React/Vue sites

Content loaded by JavaScript after page load.

```typescript
async search(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<ListingResult[]> {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    await this.rateLimit();
    await page.goto(`${this.baseUrl}/search?q=${encodeURIComponent(query)}`);

    // Wait for JavaScript to render content
    await page.waitForFunction(
      () => document.querySelectorAll('.product-item').length > 0,
      { timeout: 10000 }
    );

    // Extract items from rendered DOM
    const items = await page.locator('.product-item').all();
    const results: ListingResult[] = [];

    for (const item of items) {
      const title = await item.locator('.title').textContent();
      if (!title?.toLowerCase().includes(query.toLowerCase())) continue;

      results.push({
        title: title.trim(),
        url: normalizeUrl(await item.locator('a').getAttribute('href') || '', this.baseUrl),
        price: extractPrice(await item.locator('.price').textContent() || ''),
        description: await item.locator('.desc').textContent(),
        imageUrl: await item.locator('img').getAttribute('src'),
      });
    }

    return filterByPrice(results, minPrice, maxPrice);
  } finally {
    await page.close();
  }
}
```

## Specific Site Conversions

### Blocket (Marketplace)
- **Python file**: `Scrapers/blocket.py`
- **Pattern**: Paginated search with JSON embedded in HTML
- **Key selectors**: `.list-item`, `.item-price`, `.item-image`
- **Pagination**: Query param `?page=N`

### Facebook Marketplace
- **Python file**: `Scrapers/facebook.py`
- **Pattern**: Dynamic JavaScript rendered content
- **Key challenge**: Requires login (may need authentication)
- **Pagination**: Infinite scroll or pagination buttons

### HiFi Shark
- **Python file**: `Scrapers/hifishark.py`
- **Pattern**: Paginated HTML search
- **Key selectors**: `.product-item`, `.product-price`
- **Pagination**: Query param `page=N` or next button

### HiFi Torget
- **Python file**: `Scrapers/hifitorget.py`
- **Pattern**: Paginated search with filters
- **Pagination**: Multiple pages or infinite scroll

### Common (Ashop CMS)
- **Python file**: `Scrapers/common.py`
- **Used by**: Reference Audio, Ljudmakarn, HiFi Punkten
- **Pattern**: JSON data in HTML attributes
- **Key attribute**: `:product-data` contains JSON
- **Implementation**:

```typescript
async search(
  query: string,
  minPrice?: number,
  maxPrice?: number
): Promise<ListingResult[]> {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    await this.rateLimit();
    await page.goto(this.categoryUrl);

    // Extract JSON from Ashop data attribute
    const data = await page.evaluate(() => {
      const node = document.querySelector('[\\:product-data]');
      if (!node) return { products: [] };
      const json = (node.getAttribute(':product-data') || '{}')
        .replace(/&quot;/g, '"');
      return JSON.parse(json);
    });

    const results = (data.products || [])
      .filter(p => {
        const haystack = [
          p.product_name,
          p.product_title,
          p.product_info_puff,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query.toLowerCase());
      })
      .map(p => ({
        title: p.product_name || p.product_title || 'Unknown',
        url: normalizeUrl(p.product_url || p.product_link || '', this.baseUrl),
        price: extractPrice(p.product_display_price || p.product_price || ''),
        description: p.product_info_puff || p.product_status_name,
        imageUrl: p.product_puff_image,
        location: p.tags
          ?.map(t => t.product_tag_name)
          .filter(Boolean)
          .join(', '),
      }));

    return filterByPrice(results, minPrice, maxPrice);
  } finally {
    await page.close();
  }
}
```

## Testing Converted Scrapers

### Unit Test Example

```typescript
import { chromium } from 'playwright';
import { AkkelisAudioPlaywright } from './SiteScrapers/scrapers/AkkelisAudio';

async function testScraper() {
  const browser = await chromium.launch();
  const scraper = new AkkelisAudioPlaywright();

  // Access protected method for testing
  (scraper as any).browser = browser;
  scraper['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier', 1000, 5000);
    console.log(`✓ Found ${results.length} results`);

    if (results.length > 0) {
      console.log('✓ Sample result:', results[0]);
      console.assert(results[0].title, 'Title missing');
      console.assert(results[0].url, 'URL missing');
      console.assert(results[0].price !== undefined, 'Price missing');
    }
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testScraper().catch(console.error);
```

### Integration Test

```typescript
import { test, expect } from '@playwright/test';
import { createAkkelisAudioPlaywright } from './SiteScrapers/scrapers/AkkelisAudio';

test('Akkelis Audio scraper finds results', async ({ browser }) => {
  const scraper = new AkkelisAudioPlaywright();
  scraper['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toBeTruthy();
    expect(results[0].url).toBeTruthy();
  } finally {
    await scraper.close();
  }
});
```

## Performance Tips

### 1. Minimize Page Load Time
```typescript
// Block unnecessary resources
await page.route('**/*.{png,jpg,jpeg,gif}', route => route.abort());
await page.route('**/*.css', route => route.abort());
```

### 2. Parallel Scraping
```typescript
// Search multiple sites in parallel
const results = await Promise.all([
  scraper1.search(query),
  scraper2.search(query),
  scraper3.search(query),
]);
```

### 3. Reuse Browser Context
```typescript
// Share browser across multiple scraper instances
const browser = await chromium.launch();
const scrapers = [
  new AkkelisAudioPlaywright(),
  new HifiPulsPlaywright(),
  new TraderaPlaywright(),
];

for (const scraper of scrapers) {
  scraper['initializeBrowser'](browser);
}

try {
  const results = await Promise.all(
    scrapers.map(s => s.search('amplifier'))
  );
} finally {
  for (const scraper of scrapers) {
    await scraper.close();
  }
  await browser.close();
}
```

### 4. Rate Limiting
The `BaseScraper` includes built-in rate limiting:

```typescript
protected async rateLimit(): Promise<void> {
  const timeSinceLast = Date.now() - this.lastRequestTime;
  if (timeSinceLast < this.options.requestDelay) {
    await sleep(this.options.requestDelay - timeSinceLast);
  }
  this.lastRequestTime = Date.now();
}
```

Customize per scraper:
```typescript
const scraper = new AkkelisAudioPlaywright({ requestDelay: 2000 });
```

## Common Issues and Solutions

### Issue: Cloudflare/Bot Detection

**Problem**: Site blocks automated requests

**Solutions**:
1. Add delays between requests
2. Use realistic user agents (already in `getDefaultUserAgent()`)
3. Set custom headers:

```typescript
await page.setExtraHTTPHeaders({
  'Referer': this.baseUrl,
  'Accept-Language': 'sv-SE,sv;q=0.9',
});
```

### Issue: Timeout Errors

**Problem**: Page takes too long to load

**Solutions**:
1. Increase timeout:
```typescript
const scraper = new AkkelisAudioPlaywright({ timeout: 60000 });
```

2. Use `waitForLoadState` instead of `waitForNavigation`:
```typescript
await page.goto(url);
await page.waitForLoadState('networkidle');
```

### Issue: Stale Element References

**Problem**: Element reference becomes invalid after DOM change

**Solutions**:
1. Always re-query elements after navigation
2. Use modern Playwright locators (they auto-update):
```typescript
const items = await page.locator('.item').all(); // Fresh list
```

### Issue: Dynamic Content Not Loading

**Problem**: JavaScript-rendered content missing

**Solutions**:
1. Wait for specific element:
```typescript
await page.waitForSelector('.results', { timeout: 10000 });
```

2. Wait for specific condition:
```typescript
await page.waitForFunction(
  () => document.querySelectorAll('.item').length > 0,
  { timeout: 10000 }
);
```

3. Use evaluate to check:
```typescript
const itemCount = await page.evaluate(
  () => document.querySelectorAll('.item').length
);
```

### Issue: Authentication Required

**Problem**: Site requires login

**Solutions**:
1. Store session cookies:
```typescript
// After login
const cookies = await context.cookies();
await fs.writeFile('cookies.json', JSON.stringify(cookies));

// Load cookies before scraping
const savedCookies = JSON.parse(await fs.readFile('cookies.json'));
await context.addCookies(savedCookies);
```

2. Implement manual login detection:
```typescript
if (await page.locator('.login-form').isVisible()) {
  throw new Error('Login required - cannot proceed');
}
```

## Migration Checklist

- [ ] Read and understand the Python scraper
- [ ] Create new TypeScript file in `SiteScrapers/scrapers/`
- [ ] Implement class extending `BaseScraper`
- [ ] Implement `search()` method
- [ ] Test with sample queries
- [ ] Verify all fields in `ListingResult` are populated
- [ ] Test price filtering
- [ ] Test pagination if applicable
- [ ] Add error handling
- [ ] Document any special requirements in JSDoc
- [ ] Update README with new scraper info

## Next Steps

1. **Review examples**: Study `AkkelisAudio.ts`, `HifiPuls.ts`, and `Tradera.ts`
2. **Choose a scraper**: Pick one from your 15 to convert
3. **Identify the pattern**: Which pattern does it match?
4. **Implement**: Create the TypeScript file
5. **Test**: Run with sample queries
6. **Iterate**: Fix any issues
7. **Repeat**: Convert remaining scrapers
8. **Integrate**: Use in your main application

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-page)
- [CSS Selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [XPath Selectors](https://developer.mozilla.org/en-US/docs/Web/XPath)
