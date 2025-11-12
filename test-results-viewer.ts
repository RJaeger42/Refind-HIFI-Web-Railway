#!/usr/bin/env npx ts-node

/**
 * Test Results Viewer - Display actual search results
 *
 * Usage:
 *   npx ts-node test-results-viewer.ts <scraper-name> <query> [minPrice] [maxPrice]
 *
 * Examples:
 *   npx ts-node test-results-viewer.ts akkelisaudio amplifier
 *   npx ts-node test-results-viewer.ts hifipuls speaker 1000 5000
 *   npx ts-node test-results-viewer.ts tradera turntable
 */

import { chromium } from 'playwright';
import { getScraperByName, getAvailableScrapers, type ListingResult } from './SiteScrapers';

const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('\n📊 Test Results Viewer\n');
  console.log('Usage: npx ts-node test-results-viewer.ts <scraper> <query> [minPrice] [maxPrice]\n');
  console.log('Available scrapers:');
  getAvailableScrapers().forEach((scraper) => {
    console.log(`  - ${scraper}`);
  });
  console.log('\nExamples:');
  console.log('  npx ts-node test-results-viewer.ts akkelisaudio amplifier');
  console.log('  npx ts-node test-results-viewer.ts hifipuls speaker 1000 5000');
  console.log('  npx ts-node test-results-viewer.ts tradera turntable\n');
  process.exit(0);
}

const scraperName = args[0].toLowerCase();
const query = args[1];
const minPrice = args[2] ? parseInt(args[2]) : undefined;
const maxPrice = args[3] ? parseInt(args[3]) : undefined;

async function main() {
  let browser;
  try {
    console.log('\n🔍 Fetching results...\n');
    console.log(`Scraper: ${scraperName}`);
    console.log(`Query: "${query}"`);
    if (minPrice !== undefined) console.log(`Min Price: ${minPrice} kr`);
    if (maxPrice !== undefined) console.log(`Max Price: ${maxPrice} kr`);
    console.log('\n' + '='.repeat(120));

    browser = await chromium.launch({ headless: true });
    const scraper = await getScraperByName(scraperName as any);

    // Initialize browser context (required for search)
    await (scraper as any).initializeBrowser(browser);

    const results = await scraper.search(query, minPrice, maxPrice);

    console.log(`\n📦 Found ${results.length} results\n`);

    if (results.length === 0) {
      console.log('No results found.');
      await scraper.close();
      if (browser) await browser.close();
      process.exit(0);
    }

    // Display results in a formatted table
    console.log(formatResults(results));

    // Display detailed view for each result
    console.log('\n' + '='.repeat(120));
    console.log('📋 DETAILED RESULTS\n');

    results.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log(`  Product:     ${result.title}`);
      console.log(`  Site:        ${scraperName.toUpperCase()}`);
      console.log(`  Price:       ${result.price ? result.price.toLocaleString('sv-SE') + ' kr' : 'N/A'}`);
      console.log(`  Date:        ${result.postedDate || 'N/A'}`);
      console.log(`  Location:    ${result.location || 'N/A'}`);
      console.log(`  Description: ${result.description ? result.description.substring(0, 80) + '...' : 'N/A'}`);
      console.log(`  URL:         ${result.url}`);
      console.log();
    });

    await scraper.close();
    if (browser) await browser.close();
  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
    if (browser) await browser.close();
    process.exit(1);
  }
}

function formatResults(results: ListingResult[]): string {
  // Define column widths
  const colProduct = 35;
  const colSite = 18;
  const colPrice = 12;
  const colDate = 12;

  // Header
  let output = '';
  output += `${'Product'.padEnd(colProduct)} ${'Site'.padEnd(colSite)} ${'Price'.padEnd(colPrice)} ${'Date'.padEnd(colDate)}\n`;
  output += `${'-'.repeat(colProduct)} ${'-'.repeat(colSite)} ${'-'.repeat(colPrice)} ${'-'.repeat(colDate)}\n`;

  // Rows
  results.forEach((result) => {
    const product = result.title.substring(0, colProduct - 2).padEnd(colProduct);
    const site = scraperName.substring(0, colSite - 2).padEnd(colSite);
    const price = result.price
      ? result.price.toLocaleString('sv-SE').substring(0, colPrice - 2).padEnd(colPrice)
      : 'N/A'.padEnd(colPrice);
    const date = (result.postedDate || 'N/A').substring(0, colDate - 2).padEnd(colDate);

    output += `${product} ${site} ${price} ${date}\n`;
  });

  return output;
}

main();
