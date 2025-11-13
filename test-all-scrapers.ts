#!/usr/bin/env npx ts-node

/**
 * Test All Scrapers - Compare results across all scrapers
 *
 * Usage:
 *   npx ts-node test-all-scrapers.ts <query> [minPrice] [maxPrice]
 *
 * Examples:
 *   npx ts-node test-all-scrapers.ts amplifier
 *   npx ts-node test-all-scrapers.ts speaker 1000 5000
 */

import { chromium } from 'playwright';
import { getScraperByName, getAvailableScrapers, type ListingResult } from './SiteScrapers';
import { matchesSearchQuery } from './SiteScrapers/utils';

const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('\n🔄 Test All Scrapers\n');
  console.log('Usage: npx ts-node test-all-scrapers.ts <query> [minPrice] [maxPrice]\n');
  console.log('Examples:');
  console.log('  npx ts-node test-all-scrapers.ts amplifier');
  console.log('  npx ts-node test-all-scrapers.ts speaker 1000 5000\n');
  process.exit(0);
}

const query = args[0];
const minPrice = args[1] ? parseInt(args[1]) : undefined;
const maxPrice = args[2] ? parseInt(args[2]) : undefined;

interface ScraperResult {
  name: string;
  results: ListingResult[];
  error?: string;
}

async function main() {
  let browser;
  try {
    console.log('\n🔄 Testing all scrapers...\n');
    console.log(`Query: "${query}"`);
    if (minPrice !== undefined) console.log(`Min Price: ${minPrice} kr`);
    if (maxPrice !== undefined) console.log(`Max Price: ${maxPrice} kr`);
    console.log('\n' + '='.repeat(120));

    browser = await chromium.launch({ headless: true });
    const scraperNames = getAvailableScrapers();
    const results: ScraperResult[] = [];

    // Test each scraper
    for (const scraperName of scraperNames) {
      try {
        console.log(`\n⏳ Testing ${scraperName}...`);
        const scraper = await getScraperByName(scraperName);

        // Initialize browser context (required for search)
        await (scraper as any).initializeBrowser(browser);

        const searchResults = await scraper.search(query, minPrice, maxPrice);

        // Apply additional strict filtering to ensure all results match the query
        const filteredResults = searchResults.filter(result =>
          matchesSearchQuery(result.title, query) ||
          (result.description && matchesSearchQuery(result.description, query))
        );

        results.push({
          name: scraperName,
          results: filteredResults,
        });
        console.log(`✅ Found ${filteredResults.length} results (${searchResults.length} total, ${searchResults.length - filteredResults.length} filtered out)`);
        await scraper.close();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`⚠️  Error: ${errorMsg}`);
        results.push({
          name: scraperName,
          results: [],
          error: errorMsg,
        });
      }
    }

    // Summary
    console.log('\n' + '='.repeat(120));
    console.log('\n📊 SUMMARY\n');

    const successfulScrapers = results.filter((r) => !r.error);
    const totalResults = results.reduce((sum, r) => sum + r.results.length, 0);

    console.log(`Scrapers tested: ${results.length}`);
    console.log(`Successful: ${successfulScrapers.length}`);
    console.log(`Total results: ${totalResults}\n`);

    // Results by scraper
    console.log('Results per scraper:');
    results.forEach((r) => {
      if (r.error) {
        console.log(`  ${r.name.padEnd(20)} ❌ Error: ${r.error}`);
      } else {
        console.log(`  ${r.name.padEnd(20)} ✅ ${r.results.length} results`);
      }
    });

    // Top results table
    const allResults = results.flatMap((r) =>
      r.results.map((result) => ({ scraper: r.name, ...result }))
    );

    if (allResults.length > 0) {
      console.log('\n' + '='.repeat(120));
      console.log('\n📋 TOP RESULTS\n');
      console.log(formatResultsTable(allResults));
    }

    if (browser) await browser.close();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

function formatResultsTable(results: (ListingResult & { scraper: string })[]): string {
  const colProduct = 30;
  const colSite = 18;
  const colPrice = 12;
  const colDate = 12;

  // Header
  let output = '';
  output += `${'Product'.padEnd(colProduct)} ${'Site'.padEnd(colSite)} ${'Price'.padEnd(colPrice)} ${'Date'.padEnd(colDate)}\n`;
  output += `${'-'.repeat(colProduct)} ${'-'.repeat(colSite)} ${'-'.repeat(colPrice)} ${'-'.repeat(colDate)}\n`;

  // Rows (limit to first 50)
  results.slice(0, 50).forEach((result) => {
    const product = result.title.substring(0, colProduct - 2).padEnd(colProduct);
    const site = result.scraper.substring(0, colSite - 2).padEnd(colSite);
    const price = result.price
      ? result.price.toLocaleString('sv-SE').substring(0, colPrice - 2).padEnd(colPrice)
      : 'N/A'.padEnd(colPrice);
    const date = (result.postedDate || 'N/A').substring(0, colDate - 2).padEnd(colDate);

    output += `${product} ${site} ${price} ${date}\n`;
  });

  if (results.length > 50) {
    output += `\n... and ${results.length - 50} more results\n`;
  }

  return output;
}

main();
