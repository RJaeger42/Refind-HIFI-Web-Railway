# Testing Guide for TypeScript Playwright Scrapers

Complete guide for testing all 15 converted scrapers.

## Table of Contents

1. [Quick Start Testing](#quick-start-testing)
2. [Automated Tests](#automated-tests)
3. [Manual Testing](#manual-testing)
4. [Individual Scraper Testing](#individual-scraper-testing)
5. [Performance Testing](#performance-testing)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start Testing

### 1. Verify Setup

```bash
# Check Node.js and npm versions
node --version  # Should be 14+
npm --version

# Check TypeScript
npx tsc --version
```

### 2. Install Dependencies

```bash
# From project root
npm install playwright
npm install --save-dev typescript @types/node ts-node @playwright/test
```

### 3. Build TypeScript

```bash
# Compile TypeScript to JavaScript
npx tsc

# Or with watch mode for development
npx tsc --watch
```

### 4. Run Quick Sanity Check

```bash
# Test that imports work
node -e "
const { AkkelisAudioPlaywright, HifiPulsPlaywright } = require('./dist/SiteScrapers/index.js');
console.log('✓ Imports successful');
console.log('✓ AkkelisAudio:', new AkkelisAudioPlaywright().name);
console.log('✓ HiFi Puls:', new HifiPulsPlaywright().name);
"
```

---

## Automated Tests

### Unit Tests

```bash
# Install test dependencies if not already
npm install --save-dev @playwright/test

# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/basic.test.ts

# Run with UI mode (visual test debugging)
npx playwright test --ui

# Run with verbose output
npx playwright test --reporter=verbose

# Run single test
npx playwright test -g "extractPrice handles Swedish format"
```

### Test Files

- **`tests/basic.test.ts`** - Unit tests for utilities and interfaces
- **`tests/integration.test.ts`** - Integration tests against real websites

---

## Manual Testing

### Test Script Template

Create a file `test-scraper.ts`:

```typescript
import { chromium } from 'playwright';
import {
  AkkelisAudioPlaywright,
  BlocketPlaywright,
  HifiPulsPlaywright,
  HifiSharkPlaywright,
  TraderaPlaywright,
} from './SiteScrapers';

async function testScrapers() {
  const browser = await chromium.launch({
    headless: false, // See browser window
  });

  try {
    // Test 1: Akkelis Audio
    console.log('\n=== Testing Akkelis Audio ===');
    const akkelis = new AkkelisAudioPlaywright();
    (akkelis as any)['initializeBrowser'](browser);

    try {
      const results = await akkelis.search('amplifier');
      console.log(`✓ Found ${results.length} results`);
      if (results.length > 0) {
        console.log(`✓ Sample: ${results[0].title}`);
        console.log(`✓ Price: ${results[0].price}`);
      }
    } finally {
      await akkelis.close();
    }

    // Test 2: HiFi Puls
    console.log('\n=== Testing HiFi Puls ===');
    const hifiPuls = new HifiPulsPlaywright({
      maxPages: 1,
      requestDelay: 1000,
    });
    (hifiPuls as any)['initializeBrowser'](browser);

    try {
      const results = await hifiPuls.search('speaker');
      console.log(`✓ Found ${results.length} results`);
      if (results.length > 0) {
        console.log(`✓ Sample: ${results[0].title}`);
      }
    } finally {
      await hifiPuls.close();
    }

    // Test 3: Blocket
    console.log('\n=== Testing Blocket ===');
    const blocket = new BlocketPlaywright({
      timeout: 30000,
    });
    (blocket as any)['initializeBrowser'](browser);

    try {
      const results = await blocket.search('turntable');
      console.log(`✓ Found ${results.length} results`);
      if (results.length > 0) {
        console.log(`✓ Sample: ${results[0].title}`);
      }
    } finally {
      await blocket.close();
    }

    console.log('\n✅ All manual tests passed!\n');
  } finally {
    await browser.close();
  }
}

testScrapers().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
```

### Run Manual Tests

```bash
# Compile and run
npx ts-node test-scraper.ts

# Or compile then run
npx tsc test-scraper.ts
node test-scraper.js
```

---

## Individual Scraper Testing

### Test Each Scraper Separately

#### 1. AkkelisAudio

```typescript
import { chromium } from 'playwright';
import { AkkelisAudioPlaywright } from './SiteScrapers';

async function testAkkelis() {
  const browser = await chromium.launch({ headless: true });
  const scraper = new AkkelisAudioPlaywright();
  (scraper as any)['initializeBrowser'](browser);

  try {
    // Test basic search
    const results = await scraper.search('amplifier');
    console.log(`Results: ${results.length}`);

    // Test with price filter
    const filtered = await scraper.search('speaker', 2000, 5000);
    console.log(`Filtered (2k-5k): ${filtered.length}`);

    // Check result structure
    if (results[0]) {
      console.log('Sample result:');
      console.log(`  Title: ${results[0].title}`);
      console.log(`  Price: ${results[0].price}`);
      console.log(`  URL: ${results[0].url}`);
      console.log(`  Image: ${results[0].imageUrl}`);
    }
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testAkkelis();
```

#### 2. HiFi Puls (Paginated)

```typescript
import { chromium } from 'playwright';
import { HifiPulsPlaywright } from './SiteScrapers';

async function testHifiPuls() {
  const browser = await chromium.launch();
  const scraper = new HifiPulsPlaywright({
    maxPages: 2,
    requestDelay: 1000,
  });
  (scraper as any)['initializeBrowser'](browser);

  try {
    // Test pagination
    const results = await scraper.search('amplifier');
    console.log(`Found ${results.length} results across pages`);

    // Check for duplicates
    const urls = new Set(results.map(r => r.url));
    console.log(`Unique URLs: ${urls.size}/${results.length}`);

    // Verify all have required fields
    const valid = results.every(r => r.title && r.url);
    console.log(`All valid: ${valid}`);
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testHifiPuls();
```

#### 3. Blocket (Complex Lazy Loading)

```typescript
import { chromium } from 'playwright';
import { BlocketPlaywright } from './SiteScrapers';

async function testBlocket() {
  const browser = await chromium.launch();
  const scraper = new BlocketPlaywright({
    timeout: 45000,
  });
  (scraper as any)['initializeBrowser'](browser);

  try {
    // Test basic search
    const results = await scraper.search('turntable');
    console.log(`Found ${results.length} results`);

    // Test with price filter
    const expensive = await scraper.search('amplifier', 5000, 15000);
    console.log(`Expensive items (5k-15k): ${expensive.length}`);

    // Verify price extraction
    const withPrice = results.filter(r => r.price !== undefined);
    console.log(`Results with price: ${withPrice.length}/${results.length}`);
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testBlocket();
```

#### 4. HiFi Shark (JavaScript Context)

```typescript
import { chromium } from 'playwright';
import { HifiSharkPlaywright } from './SiteScrapers';

async function testHifiShark() {
  const browser = await chromium.launch();
  const scraper = new HifiSharkPlaywright({
    timeout: 45000,
  });
  (scraper as any)['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier');
    console.log(`Found ${results.length} results`);

    // Verify page context extraction worked
    if (results.length > 0) {
      console.log('✓ Successfully extracted from page context');
      console.log(`Sample: ${results[0].title}`);
      console.log(`Location: ${results[0].location}`);
    }
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testHifiShark();
```

#### 5. Tradera (Marketplace with Deduplication)

```typescript
import { chromium } from 'playwright';
import { TraderaPlaywright } from './SiteScrapers';

async function testTradera() {
  const browser = await chromium.launch();
  const scraper = new TraderaPlaywright({
    maxPages: 2,
  });
  (scraper as any)['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier');
    console.log(`Found ${results.length} results`);

    // Check for deduplication
    const urls = new Set(results.map(r => r.url));
    if (urls.size === results.length) {
      console.log('✓ No duplicates detected');
    } else {
      console.log(`⚠ Found ${results.length - urls.size} potential duplicates`);
    }

    // Verify marketplace fields
    const withStatus = results.filter(r => r.rawData?.status);
    console.log(`Items with status: ${withStatus.length}`);
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testTradera();
```

#### 6. ReferenceAudio (Ashop e-commerce)

```typescript
import { chromium } from 'playwright';
import { ReferenceAudioPlaywright } from './SiteScrapers';

async function testReferenceAudio() {
  const browser = await chromium.launch();
  const scraper = new ReferenceAudioPlaywright();
  (scraper as any)['initializeBrowser'](browser);

  try {
    const results = await scraper.search('amplifier');
    console.log(`Found ${results.length} results`);

    // Verify Ashop-specific fields
    const withProductId = results.filter(r => r.rawData?.product_id);
    console.log(`Items with product ID: ${withProductId.length}`);

    // Check price extraction
    const withPrice = results.filter(r => r.price !== undefined);
    console.log(`Items with price: ${withPrice.length}`);
  } finally {
    await scraper.close();
    await browser.close();
  }
}

testReferenceAudio();
```

---

## Performance Testing

### Test Parallel Scraping

```typescript
import { chromium } from 'playwright';
import {
  AkkelisAudioPlaywright,
  HifiPulsPlaywright,
  TraderaPlaywright,
} from './SiteScrapers';

async function testParallel() {
  const browser = await chromium.launch();
  const query = 'amplifier';

  const start = Date.now();

  const scrapers = [
    new AkkelisAudioPlaywright(),
    new HifiPulsPlaywright({ maxPages: 1 }),
    new TraderaPlaywright({ maxPages: 1 }),
  ];

  for (const scraper of scrapers) {
    (scraper as any)['initializeBrowser'](browser);
  }

  try {
    // Run in parallel
    const results = await Promise.all(
      scrapers.map(s => s.search(query))
    );

    const elapsed = Date.now() - start;

    console.log('=== Parallel Search Results ===');
    console.log(`Time elapsed: ${elapsed}ms`);
    results.forEach((r, i) => {
      console.log(`Scraper ${i}: ${r.length} results`);
    });

    const total = results.flat().length;
    console.log(`Total results: ${total}`);
    console.log(`Average per scraper: ${(total / results.length).toFixed(1)}`);
  } finally {
    for (const scraper of scrapers) {
      await scraper.close();
    }
    await browser.close();
  }
}

testParallel();
```

### Test Rate Limiting

```typescript
import { chromium } from 'playwright';
import { HifiPulsPlaywright } from './SiteScrapers';

async function testRateLimiting() {
  const browser = await chromium.launch();

  // Test with different delays
  for (const delay of [500, 1000, 2000]) {
    const scraper = new HifiPulsPlaywright({
      requestDelay: delay,
      maxPages: 2,
    });
    (scraper as any)['initializeBrowser'](browser);

    const start = Date.now();

    try {
      const results = await scraper.search('test');
      const elapsed = Date.now() - start;

      console.log(`Delay: ${delay}ms - Completed in ${elapsed}ms`);
    } finally {
      await scraper.close();
    }
  }

  await browser.close();
}

testRateLimiting();
```

---

## Test Checklist

### Basic Functionality

- [ ] All scrapers compile without TypeScript errors
- [ ] All scrapers can be imported
- [ ] All scrapers have correct name and baseUrl
- [ ] All scrapers implement search() method
- [ ] All scrapers implement close() method

### Search Functionality

- [ ] Search returns array of ListingResult
- [ ] Search handles empty query (returns empty array)
- [ ] Search handles valid query
- [ ] Search supports minPrice parameter
- [ ] Search supports maxPrice parameter
- [ ] Price filtering works correctly

### Data Quality

- [ ] Results have non-empty title
- [ ] Results have valid URL (starts with http)
- [ ] Price extraction works (when present)
- [ ] URL normalization works (relative → absolute)
- [ ] No duplicate URLs in results

### Error Handling

- [ ] Scraper handles network errors gracefully
- [ ] Scraper handles timeout correctly
- [ ] Scraper cleans up resources (close())
- [ ] Scraper doesn't crash on invalid input

### Performance

- [ ] Single search completes in reasonable time
- [ ] Parallel searches work
- [ ] Rate limiting prevents too many requests
- [ ] Memory usage stays reasonable

---

## Troubleshooting Tests

### Test Fails: "Browser not initialized"

**Solution**: Make sure to call `initializeBrowser()` before `search()`:

```typescript
const scraper = new MyScraperPlaywright();
(scraper as any)['initializeBrowser'](browser);
await scraper.search(query);
```

### Test Fails: "Timeout"

**Solution**: Increase timeout for slow sites:

```typescript
const scraper = new SlowSitePlaywright({
  timeout: 60000, // 60 seconds
});
```

### Test Fails: "No results found"

**Causes**:
1. Website structure changed (selectors no longer match)
2. Website requires authentication
3. Query doesn't match any products
4. Network issue preventing page load

**Debugging**:
```typescript
// Run with browser visible
const browser = await chromium.launch({ headless: false });

// Add delays to inspect page
await page.waitForTimeout(5000);
```

### Test Fails: "Import errors"

**Solution**: Rebuild TypeScript:
```bash
npx tsc --noEmit  # Check for errors
npx tsc           # Rebuild
```

### Test Fails: "Port already in use"

**Solution**: Kill existing Playwright process:
```bash
# On Mac/Linux
lsof -i :3000
kill -9 <PID>

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## CI/CD Testing

### GitHub Actions Example

```yaml
name: Test Scrapers

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Build TypeScript
        run: npx tsc

      - name: Run unit tests
        run: npx playwright test tests/basic.test.ts

      - name: Run integration tests
        run: npx playwright test tests/integration.test.ts
```

---

## Manual Smoke Tests

Quick manual tests to verify scrapers work:

```bash
# Test 1: Can we import?
node -e "require('./dist/SiteScrapers')" && echo "✓ Import OK"

# Test 2: Do all scrapers exist?
node -e "
const {
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
} = require('./dist/SiteScrapers');
console.log('✓ All 12 main scrapers import OK');
"

# Test 3: Can we create instances?
node -e "
const { AkkelisAudioPlaywright } = require('./dist/SiteScrapers');
const s = new AkkelisAudioPlaywright();
console.log('✓ Instance created:', s.name);
"
```

---

## Summary

Testing pyramid:

```
        ┌─────────────────┐
        │  Manual Testing │  (Ad-hoc testing of specific scenarios)
        ├─────────────────┤
        │ Integration     │  (Tests against real websites)
        │ Tests           │
        ├─────────────────┤
        │ Unit Tests      │  (Utilities, interfaces, signatures)
        ├─────────────────┤
        │ Smoke Tests     │  (Quick sanity checks)
        └─────────────────┘
```

**Recommended testing order:**
1. Smoke tests (2 min)
2. Unit tests (5 min)
3. Integration tests (10-20 min)
4. Manual tests (variable)

Total time: ~30-40 minutes for comprehensive testing

---

## Next Steps

After testing passes:

1. ✅ Verify all 15 scrapers work
2. ✅ Check results match expected format
3. ✅ Validate price extraction
4. ✅ Test error handling
5. 🚀 Deploy to production

---

See `TESTING_GUIDE.md` in the root for more details!
