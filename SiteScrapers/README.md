# SiteScrapers - TypeScript Playwright Web Scraper Library

Modern TypeScript library providing a consistent interface for scraping multiple Swedish HiFi retailer websites using Playwright browser automation.

## Features

✨ **Consistent Interface**: All scrapers implement `SiteScraper` interface
🎭 **Playwright-based**: Modern browser automation instead of requests/BeautifulSoup
🏃 **Async/Await**: Fully asynchronous with proper error handling
🔧 **Utilities**: Built-in price extraction, URL normalization, filtering
⚙️ **Configurable**: Customizable timeout, request delay, max pages, etc.
🧪 **Type-safe**: Full TypeScript type coverage

## Installation

```bash
npm install playwright
```

## Quick Start

### Basic Usage

```typescript
import { chromium } from 'playwright';
import { AkkelisAudioPlaywright } from './SiteScrapers';

async function example() {
  const browser = await chromium.launch();
  const scraper = new AkkelisAudioPlaywright();

  // Initialize browser (required for browser management)
  (scraper as any)['initializeBrowser'](browser);

  try {
    // Search for listings
    const results = await scraper.search('amplifier', 1000, 5000);

    console.log(`Found ${results.length} results:`);
    results.forEach((result) => {
      console.log(`- ${result.title}: ${result.price} kr @ ${result.url}`);
    });
  } finally {
    await scraper.close();
    await browser.close();
  }
}

example().catch(console.error);
```

### Using Factory Functions

```typescript
import { chromium } from 'playwright';
import { createAkkelisAudioPlaywright } from './SiteScrapers';

async function example() {
  const browser = await chromium.launch();
  const scraper = createAkkelisAudioPlaywright({ timeout: 60000 });

  (scraper as any)['initializeBrowser'](browser);

  try {
    const results = await scraper.search('speaker');
    console.log(results);
  } finally {
    await scraper.close();
    await browser.close();
  }
}
```

### Parallel Scraping

```typescript
import { chromium } from 'playwright';
import {
  AkkelisAudioPlaywright,
  HifiPulsPlaywright,
  TraderaPlaywright,
} from './SiteScrapers';

async function searchMultipleSites() {
  const browser = await chromium.launch();
  const query = 'amplifier';

  const scrapers = [
    new AkkelisAudioPlaywright(),
    new HifiPulsPlaywright(),
    new TraderaPlaywright(),
  ];

  // Initialize all scrapers
  for (const scraper of scrapers) {
    (scraper as any)['initializeBrowser'](browser);
  }

  try {
    // Search all sites in parallel
    const results = await Promise.all(
      scrapers.map((scraper) => scraper.search(query))
    );

    // Aggregate results
    const allResults = results.flat().sort((a, b) => (a.price ?? 0) - (b.price ?? 0));

    console.log(`Found ${allResults.length} total results across all sites`);
    console.log('Cheapest first:');
    allResults.slice(0, 10).forEach((r) => {
      console.log(`  ${r.title}: ${r.price} kr @ ${r.url}`);
    });
  } finally {
    for (const scraper of scrapers) {
      await scraper.close();
    }
    await browser.close();
  }
}

searchMultipleSites().catch(console.error);
```

## Architecture

### Core Components

#### `SiteScraper` Interface

All scrapers implement this interface:

```typescript
interface SiteScraper {
  readonly name: string;
  readonly baseUrl: string;

  search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]>;

  close(): Promise<void>;
}
```

#### `ListingResult` Type

Normalized result from any scraper:

```typescript
interface ListingResult {
  title: string;
  description?: string;
  price?: number;
  url: string;
  imageUrl?: string;
  postedDate?: string;
  location?: string;
  rawData?: Record<string, unknown>;
}
```

#### `BaseScraper` Class

Abstract base class providing:
- Browser and context management
- Rate limiting
- Error handling
- Common utilities (price extraction, URL normalization)

### Directory Structure

```
SiteScrapers/
├── index.ts                 # Main export file
├── types.ts                 # TypeScript interfaces
├── BaseScraper.ts           # Abstract base class
├── utils.ts                 # Helper functions
├── README.md                # This file
├── CONVERSION_GUIDE.md       # Guide for converting new scrapers
├── scrapers/
│   ├── AkkelisAudio.ts      # Example: Simple HTML scraper
│   ├── HifiPuls.ts          # Example: Paginated scraper
│   ├── Tradera.ts           # Example: Complex scraper with dedup
│   └── [Other sites...]
└── tests/
    └── scrapers.test.ts     # Test suite
```

