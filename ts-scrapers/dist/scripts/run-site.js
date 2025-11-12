import { chromium } from '@playwright/test';
import { siteScrapers } from '../src/sites/index.js';
const usage = `
Usage:
  npx ts-node scripts/run-site.ts --site blocket --query "NAD"

Options:
  --site, -s        Scraper slug or name (run with --list to see all)
  --query, -q       Search phrase (required)
  --min-price       Minimum price filter
  --max-price       Maximum price filter
  --limit, -l       How many listings to print (omit or 0 for all)
  --days, -d        Only include listings newer than N days
  --category, -c    Blocket category id or name (default: Elektronik)
  --json            Output full JSON payload instead of pretty text
  --list            Show all available scraper slugs and exit
  --help, -h        Show this help text
`.trim();
function parseArgs(argv) {
    const opts = { limit: 0 };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        switch (arg) {
            case '--site':
            case '-s':
                opts.site = argv[++i];
                break;
            case '--query':
            case '-q':
                opts.query = argv[++i];
                break;
            case '--min-price':
                opts.minPrice = Number(argv[++i]);
                break;
            case '--max-price':
                opts.maxPrice = Number(argv[++i]);
                break;
            case '--limit':
            case '-l':
                opts.limit = Number(argv[++i]);
                break;
            case '--days':
            case '-d':
                opts.days = Number(argv[++i]);
                break;
            case '--json':
                opts.json = true;
                break;
            case '--category':
            case '-c':
                opts.category = argv[++i];
                break;
            case '--list':
                opts.list = true;
                break;
            case '--help':
            case '-h':
                console.log(usage);
                process.exit(0);
                break;
            default:
                if (!opts.query) {
                    opts.query = arg;
                }
                else if (!opts.site) {
                    opts.site = arg;
                }
                break;
        }
    }
    return opts;
}
function listScrapers() {
    console.log('Available scrapers:\n');
    siteScrapers.forEach((scraper) => {
        console.log(`- ${scraper.slug.padEnd(15)} ${scraper.name}`);
    });
    console.log('\nUse --site <slug> to target one of them.');
}
function findScraper(site) {
    if (!site)
        return undefined;
    const target = site.toLowerCase();
    return siteScrapers.find((scraper) => scraper.slug.toLowerCase() === target || scraper.name.toLowerCase().includes(target));
}
function printListings(listings, limit) {
    const sliceEnd = typeof limit === 'number' && limit > 0 ? Math.min(limit, listings.length) : listings.length;
    const sample = listings.slice(0, sliceEnd);
    sample.forEach((listing, index) => {
        console.log(`\n${index + 1}. ${listing.title}`);
        if (listing.price !== undefined && listing.price !== null) {
            console.log(`   Price: ${listing.price.toLocaleString('sv-SE')} kr`);
        }
        if (listing.location) {
            console.log(`   Location: ${listing.location}`);
        }
        if (listing.postedDate) {
            console.log(`   Posted: ${listing.postedDate}`);
        }
        if (listing.description) {
            console.log(`   Description: ${listing.description}`);
        }
        console.log(`   URL: ${listing.url}`);
    });
    if (sliceEnd < listings.length) {
        console.log(`\n…plus ${listings.length - sliceEnd} more results.`);
    }
}
async function main() {
    const options = parseArgs(process.argv.slice(2));
    if (options.list) {
        listScrapers();
        process.exit(0);
    }
    if (!options.site || !options.query) {
        console.error('Error: both --site and --query are required.\n');
        console.log(usage);
        process.exit(1);
    }
    const scraper = findScraper(options.site);
    if (!scraper) {
        console.error(`Unknown scraper "${options.site}". Run with --list to see available slugs.`);
        process.exit(1);
    }
    console.log(`🔍 Testing ${scraper.name} (${scraper.slug}) with query "${options.query}"`);
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        const listings = await scraper.search(page, {
            query: options.query,
            minPrice: options.minPrice,
            maxPrice: options.maxPrice,
            days: options.days,
            category: options.category,
        });
        console.log(`\nFound ${listings.length} listings.`);
        if (options.json) {
            console.log(JSON.stringify(listings, null, 2));
        }
        else {
            printListings(listings, options.limit);
        }
    }
    catch (error) {
        console.error('Search failed:', error);
        process.exitCode = 1;
    }
    finally {
        await browser.close();
    }
}
main();
