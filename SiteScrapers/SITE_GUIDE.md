# Site-Specific Implementation Guide

Detailed conversion guides for each of the 15 Swedish HiFi retailer websites.

## 1. Akkelis Audio ✓ (Converted)

**File**: `Scrapers/akkelisaudio.py`
**Status**: ✅ Implemented
**URL**: https://www.akkelisaudio.com
**Type**: Static category page (Fyndhörnan)

### How it works

1. Loads `/fyndhornan/` (Finding Corner/Sale items)
2. Items are pre-loaded in HTML
3. No pagination, single page
4. Uses grid layout with CSS classes

### Key selectors

- Container: `.tws-list--grid-item`
- Title: `.tws-util-heading--heading a`
- Price: `.tws-api--price-current` or `.tws-api--price-regular`
- Image: `.tws-img` (use `source` attribute)
- Description: `.tws-article-labels--label-text`

### Implementation notes

- Simple selector-based scraping
- No pagination needed
- Items always displayed on category page
- User-Agent required (already included)

---

## 2. Audio Concept

**File**: `Scrapers/audioconcept.py`
**Status**: ⏳ Pending conversion
**URL**: [from Python file]
**Type**: Small stub (needs Python analysis)

### Status

Only 198 bytes - appears to be a stub or redirect wrapper. Check if this is a real scraper or if it's handled by common.py.

---

## 3. Audio Performance

**File**: `Scrapers/audioperformance.py`
**Status**: ⏳ Pending conversion
**URL**: [from Python file]
**Type**: Small stub

### Status

Only 208 bytes - stub file. This may be handled by `StarwebSearchScraper` in common.py. Requires investigation of actual website.

---

## 4. Blocket

**File**: `Scrapers/blocket.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.blocket.se
**Type**: Marketplace (complex pagination)

### How it works

1. Search endpoint: `/search?q={query}`
2. Results paginated with `?page={n}`
3. JSON data embedded in HTML script tags
4. Each listing has multiple images/details

### Key points

- **Pagination**: Query parameter `page`
- **Data format**: JSON in HTML script tag (common pattern)
- **Challenge**: Infinite scroll vs pagination
- **Extract selector**: `script[type="application/json"]`
- **Default max pages**: 5 (config option)

### Implementation pattern

```typescript
// Navigate to search
await page.goto(`${this.baseUrl}/search?q=${query}&page=${page}`);

// Extract JSON from script tag
const data = await page.evaluate(() => {
  const script = document.querySelector('script[type="application/json"]');
  return JSON.parse(script?.textContent || '{}');
});

// Parse listings
const listings = data.listings.map(item => ({
  title: item.title,
  url: item.url,
  price: extractPrice(item.price),
  imageUrl: item.images[0]?.url,
  location: item.location,
  postedDate: item.posted_at,
}));
```

---

## 5. Common (Ashop CMS)

**File**: `Scrapers/common.py`
**Status**: ⏳ Pending conversion
**URL**: Multiple sites (see below)
**Type**: Ashop e-commerce platform

### Used by

- Reference Audio: https://www.referenceaudio.se
- Ljudmakarn: https://www.ljudmakarn.se
- HiFi Punkten: https://www.hifipunkten.se

### How it works

1. Uses `:product-data` attribute on HTML element
2. Contains JSON with all product information
3. Single page or paginated (varies)
4. Decoded from HTML entities

### Key challenge

Products stored in HTML attribute as JSON string with HTML entities:
```html
<div :product-data="&quot;{...products...}&quot;">
```

### Implementation pattern

```typescript
// Navigate to category page
await page.goto(`${this.categoryUrl}`);

// Wait for product data
await page.waitForSelector('[\\:product-data]');

// Extract JSON from attribute
const data = await page.evaluate(() => {
  const node = document.querySelector('[\\:product-data]');
  if (!node) return { products: [] };

  // Decode HTML entities
  const json = (node.getAttribute(':product-data') || '{}')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  return JSON.parse(json);
});