## Available Scrapers

Currently implemented:

- **AkkelisAudio** - https://www.akkelisaudio.com (Category page)
- **HifiPuls** - https://www.hifipuls.se (Paginated PrestaShop)
- **Tradera** - https://www.tradera.com (Auction marketplace)

Planned for conversion (from Python):

- AudioConcept (audioconcept.py)
- AudioPerformance (audioperformance.py)
- Blocket (blocket.py)
- Facebook Marketplace (facebook.py)
- HiFi Experience (hifiexperience.py)
- HiFi Punkten (hifipunkten.py)
- HiFi Shark (hifishark.py)
- HiFi Torget (hifitorget.py)
- Ljudmakarn (ljudmakarn.py)
- Lasseshifi (lasseshifi.py)
- Reference Audio (referenceaudio.py)
- Rehifi (rehifi.py)

## Configuration

### Scraper Options

All scrapers accept `ScraperOptions`:

```typescript
interface ScraperOptions {
  headless?: boolean;        // Launch browser in headless mode (default: true)
  timeout?: number;          // Page load timeout in ms (default: 30000)
  userAgent?: string;        // Custom user agent (default: Chrome on Windows)
  requestDelay?: number;     // Delay between requests in ms (default: 1000)
  maxPages?: number;         // Max pages to scrape (default: 5)
}
```

### Example: Custom Configuration

```typescript
const scraper = new AkkelisAudioPlaywright({
  timeout: 60000,
  requestDelay: 2000,
  maxPages: 10,
  headless: true,
});
```

## Utility Functions

### `extractPrice(text: string): number | undefined`

Extract numeric price from text, handling various formats (Swedish: 1.234,56):

```typescript
extractPrice('1.234,56 kr');      // Returns: 1234.56
extractPrice('Price: 199,99 SEK'); // Returns: 199.99
extractPrice('No price');          // Returns: undefined
```

### `normalizeUrl(url: string, baseUrl: string): string`

Convert relative URLs to absolute:

```typescript
normalizeUrl('/products/123', 'https://example.com');    // Returns: https://example.com/products/123
normalizeUrl('detail.html', 'https://example.com/shop'); // Returns: https://example.com/shop/detail.html
normalizeUrl('https://other.com/page', 'https://example.com'); // Returns: https://other.com/page
```

### `filterByPrice(listings: ListingResult[], min?: number, max?: number): ListingResult[]`

Filter listings by price range:

```typescript
const expensive = filterByPrice(listings, 5000, 10000);
const affordable = filterByPrice(listings, 0, 2000);
const allAbove1k = filterByPrice(listings, 1000);
```

### `filterByQuery(listings: ListingResult[], query: string): ListingResult[]`

Filter listings by query string match:

```typescript
const amplifiers = filterByQuery(listings, 'amplifier');
```

### `deduplicateByUrl(listings: ListingResult[]): ListingResult[]`

Remove duplicate listings by URL:

```typescript
const unique = deduplicateByUrl(listings);
```

## Error Handling

### Graceful Error Handling

```typescript
try {
  const results = await scraper.search('amplifier');
  console.log(`Found ${results.length} results`);
} catch (error) {
  if (error instanceof Error) {
    console.error(`Scraper error: ${error.message}`);
  }
  // Return empty results or handle as needed
}
```

### Timeout Handling

```typescript
const scraper = new AkkelisAudioPlaywright({ timeout: 60000 });

try {
  const results = await scraper.search('rare-item', 5000);
} catch (error) {
  console.error('Search timed out - site may be slow or unavailable');
}
```

## Performance Tips

### 1. Reuse Browser Instance

```typescript
const browser = await chromium.launch();

// Create multiple scrapers sharing same browser
const scrapers = [
  new AkkelisAudioPlaywright(),
  new HifiPulsPlaywright(),
  new TraderaPlaywright(),
];

for (const scraper of scrapers) {
  (scraper as any)['initializeBrowser'](browser);
}

// Use all scrapers...

// Cleanup
for (const scraper of scrapers) {
  await scraper.close();
}
await browser.close();
```

