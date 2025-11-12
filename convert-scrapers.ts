#!/usr/bin/env node

/**
 * Automated converter script for Python web scrapers to TypeScript Playwright modules
 *
 * This script analyzes existing Python scrapers and generates equivalent TypeScript modules
 * that implement the SiteScraper interface using Playwright for browser automation.
 *
 * Usage:
 *   npx ts-node convert-scrapers.ts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface ScraperInfo {
  name: string;
  className: string;
  baseUrl: string;
  scraperName: string;
  type: 'simple' | 'paginated' | 'api' | 'shopify' | 'unknown';
  features: string[];
}

/**
 * Parse Python scraper file to extract metadata
 */
async function parseScraperMetadata(filePath: string): Promise<ScraperInfo | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');

    // Extract class name
    const classMatch = content.match(/class\s+(\w+)\(BaseScraper\)/);
    if (!classMatch) {
      return null;
    }

    const className = classMatch[1];
    const name = path.basename(filePath, '.py');

    // Extract base URL and name from __init__
    const initMatch = content.match(
      /super\(\).__init__\("([^"]+)",\s*"([^"]+)"/
    );
    if (!initMatch) {
      return null;
    }

    const baseUrl = initMatch[1];
    const scraperName = initMatch[2];

    // Detect scraper type based on class hierarchy and methods
    let type: 'simple' | 'paginated' | 'api' | 'shopify' | 'unknown' = 'unknown';
    const features: string[] = [];

    if (className.includes('ShopifyScraper') || className.includes('ShopifyCollection')) {
      type = 'shopify';
      features.push('json_api');
    } else if (className.includes('WooCommerce')) {
      type = 'api';
      features.push('rest_api');
    } else if (content.includes('_fetch_page') && content.includes('page += 1')) {
      type = 'paginated';
      features.push('pagination');
    } else if (content.includes('_fetch_products_page')) {
      type = 'api';
      features.push('json_parsing');
    }

    // Detect other features
    if (content.includes('BeautifulSoup')) {
      features.push('html_parsing');
    }
    if (content.includes('json.loads')) {
      features.push('json_parsing');
    }
    if (content.includes('price')) {
      features.push('price_extraction');
    }
    if (content.includes('image')) {
      features.push('image_handling');
    }
    if (content.includes('pagination') || content.includes('page')) {
      features.push('pagination');
    }

    return {
      name,
      className,
      baseUrl,
      scraperName,
      type,
      features: [...new Set(features)],
    };
  } catch (error) {
    console.error(`Failed to parse ${filePath}:`, error);
    return null;
  }
}

/**
 * Generate TypeScript scraper template based on scraper type
 */
function generateTypeScriptModule(info: ScraperInfo): string {
  const importStatements = generateImports(info);
  const classTemplate = generateClassTemplate(info);

  return `${importStatements}\n\n${classTemplate}`;
}

function generateImports(info: ScraperInfo): string {
  const imports = new Set<string>([
    "import { Page } from 'playwright';",
    "import { BaseScraper } from '../BaseScraper';",
    "import { ListingResult, ScraperOptions } from '../types';",
    "import { extractPrice, normalizeUrl, filterByPrice, filterByQuery } from '../utils';",
  ]);

  return Array.from(imports).sort().join('\n');
}

function generateClassTemplate(info: ScraperInfo): string {
  const className = info.className.replace(/Scraper$/, 'Playwright');
  const template = `
/**
 * Playwright-based scraper for ${info.scraperName}
 * Converts from Python scraper: ${info.name}.py
 *
 * Base URL: ${info.baseUrl}
 * Scraper Type: ${info.type}
 * Features: ${info.features.join(', ') || 'N/A'}
 */
export class ${className} extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('${info.baseUrl}', '${info.scraperName}', options);
  }

  /**
   * Search for listings matching the query
   *
   * TODO: Implement search logic based on site structure
   * - Replace BeautifulSoup HTML parsing with Playwright selectors
   * - Use \`page.locator()\` for element selection
   * - Use \`page.evaluate()\` for JavaScript execution if needed
   * - Handle pagination if required
   */
  async search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const results: ListingResult[] = [];

    // TODO: Implement site-specific search logic
    // Example structure:
    // 1. Navigate to search page with query
    // 2. Wait for results to load
    // 3. Extract listing elements
    // 4. Parse each listing into ListingResult
    // 5. Apply price filters
    // 6. Deduplicate and return

    throw new Error('Search not yet implemented for ${info.scraperName}');
  }
}

/**
 * Export a factory function for convenience
 */
export function create${className}(options?: ScraperOptions): ${className} {
  return new ${className}(options);
}
`;

  return template.trim();
}

/**
 * Generate documentation for the conversion
 */
