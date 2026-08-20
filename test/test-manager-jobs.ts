/**
 * Manager Jobs Extraction Test with Error Tracking
 * 
 * Comprehensive test for job search and extraction pipeline:
 * - Searches for jobs across multiple companies
 * - Extracts job details from individual URLs
 * - Tracks errors and failed extractions separately
 * - Generates CSV reports for both success and failure cases
 * 
 * Usage: npm run build && node dist/test/test-manager-jobs.js
 * 
 * Output:
 * - test/manager-jobs-success.csv (extracted job details)
 * - test/manager-jobs-errors.csv (extraction errors with codes and HTTP status)
 */

import { SearchExecutor } from '../src/search-executor.js';
import { ExtractorRegistry } from '../src/extractors/index.js';
import {
  ExtractedJob,
  ExtractionError,
  ExtractionReport,
  writeExtractionReports,
  printExtractionSummary,
} from '../src/extraction-helpers.js';

async function testManagerJobs() {
  console.log('================================================================================');
  console.log('Manager Jobs Extraction Test - CSV Reports with Error Tracking');
  console.log('================================================================================\n');

  const searchExecutor = new SearchExecutor();
  const extractorRegistry = new ExtractorRegistry();

  // Search URLs for each company
  const searchUrls: { [key: string]: string } = {
    amgen: 'https://amgen.wd1.myworkdayjobs.com/Careers?q=Manager',
    bayer: 'https://bayer.eightfold.ai/careers?query=Manager',
    gsk: 'https://jobs.gsk.com/gb/en/search-results?keywords=Manager',
    novartis: 'https://www.novartis.com/careers/career-search?search_api_fulltext=Manager',
    pfizer: 'https://pfizer.wd1.myworkdayjobs.com/en-US/PfizerCareers?q=Manager',
  };

  const companies = Object.keys(searchUrls);

  // Track successful extractions and errors
  const successfulJobs: ExtractedJob[] = [];
  const extractionErrors: ExtractionError[] = [];

  console.log('Step 1: Searching for "Manager" jobs across all companies...\n');

  // Get URLs for each company
  const jobsByCompany: { [key: string]: string[] } = {};

  for (const company of companies) {
    const searchUrl = searchUrls[company];
    const result = await searchExecutor.search(company, searchUrl);

    if (result.success && result.results.length > 0) {
      // Extract URLs from search results (take first 2)
      jobsByCompany[company] = result.results.slice(0, 2).map((job) => job.url);
      console.log(
        `✅ ${company.toUpperCase()}: Found ${result.results.length} results, extracting 2 URLs`
      );
    } else {
      console.log(`❌ ${company.toUpperCase()}: No results found`);
      jobsByCompany[company] = [];
    }
  }

  console.log('\nStep 2: Extracting job details from 2 jobs per company...\n');

  // Extract details from each job URL
  for (const company of companies) {
    const urls = jobsByCompany[company];
    if (urls.length === 0) {
      console.log(`⚠️  ${company.toUpperCase()}: No URLs to extract`);
      continue;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`${company.toUpperCase()}`);
    console.log('='.repeat(80));

    const extractor = extractorRegistry.getExtractor(company);
    if (!extractor) {
      console.log(`❌ No extractor found for ${company}`);
      continue;
    }

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`\n📋 Job ${i + 1}/${urls.length}`);
      console.log(`URL: ${url}\n`);

      try {
        const result = await extractor.extract(url);

        if (result.success && result.data) {
          const job = result.data;

          console.log(`✅ Extraction successful`);
          console.log(`   Title: ${job.jobTitle || '(not extracted)'}`);
          console.log(`   Expiry: ${job.expiryDate || '(not available)'}`);
          console.log(`   Desc Preview: ${job.jobDescription.substring(0, 100)}...`);

          // Track successful extraction
          successfulJobs.push({
            company,
            jobTitle: job.jobTitle,
            description: job.jobDescription.substring(0, 200),
            expiryDate: job.expiryDate,
            applyLink: job.applyLink,
          });
        } else {
          // Track extraction error
          console.log(`❌ Extraction failed: ${result.error}`);
          console.log(`   Error Code: ${result.errorCode}`);
          console.log(`   HTTP Status: ${result.httpStatus || 'N/A'}`);

          extractionErrors.push({
            company,
            url,
            errorCode: result.errorCode || 'UNKNOWN',
            httpStatus: result.httpStatus || 'N/A',
            errorMessage: result.error || 'Unknown error',
            attemptedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.log(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);

        extractionErrors.push({
          company,
          url,
          errorCode: 'EXCEPTION',
          httpStatus: 'N/A',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          attemptedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Generate reports using extraction helpers
  const report: ExtractionReport = {
    successfulJobs,
    failedExtractions: extractionErrors,
  };

  // Write reports and display summary
  writeExtractionReports(report, 'test/manager-jobs-success.csv', 'test/manager-jobs-errors.csv');
  printExtractionSummary(report);
}

// Run test
testManagerJobs().catch(console.error);
