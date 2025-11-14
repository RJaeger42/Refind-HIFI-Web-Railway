import { AVAILABLE_SCRAPERS, getAvailableScrapers } from '../../../SiteScrapers/index';
import type { ListingResult } from '../../../SiteScrapers/types';
import { saveListings, testConnection, closeConnection, logScraperError, Listing } from './database';

// Light scrapers: Exclude Facebook and HifiShark (they're in scrapers-heavy)
const LIGHT_SCRAPERS = [
  'hifitorget',
  'hifipuls',
  'ljudmakarn',
  'hifipunkten',
  'hifiexperience',
  'lasseshifi',
  'referenceaudio',
  'akkelisaudio',
  'audioconcept',
  'audioperformance',
  'rehifi',
] as const;

// Default search query - scrape general hi-fi equipment
const DEFAULT_SEARCH_QUERY = 'hifi';

// Convert scraper ListingResult to database Listing format
function convertToListing(result: ListingResult, siteName: string): Listing | null {
  // Skip listings without a URL or title
  if (!result.url || !result.title) {
    return null;
  }

  // Skip listings without a price (optional - comment out if you want all listings)
  if (!result.price || result.price <= 0) {
    return null;
  }

  return {
    product: result.title,
    price: result.price,
    url: result.url,
    site_source: siteName,
    description: result.description,
    image_url: result.imageUrl,
    location: result.location,
    posted_date: result.postedDate ? new Date(result.postedDate) : undefined,
  };
}

async function runScraper(scraperName: string): Promise<number> {
  console.log(`\n🔍 Running scraper: ${scraperName}`);

  try {
    const scraperFactory = AVAILABLE_SCRAPERS[scraperName as keyof typeof AVAILABLE_SCRAPERS];
    if (!scraperFactory) {
      console.error(`❌ Scraper not found: ${scraperName}`);
      return 0;
    }

    const scraper = await scraperFactory();

    // Search with default query
    const results = await scraper.search(DEFAULT_SEARCH_QUERY);
    console.log(`   Found ${results.length} results`);

    // Convert to database format
    const listings: Listing[] = results
      .map(r => convertToListing(r, scraper.name))
      .filter((l): l is Listing => l !== null);

    console.log(`   ${listings.length} valid listings (with price & URL)`);

    // Save to database
    const saved = await saveListings(listings);
    console.log(`   ✅ Saved ${saved} listings to database`);

    // Clean up
    await scraper.close();

    return saved;
  } catch (error) {
    console.error(`   ❌ Error running ${scraperName}:`, error);

    // Log error to database
    if (error instanceof Error) {
      await logScraperError(scraperName, error);
    } else {
      await logScraperError(scraperName, new Error(String(error)));
    }

    return 0;
  }
}

async function runAllScrapers(): Promise<void> {
  console.log('🚀 Starting Light Scraper Service');
  console.log(`⏰ Time: ${new Date().toISOString()}`);

  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('❌ Database connection failed - aborting');
    process.exit(1);
  }

  console.log(`\n📋 Running ${LIGHT_SCRAPERS.length} light scrapers...`);

  let totalSaved = 0;
  const startTime = Date.now();

  // Run scrapers sequentially to avoid overwhelming sites
  for (const scraperName of LIGHT_SCRAPERS) {
    const saved = await runScraper(scraperName);
    totalSaved += saved;
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Scraping complete!`);
  console.log(`   Total listings saved: ${totalSaved}`);
  console.log(`   Duration: ${duration}s`);
  console.log('='.repeat(50));

  await closeConnection();
}

// Run if executed directly
if (require.main === module) {
  runAllScrapers()
    .then(() => {
      console.log('\n✅ Process completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Process failed:', error);
      process.exit(1);
    });
}

export { runAllScrapers };