function generateConversionGuide(): string {
  return `# TypeScript Scraper Conversion Guide

## Overview

This guide helps convert Python web scrapers to TypeScript Playwright modules implementing the \`SiteScraper\` interface.

## Architecture

- **\`types.ts\`**: Defines \`SiteScraper\` interface and common types
- **\`BaseScraper.ts\`**: Abstract base class with browser management and utilities
- **\`utils.ts\`**: Helper functions (price extraction, URL normalization, etc.)
- **\`scrapers/\`**: Individual site scraper implementations

## Conversion Checklist

For each scraper, follow these steps:

### 1. Analyze the Python Scraper
- [ ] Identify the site's base URL
- [ ] Determine if pagination is used
- [ ] Check if it uses API endpoints or HTML parsing
- [ ] Note any special authentication or headers needed

### 2. Create TypeScript Module
- [ ] Create file: \`SiteScrapers/scrapers/SiteName.ts\`
- [ ] Extend \`BaseScraper\`
- [ ] Implement \`search()\` method
- [ ] Use Playwright instead of requests/BeautifulSoup

### 3. Implement Search Method
- [ ] Handle empty/invalid queries
- [ ] Navigate to search page
- [ ] Wait for content to load
- [ ] Extract listing elements using \`page.locator()\` or \`page.$$eval()\`
- [ ] Parse each listing into \`ListingResult\`
- [ ] Apply price filters
- [ ] Handle pagination

### 4. Use Helper Functions
- [ ] Use \`extractPrice()\` for currency parsing
- [ ] Use \`normalizeUrl()\` for relative URLs
- [ ] Use \`filterByPrice()\` for price filtering
- [ ] Use \`filterByQuery()\` for text matching

### 5. Error Handling
- [ ] Handle network errors gracefully
- [ ] Implement retry logic if needed
- [ ] Add timeout handling
- [ ] Log meaningful error messages

## Key Differences: Python → TypeScript

### HTTP Requests
\`\`\`python
# Python
response = self.session.get(url, timeout=30)
soup = BeautifulSoup(response.text, "html.parser")
\`\`\`

\`\`\`typescript
// TypeScript
const page = await this.newPage();
await page.goto(url, { timeout: this.options.timeout });
\`\`\`

### CSS Selectors
\`\`\`python
# Python
items = soup.select(".product-item")
title = item.select_one(".title").get_text(strip=True)
\`\`\`

\`\`\`typescript
// TypeScript
const items = await page.locator('.product-item').all();
const title = await items[0].locator('.title').textContent();
\`\`\`

### JSON API Parsing
\`\`\`python
# Python
data = response.json()
for product in data['products']:
    # process product
\`\`\`

\`\`\`typescript
// TypeScript
const data = await page.evaluate(() => {
  const script = document.querySelector('script[type="application/json"]');
  return JSON.parse(script?.textContent || '{}');
});
for (const product of data.products) {
  // process product
}
\`\`\`

### Pagination
\`\`\`python
# Python
page = 1
while True:
    soup = self._fetch_page(query, page)
    items = soup.select("li.product")
    if not items:
        break
    # process items
    page += 1
\`\`\`

\`\`\`typescript
// TypeScript
let page = 1;
while (true) {
  await this.rateLimit();
  const url = \`\${this.baseUrl}/search?q=\${query}&page=\${page}\`;
  const playwright = await this.newPage();
  await playwright.goto(url);
  const items = await playwright.locator('li.product').all();
  if (items.length === 0) break;
  // process items
  page++;
}
\`\`\`

## Common Patterns

### Pattern: HTML-based Search
Used by: Akkelis Audio, HiFi Puls, HiFi Shark, Tradera, Blocket

\`\`\`typescript
async search(query: string, minPrice?: number, maxPrice?: number) {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    // Navigate to search
    await page.goto(\`\${this.baseUrl}/search?q=\${encodeURIComponent(query)}\`);

    // Wait for results
    await page.waitForSelector('.product-item', { timeout: 5000 });

    // Extract results
    const results = await page.$$eval('.product-item', elements =>
      elements.map(el => ({
        title: el.querySelector('.title')?.textContent?.trim() || '',
        url: el.querySelector('a')?.href || '',
        price: el.querySelector('.price')?.textContent?.trim(),
        imageUrl: el.querySelector('img')?.src,
        description: el.querySelector('.desc')?.textContent?.trim(),
      }))
    );

    // Process and filter
    return results
      .map(r => ({
        ...r,
        price: extractPrice(r.price),
        url: normalizeUrl(r.url, this.baseUrl),
      }))
      .filter(r => filterByPrice([r], minPrice, maxPrice).length > 0);
  } finally {
    await page.close();
  }
}
\`\`\`

### Pattern: Paginated Search
Used by: Common, HiFi Shark

\`\`\`typescript
async search(query: string, minPrice?: number, maxPrice?: number) {
  if (!query?.trim()) return [];

  const results: ListingResult[] = [];
  let page = 1;
  const maxPages = this.options.maxPages;

  while (page <= maxPages) {
    await this.rateLimit();

    const playwright = await this.newPage();
    try {
      const url = \`\${this.baseUrl}/search?q=\${encodeURIComponent(query)}&page=\${page}\`;
      await playwright.goto(url);

      const items = await playwright.locator('.product-item').all();
      if (items.length === 0) break;

      for (const item of items) {
        const title = await item.locator('.title').textContent();
        if (!title?.toLowerCase().includes(query.toLowerCase())) continue;

        const listing: ListingResult = {
          title: title || '',
          url: await item.locator('a').getAttribute('href') || '',
          price: extractPrice(await item.locator('.price').textContent() || ''),
          description: await item.locator('.desc').textContent(),
          imageUrl: await item.locator('img').getAttribute('src'),
        };

        results.push(listing);
      }

      page++;
    } finally {
      await playwright.close();
    }
  }

  return filterByPrice(results, minPrice, maxPrice);
}
\`\`\`

### Pattern: JSON API
Used by: Common, Tradera

\`\`\`typescript
async search(query: string, minPrice?: number, maxPrice?: number) {
  if (!query?.trim()) return [];

  const page = await this.newPage();
  try {
    const url = \`\${this.baseUrl}/api/products?search=\${encodeURIComponent(query)}\`;
    const response = await page.goto(url);

    const data = await response?.json();

    return (data?.products || [])
      .map(p => ({
        title: p.name || '',
        url: normalizeUrl(p.url, this.baseUrl),
        price: typeof p.price === 'number' ? p.price : extractPrice(p.price),
        description: p.description,
        imageUrl: p.image?.url,
      }))
      .filter(r => filterByPrice([r], minPrice, maxPrice).length > 0);
  } finally {
    await page.close();
  }
}
\`\`\`

## Testing Converted Scrapers

\`\`\`typescript
import { chromium } from 'playwright';
import { AkkelisAudioPlaywright } from './SiteScrapers/scrapers/AkkelisAudio';

async function testScraper() {
  const browser = await chromium.launch();
  const scraper = new AkkelisAudioPlaywright();
  await scraper['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier', 1000, 5000);
    console.log(\`Found \${results.length} results\`);
    console.log(results[0]);
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testScraper().catch(console.error);
\`\`\`

## Performance Tips

1. **Reuse pages**: Create page once per search, reuse for pagination
2. **Parallel requests**: Use \`Promise.all()\` for independent searches
3. **Smart waiting**: Use \`waitForSelector()\` instead of fixed delays
4. **Content reduction**: Use \`textContent\` instead of parsing HTML when possible
5. **Resource blocking**: Block images/media if not needed for scraping

## Common Issues

### Issue: Cloudflare/Bot Detection
**Solution**: Add delays, randomize user agents, use proxy if needed

\`\`\`typescript
await this.rateLimit();
// Add random additional delay
await sleep(Math.random() * 1000);
\`\`\`

### Issue: Stale Element References
**Solution**: Re-query elements after navigation or DOM changes

\`\`\`typescript
const items = await page.locator('.product').all(); // Fresh query
\`\`\`

### Issue: Timeouts on Slow Sites
**Solution**: Increase timeout in options

\`\`\`typescript
const scraper = new AkkelisAudioPlaywright({ timeout: 60000 });
\`\`\`

### Issue: Dynamic Content Not Loading
**Solution**: Wait for specific content and use evaluate() if needed

\`\`\`typescript
await page.waitForFunction(() => {
  return document.querySelectorAll('.product').length > 0;
}, { timeout: 10000 });
\`\`\`
`;
}

