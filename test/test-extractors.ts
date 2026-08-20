/**
 * Job Extractor Functionality Test
 * 
 * Tests job extraction capability for all companies.
 * Verifies that extractors can parse job details from real URLs.
 * 
 * Usage: npm run build && node dist/test/test-extractors.js
 */

import { ExtractorRegistry } from '../src/extractors/index.js';

async function testExtractors() {
  console.log('================================================================================');
  console.log('Job Extractor Functionality Test');
  console.log('================================================================================\n');

  const registry = new ExtractorRegistry();
  const companies = registry.getAvailableCompanies();

  console.log(`Available extractors: ${companies.join(', ')}\n`);

  // Sample test URLs (would need to be updated with real URLs from search results)
  const testUrls: { [key: string]: string[] } = {
    amgen: ['https://amgen.wd1.myworkdayjobs.com/Careers/job/...'],
    bayer: ['https://bayer.eightfold.ai/jobs/...'],
    gsk: ['https://jobs.gsk.com/...'],
    novartis: ['https://www.novartis.com/careers/...'],
    pfizer: ['https://pfizer.wd1.myworkdayjobs.com/...'],
  };

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const company of companies) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`Testing ${company.toUpperCase()} Extractor`);
    console.log('='.repeat(80));

    const extractor = registry.getExtractor(company);
    if (!extractor) {
      console.log(`❌ No extractor registered for ${company}`);
      failedTests++;
      totalTests++;
      continue;
    }

    const urls = testUrls[company] || [];
    if (urls.length === 0) {
      console.log(`⚠️  No test URLs configured for ${company}`);
      console.log('   To add test URLs, run test-manager-jobs.ts first to generate real job URLs');
      continue;
    }

    for (const url of urls) {
      totalTests++;
      try {
        console.log(`\nTesting URL: ${url}`);
        const result = await extractor.extract(url);

        if (result.success && result.data) {
          console.log('✅ Extraction successful');
          console.log(`   Title: ${result.data.jobTitle}`);
          console.log(`   Expiry: ${result.data.expiryDate}`);
          console.log(
            `   Description: ${result.data.jobDescription.substring(0, 50)}...`
          );
          passedTests++;
        } else {
          console.log(`⚠️  Extraction failed: ${result.error}`);
          console.log(`   Error Code: ${result.errorCode}`);
          failedTests++;
        }
      } catch (error) {
        console.log(`❌ Exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedTests++;
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('Summary');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(2) : 0}%`);
}

// Run tests
testExtractors().catch(console.error);
