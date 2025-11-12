# Test Viewer Guide - Viewing Actual Search Results

This guide explains how to use the new test scripts to view actual search results from your scrapers.

## Overview

Two new test scripts have been created to help you see real search results with columns for **Product**, **Site**, **Price**, and **Date**:

1. **`test:view`** - Test a single scraper
2. **`test:all`** - Test all scrapers and compare results

## Using test:view - Single Scraper Results

Test a specific scraper with a search query.

### Basic Usage

```bash
npm run test:view <scraper-name> <query> [minPrice] [maxPrice]
```

### Examples

**Search for amplifiers on AkkelisAudio:**
```bash
npm run test:view akkelisaudio amplifier
```

**Search for speakers on HiFi Puls with price range:**
```bash
npm run test:view hifipuls speaker 1000 5000
```

**Search for turntables on Tradera:**
```bash
npm run test:view tradera turntable
```

**Search for receivers on Blocket (budget range):**
```bash
npm run test:view blocket receiver 500 2000
```

### Available Scrapers

- `akkelisaudio`
- `audioconcept`
- `audioperformance`
- `blocket`
- `facebook`
- `hifiexperience`
- `hifipuls`
- `hifipunkten`
- `hifishark`
- `hifitorget`
- `ljudmakarn`
- `lasseshifi`
- `referenceaudio`
- `rehifi`
- `tradera`

### Example Output

```
🔍 Fetching results...

Scraper: akkelisaudio
Query: "amplifier"

========================================================================================================================

📦 Found 3 results

Product                         Site               Price        Date
Amplifier Pro                   akkelisaudio       1.500 kr     2024-01-15
Amplifier Mini                  akkelisaudio       2.500 kr     2024-01-14
Power Amp                        akkelisaudio       3.000 kr     2024-01-13

========================================================================================================================
📋 DETAILED RESULTS

Result 1:
  Product:     Amplifier Pro
  Site:        AKKELISAUDIO
  Price:       1.500 kr
  Date:        2024-01-15
  Location:    Stockholm
  Description: High quality amplifier for home..
  URL:         https://www.akkelisaudio.com/product/123

Result 2:
  Product:     Amplifier Mini
  Site:        AKKELISAUDIO
  Price:       2.500 kr
  Date:        2024-01-14
  Location:    Gothenburg
  Description: Compact amplifier perfect for..
  URL:         https://www.akkelisaudio.com/product/124

...
```

## Using test:all - Compare All Scrapers

Test all scrapers simultaneously and compare results across sites.

### Basic Usage

```bash
npm run test:all <query> [minPrice] [maxPrice]
```

### Examples

**Compare amplifier prices across all sites:**
```bash
npm run test:all amplifier
```

**Compare speakers with price filter across all sites:**
```bash
npm run test:all speaker 1000 5000
```

**Budget turntables:**
```bash
npm run test:all turntable 500 1500
```

### Example Output

```
🔄 Testing all scrapers...

Query: "amplifier"

========================================================================================================================

⏳ Testing akkelisaudio...
✅ Found 3 results

⏳ Testing blocket...
✅ Found 7 results

⏳ Testing hifipuls...
✅ Found 5 results

...

========================================================================================================================

📊 SUMMARY

Scrapers tested: 15
Successful: 14
Total results: 85

Results per scraper:
  akkelisaudio             ✅ 3 results
  audioconcept             ✅ 0 results
  audioperformance         ✅ 2 results
  blocket                  ✅ 7 results
  facebook                 ⚠️  Error: Network timeout
  hifiexperience           ✅ 0 results
  hifipuls                 ✅ 5 results
  hifipunkten              ✅ 4 results
  hifishark                ✅ 8 results
  hifitorget               ✅ 3 results
  ljudmakarn               ✅ 2 results
  lasseshifi               ✅ 0 results
  referenceaudio           ✅ 6 results
  rehifi                   ✅ 5 results
  tradera                  ✅ 33 results

========================================================================================================================

📋 TOP RESULTS

Product                    Site               Price        Date
Amplifier Pro              akkelisaudio       1.500 kr     2024-01-15
Speaker System             blocket            2.500 kr     2024-01-14
Power Amplifier            hifipuls           3.200 kr     2024-01-13
...

... and 72 more results
```

## Interpreting Results

### Success Indicators

- ✅ **Green checkmark**: Scraper worked and found results
- ⚠️ **Yellow warning**: Scraper had an error but didn't crash
- ❌ **Red X**: Scraper failed completely

### Data Fields

Each result shows:

| Field | Description |
|-------|-------------|
| **Product** | Title of the listing |
| **Site** | Which scraper found it |
| **Price** | Price in Swedish Kronor (kr) |
| **Date** | When the listing was posted |
| **Location** | Where the item is located (if available) |
| **Description** | Short description (detailed view only) |
| **URL** | Direct link to the listing |

## Troubleshooting

### No results found
- The scraper might be working but the website has no matching products
- Try with different search terms
- Check if the website structure has changed (selectors might be outdated)

### Error: "Browser context not initialized"
- This has been fixed in the new version
- Try running the command again

### Timeout errors
- Websites sometimes take longer to respond
- Try again with a shorter search term
- Increase the timeout if needed (would require code modification)

### Network errors
- Website might be temporarily unavailable
- Try a different scraper
- Check your internet connection

## Performance Notes

- **Single scraper test** (`test:view`): Usually completes in 5-30 seconds
- **All scrapers test** (`test:all`): Takes 1-3 minutes since it tests all 15 scrapers sequentially
- Some websites are slower than others (Tradera, HiFi Shark can take longer)

## Using Results

Once you see the results, you can:

1. **Verify scraper functionality** - Check if each scraper is extracting data correctly
2. **Compare prices** - See which sites have the best deals
3. **Debug selectors** - If a scraper returns 0 results, the HTML selectors might need updating
4. **Test in bulk** - Use `test:all` to identify which scrapers are working/broken

## Next Steps

If a scraper isn't returning results:

1. Check the website manually to see if products exist
2. Look at the HTML structure - selectors might have changed
3. Review the scraper file in `SiteScrapers/scrapers/` directory
4. Update the CSS selectors to match the new website structure

## Other Test Commands

```bash
# Run quick unit tests (no websites)
npm run test:quick

# Run Playwright test suite
npm test

# Run basic tests only
npm run test:basic

# Run integration tests (real websites)
npm run test:integration
```