/**
 * Generate example converted scraper for reference
 */
function generateExampleScraper(): string {
  return `import { Page } from 'playwright';
import { BaseScraper } from '../BaseScraper';
import { ListingResult, ScraperOptions } from '../types';
import { extractPrice, normalizeUrl, filterByPrice } from '../utils';

/**
 * Example: Playwright-based scraper for Akkelis Audio
 * Demonstrates best practices for HTML-based scrapers
 */
export class AkkelisAudioPlaywright extends BaseScraper {
  constructor(options?: ScraperOptions) {
    super('https://www.akkelisaudio.com', 'Akkelis Audio', options);
  }

  async search(
    query: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<ListingResult[]> {
    if (!query?.trim()) {
      return [];
    }

    const page = await this.newPage();
    try {
      await this.rateLimit();

      // Navigate to Fyndhörnan (Finding Corner) category
      const categoryUrl = \`\${this.baseUrl}/fyndhornan/\`;
      await page.goto(categoryUrl, {
        waitUntil: 'networkidle',
        timeout: this.options.timeout
      });

      // Wait for items to appear
      await page.waitForSelector('.tws-list--grid-item', {
        timeout: 5000
      });

      // Extract all items
      const items = await page.locator('.tws-list--grid-item').all();
      const results: ListingResult[] = [];
      const queryLower = query.toLowerCase();

      for (const item of items) {
        // Extract title
        const titleElement = item.locator('.tws-util-heading--heading a');
        const title = await titleElement.textContent();

        if (!title?.toLowerCase().includes(queryLower)) {
          continue;
        }

        // Extract URL
        const url = await titleElement.getAttribute('href');

        // Extract price
        const priceElement = item.locator(
          '.tws-api--price-current, .tws-api--price-regular'
        );
        const priceText = await priceElement.textContent();
        const price = extractPrice(priceText || '');

        // Extract description
        const descElement = item.locator('.tws-article-labels--label-text');
        const description = await descElement.textContent();

        // Extract image
        const imageElement = item.locator('.tws-img');
        const imageUrl = await imageElement.getAttribute('source');

        const listing: ListingResult = {
          title: title?.trim() || '',
          url: normalizeUrl(url || '', this.baseUrl),
          price,
          description: description?.trim(),
          imageUrl,
          location: undefined,
          postedDate: undefined,
          rawData: { source: 'akkelis' },
        };

        results.push(listing);
      }

      // Filter by price
      return filterByPrice(results, minPrice, maxPrice);
    } finally {
      await page.close();
    }
  }
}

export function createAkkelisAudioPlaywright(
  options?: ScraperOptions
): AkkelisAudioPlaywright {
  return new AkkelisAudioPlaywright(options);
}
`;
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🔍 Analyzing Python scrapers...\n');

    const scrapersDir = path.join(
      __dirname,
      'Scrapers'
    );
    const files = await fs.readdir(scrapersDir);
    const pythonFiles = files.filter((f) => f.endsWith('.py') && f !== '__init__.py');

    const scraperMetadata: ScraperInfo[] = [];

    for (const file of pythonFiles) {
      const filePath = path.join(scrapersDir, file);
      const info = await parseScraperMetadata(filePath);

      if (info) {
        scraperMetadata.push(info);
        console.log(`✓ ${file}`);
        console.log(`  Class: ${info.className}`);
        console.log(`  URL: ${info.baseUrl}`);
        console.log(`  Type: ${info.type}`);
        console.log(`  Features: ${info.features.join(', ') || 'N/A'}`);
        console.log();
      } else {
        console.log(`⚠ ${file} - Could not parse`);
      }
    }

    // Create output directory
    const outputDir = path.join(__dirname, 'SiteScrapers', 'scrapers');
    await fs.mkdir(outputDir, { recursive: true });

    // Generate modules for each scraper
    console.log('\n📝 Generating TypeScript modules...\n');

    const summary: { [key: string]: number } = {
      generated: 0,
      skipped: 0,
    };

    for (const info of scraperMetadata) {
      try {
        const tsContent = generateTypeScriptModule(info);
        const outputFile = path.join(
          outputDir,
          \`\${info.className}.ts\`
        );

        await fs.writeFile(outputFile, tsContent, 'utf-8');
        console.log(
          \`✓ Generated: \${path.relative(__dirname, outputFile)}\`
        );
        summary.generated++;
      } catch (error) {
        console.error(\`✗ Failed to generate module for \${info.name}:\`, error);
        summary.skipped++;
      }
    }

    // Generate conversion guide
    console.log('\n📚 Generating conversion guide...\n');
    const guideFile = path.join(__dirname, 'SiteScrapers', 'CONVERSION_GUIDE.md');
    await fs.writeFile(guideFile, generateConversionGuide(), 'utf-8');
    console.log(\`✓ Generated: \${path.relative(__dirname, guideFile)}\`);

    // Generate example scraper
    const exampleFile = path.join(
      outputDir,
      'AkkelisAudio.example.ts'
    );
    await fs.writeFile(exampleFile, generateExampleScraper(), 'utf-8');
    console.log(\`✓ Generated: \${path.relative(__dirname, exampleFile)}\`);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('✨ Conversion Complete!');
    console.log('='.repeat(60));
    console.log(\`Found and analyzed: \${pythonFiles.length} scrapers\`);
    console.log(\`Successfully processed: \${summary.generated}\`);
    console.log(\`Failed: \${summary.skipped}\`);
    console.log();
    console.log('Next steps:');
    console.log('1. Review generated modules in SiteScrapers/scrapers/');
    console.log('2. Read SiteScrapers/CONVERSION_GUIDE.md for implementation help');
    console.log('3. Study AkkelisAudio.example.ts as a reference implementation');
    console.log('4. Update each scraper\\'s search() method with site-specific logic');
    console.log('5. Test with: npm test');
    console.log();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