// Filter products by query
const matched = data.products.filter(p => {
  const haystack = [
    p.product_name,
    p.product_title,
    p.product_info_puff,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
});
```

### Fields to extract

- `product_name`: Primary title
- `product_title`: Alternative title
- `product_display_price` / `product_price`: Price
- `product_info_puff`: Description
- `product_puff_image`: Image URL
- `product_url` / `product_link`: Listing URL
- `tags`: Location/store info (array)

---

## 6. Facebook Marketplace

**File**: `Scrapers/facebook.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.facebook.com/marketplace
**Type**: Dynamic JavaScript-rendered content

### Challenges

- **Authentication**: May require login
- **JavaScript rendering**: Content loaded after page load
- **Anti-scraping**: Facebook actively blocks bots
- **Dynamic content**: Infinite scroll vs pagination

### Implementation strategy

```typescript
// Option 1: Use existing Facebook session
const context = await browser.newContext({
  storageState: 'facebook-state.json', // Pre-saved login state
});

// Navigate to search
const page = await context.newPage();
await page.goto(`${this.baseUrl}/marketplace/search?query=${query}`);

// Wait for JavaScript to render listings
await page.waitForFunction(
  () => document.querySelectorAll('[role="article"]').length > 0,
  { timeout: 10000 }
);

// Extract listings
const listings = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('[role="article"]')).map(article => {
    const titleElement = article.querySelector('a span');
    const priceElement = article.querySelector('[role="img"][aria-label*="kr"]');

    return {
      title: titleElement?.textContent || '',
      url: article.querySelector('a')?.href || '',
      price: extractPrice(priceElement?.getAttribute('aria-label') || ''),
      imageUrl: article.querySelector('img')?.src,
      location: article.querySelector('[role="img"][aria-label*="location"]')?.getAttribute('aria-label'),
    };
  });
});
```

### Considerations

- Pre-authenticate by saving browser state: `context.storageState('facebook-state.json')`
- Handle anti-scraping measures with delays and realistic user-agent
- Monitor for "login required" dialog
- Consider using playwright-extra with stealth plugin

---

## 7. HiFi Experience

**File**: `Scrapers/hifiexperience.py`
**Status**: ⏳ Pending conversion
**URL**: [from Python file]
**Type**: Small stub

### Status

Only 209 bytes - check if this is a valid site or handled elsewhere.

---

## 8. HiFi Punkten

**File**: `Scrapers/hifipunkten.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.hifipunkten.se
**Type**: Ashop e-commerce (see Common)

### Implementation

Use the **Common (Ashop CMS)** pattern with this category URL:
```typescript
this.categoryUrl = 'https://www.hifipunkten.se/high-end-hogtalare/';
```

---

## 9. HiFi Puls ✓ (Converted)

**File**: `Scrapers/hifipuls.py`
**Status**: ✅ Implemented
**URL**: https://www.hifipuls.se
**Type**: PrestaShop paginated search

### How it works

1. PrestaShop e-commerce platform
2. Search via `/search?controller=search&search_query={query}&page={page}`
3. Results in paginated HTML lists
4. Up to 5 pages (configurable)

### Key selectors

- Container: `ul.product_list li.ajax_block_product`
- Title: `.product-name`
- Price: `.product-price`
- Image: `.product-image-container img` (use `data-original`)
- Description: `.product-desc`
- Stock: `.availability` or `.product-reference`

### Implementation notes

- Standard PrestaShop layout
- Pagination by page parameter
- Images in data-original attribute (lazy loading)
- Rate limit recommended (2s between pages)

---

## 10. HiFi Shark

**File**: `Scrapers/hifishark.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.hifishark.se
**Type**: Paginated HTML search

### How it works

1. Search page: `/search?q={query}`
2. Pagination: `?q={query}&page={page}`
3. Items displayed in grid or list
4. Price may include special characters

### Implementation pattern

```typescript
async search(query, minPrice?, maxPrice?) {
  const results = [];
  let page = 1;

  while (page <= this.options.maxPages) {
    const playwright = await this.newPage();
    try {
      const url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}&page=${page}`;
      await playwright.goto(url);

      const items = await playwright.locator('.product-item, .hifi-item').all();
      if (items.length === 0) break;

      for (const item of items) {
        const title = await item.locator('.product-title, h3').textContent();
        const url = await item.locator('a').getAttribute('href');
        const price = await item.locator('.product-price, .price').textContent();

        results.push({
          title: title?.trim() || '',
          url: normalizeUrl(url || '', this.baseUrl),
          price: extractPrice(price || ''),
          description: await item.locator('.product-desc').textContent(),
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

---

## 11. HiFi Torget

**File**: `Scrapers/hifitorget.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.hifitorget.se
**Type**: Paginated search (possibly with filters)

### Implementation pattern

Similar to HiFi Shark, adjust selectors for site structure.

---

## 12. Ljudmakarn

**File**: `Scrapers/ljudmakarn.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.ljudmakarn.se
**Type**: Ashop e-commerce (see Common)

### Implementation

Use the **Common (Ashop CMS)** pattern with:
```typescript
this.categoryUrl = 'https://www.ljudmakarn.se/';
```

---

## 13. Lasseshifi

**File**: `Scrapers/lasseshifi.py`
**Status**: ⏳ Pending conversion
**URL**: [from Python file]
**Type**: Small stub

### Status

Only 299 bytes - verify if this is a real site or wrapper.

---

## 14. Reference Audio

**File**: `Scrapers/referenceaudio.py`
**Status**: ⏳ Pending conversion
**URL**: https://www.referenceaudio.se
**Type**: Ashop e-commerce (see Common)

### Implementation

Use the **Common (Ashop CMS)** pattern with category URL from site.

---

## 15. Rehifi

**File**: `Scrapers/rehifi.py`
**Status**: ⏳ Pending conversion
**URL**: [from Python file]
**Type**: Starweb e-commerce platform

### How it works

1. Uses Starweb (alternative e-commerce platform)
2. Search endpoint: `{baseUrl}/search?q={query}&page={page}`
3. Results in HTML list format
4. Similar pattern to Tradera but different selectors

### Implementation pattern

```typescript
async search(query, minPrice?, maxPrice?) {
  const results = [];
  let page = 1;

  while (page <= this.options.maxPages) {
    await this.rateLimit();

    const playwright = await this.newPage();
    try {
      const params = new URLSearchParams({ q: query, page: page.toString() });
      const url = `${this.baseUrl}/search?${params}`;
      await playwright.goto(url);

      const items = await playwright.locator('.product-item, li.gallery-item').all();
      if (items.length === 0) break;

      for (const item of items) {
        const link = item.locator('a.gallery-info-link, a.product-link');
        const titleTag = item.locator('.description h3, .product-name');
        const priceTag = item.locator('.product-price .amount, .price');

        results.push({
          title: await titleTag.textContent() || '',
          url: normalizeUrl(await link.getAttribute('href') || '', this.baseUrl),
          price: extractPrice(await priceTag.textContent() || ''),
          description: await item.locator('.product-sku, .sku').textContent(),
          imageUrl: await item.locator('img').getAttribute('data-src'),
          location: await item.locator('.stock-status').textContent(),
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

---

## 16. Tradera ✓ (Converted)

**File**: `Scrapers/tradera.py`
**Status**: ✅ Implemented
**URL**: https://www.tradera.com
**Type**: Complex auction marketplace

### How it works

1. Search page: `/search?q={query}`
2. Paginated results with `page` parameter
3. Listings have auction details (current bid, ends in, etc.)
4. Multiple images per listing
5. Deduplication by URL (important!)

### Key features

- Auction items (not fixed price)
- Time-sensitive (ends in X hours)
- Seller ratings
- Multiple images
- Duplicate detection needed

### Implementation notes

- Use deduplication set for URLs
- Handle "auction ends" time display
- Extract current price vs starting price
- Optional: Extract auction end time
- Rate limit important for large marketplaces

---

## Common Implementation Challenges

### Challenge 1: Cloudflare/WAF Blocking

**Symptoms**: 403 Forbidden, "Access Denied"

**Solutions**:
1. Add realistic delays
2. Set User-Agent headers (done by default)
3. Add Referer header
4. Use playwright-extra with stealth plugin

```typescript
const browser = await chromium.launch();
await page.setExtraHTTPHeaders({
  'Referer': this.baseUrl,
  'Accept-Language': 'sv-SE,sv;q=0.9',
});
```

### Challenge 2: Dynamic Content Not Loading

**Symptoms**: Page loads but no items found

**Solutions**:
1. Wait longer for JavaScript
2. Check if content is in JSON instead of DOM
3. Use `waitForFunction` instead of fixed delays

```typescript
await page.waitForFunction(
  () => document.querySelectorAll('.item').length > 0,
  { timeout: 10000 }
);
```

### Challenge 3: Pagination Limits

**Symptoms**: Site only allows viewing first 5-10 pages

**Solutions**:
1. Respect the limit (cache old results)
2. Set `maxPages` option to site's limit
3. Consider alternative: API if available
4. Use filter parameters instead of pagination

### Challenge 4: Currency/Price Parsing

**Symptoms**: Wrong price values extracted

**Solutions**:
1. Use provided `extractPrice()` utility
2. Handle both dot and comma separators
3. Strip currency symbols first
4. Test with real prices from site

### Challenge 5: Rate Limiting

**Symptoms**: IP gets blocked after many requests

**Solutions**:
1. Enable rate limiting: `{ requestDelay: 2000 }`
2. Increase delay if still blocked
3. Use rotating proxies for large jobs
4. Cache results aggressively

---

## Conversion Priority

Recommended order for conversion based on complexity and frequency of use:

1. ✅ **Akkelis Audio** - Simple (done)
2. ✅ **HiFi Puls** - Paginated (done)
3. ✅ **Tradera** - Complex (done)
4. 🔴 **Blocket** - High priority, common marketplace
5. 🔴 **Common (Ashop)** - Powers 3 sites
6. 🟡 **HiFi Shark** - Medium complexity
7. 🟡 **HiFi Torget** - Similar to HiFi Shark
8. 🟡 **Rehifi** - Starweb platform
9. 🟢 **Facebook** - Low priority (tricky auth)
10. 🟢 **Stub files** - Investigate first

---

## Testing Each Scraper

Once implemented, test with:

```bash
# Test single scraper
npm test -- SiteName

# Run with debugging
DEBUG=* npm test

# Test with real browser (not headless)
node -e "
const { chromium } = require('playwright');
const scraper = require('./dist/scrapers/SiteName').default;
(async () => {
  const browser = await chromium.launch({ headless: false });
  const s = new scraper();
  s['initializeBrowser'](browser);
  const results = await s.search('test');
  console.log(results);
  await browser.close();
})();
"
```

---

## Resources

- [Playwright Selectors](https://playwright.dev/docs/locators)
- [CSS Selectors Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors)
- [XPath Guide](https://developer.mozilla.org/en-US/docs/Web/XPath)
- [Regular Expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)
