#!/usr/bin/env node

/**
 * Search Test Script
 *
 * Tests the search functionality by searching for "Manager" role
 * across all supported companies and fetching actual job listings.
 * 
 * Note: Some sites (Bayer, GSK) may require JavaScript to load jobs dynamically.
 * This test uses static HTTP requests, so dynamic content won't be fetched.
 */

import { ConfigLoader } from '../src/config-loader.js';
import { SearchExecutor } from '../src/search-executor.js';

async function testManagerSearch() {
  console.log('='.repeat(80));
  console.log('FUNCTIONAL TEST: Manager Role Search Across All Companies');
  console.log('='.repeat(80));
  console.log('\nNote: Testing actual HTTP searches and HTML parsing\n');

  const configLoader = new ConfigLoader('sites');
  const searchExecutor = new SearchExecutor();

  const companies = configLoader.getAllCompanies();
  const keyword = 'Manager';

  console.log(`Searching for "${keyword}" across ${companies.length} companies...\n`);

  let totalJobsFound = 0;
  const results: {[key: string]: any} = {};

  for (const companyId of companies) {
    const config = configLoader.getCompanyInfo(companyId);
    if (!config) continue;

    console.log(`\n${'-'.repeat(80)}`);
    console.log(`${config.name}`);
    console.log(`${'-'.repeat(80)}`);

    // Build the search URL
    const searchUrl = configLoader.buildSearchUrl(companyId, keyword);
    if (!searchUrl) {
      console.log('❌ ERROR: Could not build search URL');
      continue;
    }

    console.log(`Search URL: ${searchUrl}\n`);

    try {
      // Execute the actual search
      const searchResults = await searchExecutor.search(companyId, searchUrl);
      results[companyId] = searchResults;

      // Display results
      if (searchResults.success) {
        console.log(`✅ Search successful! Found ${searchResults.count} jobs\n`);
        totalJobsFound += searchResults.count;

        if (searchResults.results.length > 0) {
          console.log(`Top 5 Manager positions at ${config.name}:\n`);
          for (let i = 0; i < Math.min(5, searchResults.results.length); i++) {
            const job = searchResults.results[i];
            console.log(`  ${i + 1}. ${job.title}`);
            console.log(`     📍 Location: ${job.location}`);
            console.log(`     🔗 URL: ${job.url}`);
            if (job.posted_date) {
              console.log(`     📅 Posted: ${job.posted_date}`);
            }
            console.log();
          }
        } else {
          console.log(`⚠️  No job listings were extracted from the HTML.`);
          console.log(`\n    This usually means either:`);
          console.log(`    • The website's HTML structure has changed`);
          console.log(`    • The site uses JavaScript to load jobs dynamically`);
          console.log(`    • The CSS selectors need to be updated\n`);
        }
      } else {
        console.log(`❌ Search failed: ${searchResults.error}`);
        console.log(`\n    This could happen because:`);
        console.log(`    • The site blocks automated requests`);
        console.log(`    • Network connectivity issue`);
        console.log(`    • Site is temporarily unavailable\n`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    }
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('SEARCH TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nTotal jobs found: ${totalJobsFound}`);
  console.log(`\nCompanies tested: ${companies.length}`);
  
  for (const companyId of companies) {
    const result = results[companyId];
    const status = result && result.success ? '✅' : '❌';
    const count = result ? result.count : 0;
    console.log(`  ${status} ${companyId}: ${count} jobs`);
  }

  console.log(`\n${'='.repeat(80)}`);
  
  if (totalJobsFound > 0) {
    console.log('✅ SUCCESS: Job listings are being fetched and parsed correctly!');
    console.log('\nYou can now:');
    console.log('  1. Run: npm start  (to start the MCP server)');
    console.log('  2. Connect an MCP client and use the search tools');
    console.log('  3. Get normalized job results across all companies');
  } else {
    console.log('⚠️  WARNING: No jobs were extracted from any company.');
    console.log('\nPossible issues:');
    console.log('  • Some or all sites use JavaScript to load jobs dynamically');
    console.log('  • HTML selectors may need updating');
    console.log('  • Sites may be blocking automated requests');
    console.log('\nNext steps:');
    console.log('  1. Check the browser pages manually to see job listings');
    console.log('  2. Inspect HTML structure and update selectors in search-executor.ts');
    console.log('  3. Consider using Playwright for JavaScript-heavy sites');
  }
  
  console.log('='.repeat(80));
}

// Run the test
testManagerSearch().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