### 2. Parallel Requests

```typescript
// Search multiple sites concurrently
const results = await Promise.all([
  scraper1.search(query),
  scraper2.search(query),
  scraper3.search(query),
]);
```

### 3. Adjust Request Delays

```typescript
// Faster scraping (less polite):
const fastScraper = new AkkelisAudioPlaywright({ requestDelay: 500 });

// Slower scraping (more respectful):
const slowScraper = new AkkelisAudioPlaywright({ requestDelay: 5000 });
```

## Creating New Scrapers

See [CONVERSION_GUIDE.md](CONVERSION_GUIDE.md) for detailed instructions on:

- Converting existing Python scrapers
- Implementing the SiteScraper interface
- Handling different site patterns (HTML, paginated, API, dynamic content)
- Testing and validation
- Performance optimization

Quick template:

```typescript
import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

export class NewSitePlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.site.com', 'Site Name', options);
  }

  async search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]> {
    // Implementation here
    throw new Error('Not yet implemented');
  }
}
```

## Testing

### Run Tests

```bash
npm test
```

### Test Example

```typescript
import { test, expect } from '@playwright/test';
import { AkkelisAudioPlaywright } from './SiteScrapers/scrapers/AkkelisAudio';

test('Akkelis Audio scraper returns valid results', async ({ browser }) => {
  const scraper = new AkkelisAudioPlaywright();
  (scraper as any)['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier');

    expect(results).toBeDefined();
    expect(results.length).toBeGreaterThan(0);

    const firstResult = results[0];
    expect(firstResult.title).toBeTruthy();
    expect(firstResult.url).toBeTruthy();
    expect(firstResult.url).toMatch(/^https?:\/\//);
  } finally {
    await scraper.close();
  }
});
```

## Troubleshooting

### Issue: "Browser context not initialized"

**Solution**: Always call `initializeBrowser()` before using scraper:

```typescript
const scraper = new AkkelisAudioPlaywright();
await scraper['initializeBrowser'](browser);
```

### Issue: Timeout errors

**Solution**: Increase timeout for slow sites:

```typescript
const scraper = new AkkelisAudioPlaywright({ timeout: 60000 });
```

### Issue: "Search not yet implemented"

**Solution**: The scraper stub hasn't been fully implemented. See CONVERSION_GUIDE.md for how to implement it.

### Issue: Cloudflare/WAF blocking

**Solution**: The library includes realistic User-Agent headers, but some sites may still block. Options:
1. Increase delays between requests
2. Use proxy servers
3. Implement additional headers

### Issue: Empty results

**Possible causes**:
1. Query doesn't match any products
2. CSS selectors have changed (site redesigned)
3. Content is JavaScript-rendered (check waitForSelector usage)

## Best Practices

1. **Always cleanup**: Use try/finally to ensure resources are freed
2. **Check results**: Verify results have expected fields
3. **Handle errors gracefully**: Don't let one site failure break entire app
4. **Respect robots.txt**: Don't over-scrape
5. **Use rate limiting**: The library provides it, enable it
6. **Cache results**: Don't re-scrape same query immediately
7. **Monitor performance**: Track scraper execution times
8. **Update selectors**: Monitor site changes and update selectors

## License

[Your License Here]

## Contributing

To add a new scraper:

1. Read [CONVERSION_GUIDE.md](CONVERSION_GUIDE.md)
2. Create new file in `scrapers/` directory
3. Extend `BaseScraper` class
4. Implement `search()` method
5. Add tests
6. Update `index.ts` exports
7. Submit PR

## Support

For issues or questions:
1. Check CONVERSION_GUIDE.md
2. Review example implementations
3. Check test files for usage examples

## Changelog

### v1.0.0 (Initial Release)

- [x] TypeScript/Playwright architecture
- [x] SiteScraper interface
- [x] BaseScraper base class
- [x] Utility functions
- [x] Example scrapers (AkkelisAudio, HifiPuls, Tradera)
- [x] Comprehensive conversion guide
- [x] Type definitions
- [ ] Remaining 12 scrapers
- [ ] Integration tests
- [ ] Performance benchmarks
