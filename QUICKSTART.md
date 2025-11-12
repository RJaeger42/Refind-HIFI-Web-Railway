# Quick Start Guide

## What You Got

A complete TypeScript/Playwright web scraper framework with:
- ✅ Type-safe interfaces for all scrapers
- ✅ 3 fully working example implementations
- ✅ Shared utilities (price extraction, URL normalization, etc.)
- ✅ Comprehensive documentation for converting remaining 12 scrapers
- ✅ Configuration templates
- ✅ Ready-to-use BaseScraper class

## 5-Minute Setup

### 1. Install Dependencies
```bash
npm install playwright
npm install --save-dev typescript @types/node ts-node
```

### 2. Setup Configuration
```bash
cp SiteScrapers/package.json.template package.json
cp SiteScrapers/tsconfig.json.template tsconfig.json
```

### 3. Compile TypeScript
```bash
npx tsc
```

### 4. Test It Works
```bash
node -e "
const { chromium } = require('playwright');
const { AkkelisAudioPlaywright } = require('./dist/SiteScrapers/scrapers/AkkelisAudio');

(async () => {
  const browser = await chromium.launch();
  const scraper = new AkkelisAudioPlaywright();
  scraper['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier');
    console.log(\`Found \${results.length} results\`);
    if (results.length > 0) console.log(results[0]);
  } finally {
    await scraper.close();
    await browser.close();
  }
})();
"
```

## What's Where

| What | Where | Purpose |
|------|-------|---------|
| **Core types** | `SiteScrapers/types.ts` | TypeScript interfaces |
| **Base class** | `SiteScrapers/BaseScraper.ts` | Abstract class all scrapers extend |
| **Utilities** | `SiteScrapers/utils.ts` | Price extraction, URL normalization, etc. |
| **Exports** | `SiteScrapers/index.ts` | Main module export file |
| **Examples** | `SiteScrapers/scrapers/` | 3 working implementations |
| **How-to guide** | `CONVERSION_GUIDE.md` | Step-by-step conversion instructions |
| **Site details** | `SITE_GUIDE.md` | Specific info for each site |
| **Main docs** | `SiteScrapers/README.md` | Full API documentation |
| **This file** | `IMPLEMENTATION_SUMMARY.md` | Complete overview |

## 3 Working Examples

### 1. Akkelis Audio (Simple)
```typescript
import { chromium } from 'playwright';
import { AkkelisAudioPlaywright } from './SiteScrapers';

const browser = await chromium.launch();
const scraper = new AkkelisAudioPlaywright();
scraper['initializeBrowser'](browser);
const results = await scraper.search('speaker');
```

### 2. HiFi Puls (Paginated)
```typescript
const scraper = new HifiPulsPlaywright({ maxPages: 5 });
scraper['initializeBrowser'](browser);
const results = await scraper.search('amplifier', 1000, 5000); // price filter
```

### 3. Tradera (Complex)
```typescript
const scraper = new TraderaPlaywright({ requestDelay: 2000 });
scraper['initializeBrowser'](browser);
const results = await scraper.search('vintage amplifier');
```

## Convert the Next Scraper

1. **Choose a site** from `SITE_GUIDE.md`
2. **Read its section** for implementation details
3. **Create file**: `SiteScrapers/scrapers/SiteName.ts`
4. **Copy template**:
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
    // TODO: Implement search
    throw new Error('Not yet implemented');
  }
}
```

5. **Implement search()** using patterns from CONVERSION_GUIDE.md
6. **Test it** with real searches
7. **Update index.ts** to export the new scraper
8. **Compile** with `npm run build`

## Common Tasks

### Search One Site
```typescript
const scraper = new AkkelisAudioPlaywright();
scraper['initializeBrowser'](browser);
const results = await scraper.search('amplifier');
```

### Search Multiple Sites in Parallel
```typescript
const scrapers = [
  new AkkelisAudioPlaywright(),
  new HifiPulsPlaywright(),
  new TraderaPlaywright(),
];

for (const s of scrapers) s['initializeBrowser'](browser);

const results = await Promise.all(
  scrapers.map(s => s.search('speaker'))
);

const allResults = results.flat().sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
```

### Filter by Price
```typescript
import { filterByPrice } from './SiteScrapers';

const affordable = filterByPrice(results, 1000, 5000); // 1k-5k
const expensive = filterByPrice(results, 10000); // Over 10k
```

### Extract Price
```typescript
import { extractPrice } from './SiteScrapers';

const price = extractPrice('1.234,56 kr'); // Returns: 1234.56
```

### Normalize URLs
```typescript
import { normalizeUrl } from './SiteScrapers';

const fullUrl = normalizeUrl('/products/123', 'https://example.com');
// Returns: https://example.com/products/123
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Browser context not initialized" | Call `scraper['initializeBrowser'](browser)` |
| "Page timeout" | Increase timeout: `{ timeout: 60000 }` |
| "No results found" | Check CSS selectors, site may have changed |
| "IP blocked" | Increase delay: `{ requestDelay: 5000 }` |
| TypeScript errors | Run `npm run build` to see full error list |

## Next Steps

1. ✅ Read this file (you are here)
2. → Read `CONVERSION_GUIDE.md` for detailed instructions
3. → Read `SITE_GUIDE.md` for your target site
4. → Create next scraper file
5. → Test with real searches
6. → Repeat until all 15 are converted

## File Checklist

### Core Files (Always Present)
- [x] `SiteScrapers/types.ts` - TypeScript definitions
- [x] `SiteScrapers/BaseScraper.ts` - Base class
- [x] `SiteScrapers/utils.ts` - Utility functions
- [x] `SiteScrapers/index.ts` - Main exports

### Documentation
- [x] `SiteScrapers/README.md` - API docs
- [x] `SiteScrapers/CONVERSION_GUIDE.md` - How to convert
- [x] `SiteScrapers/SITE_GUIDE.md` - Per-site details
- [x] `IMPLEMENTATION_SUMMARY.md` - Full overview
- [x] `QUICKSTART.md` - This file

### Configuration Templates
- [x] `SiteScrapers/package.json.template` - NPM config
- [x] `SiteScrapers/tsconfig.json.template` - TypeScript config

### Example Implementations
- [x] `SiteScrapers/scrapers/AkkelisAudio.ts` - Simple pattern
- [x] `SiteScrapers/scrapers/HifiPuls.ts` - Paginated pattern
- [x] `SiteScrapers/scrapers/Tradera.ts` - Complex pattern

### Conversion Script
- [x] `convert-scrapers.ts` - Automated analysis tool

## Conversion Priority

1. **Done** (3/15)
   - Akkelis Audio ✅
   - HiFi Puls ✅
   - Tradera ✅

2. **High Priority** (Next 4)
   - Blocket (popular marketplace)
   - Common/Ashop (powers 3 sites)
   - HiFi Shark (similar to HiFi Puls)
   - HiFi Torget (paginated search)

3. **Medium Priority** (3 sites)
   - Rehifi (Starweb platform)
   - Facebook (complex, auth required)
   - Stub files (verify if real)

## Key Features

- ✨ Consistent `SiteScraper` interface
- 🎭 Playwright browser automation
- 🏃 Fully asynchronous
- 🔧 Reusable utilities
- 📝 Type-safe TypeScript
- ⚙️ Configurable options
- 🧪 Easy to test
- 📚 Comprehensive docs

## Performance Tips

1. Reuse browser across multiple scrapers
2. Use `Promise.all()` for parallel searches
3. Adjust `requestDelay` based on site
4. Cache results to avoid re-scraping
5. Monitor timeout and increase if needed

## Resources

- **Playwright Docs**: https://playwright.dev
- **CSS Selectors**: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/

## Questions?

1. Check `SiteScrapers/README.md` for API docs
2. Check `CONVERSION_GUIDE.md` for how-to guides
3. Check `SITE_GUIDE.md` for your specific site
4. Review example implementations in `scrapers/`

---

**You're all set! Start converting the next scraper.** 🚀
