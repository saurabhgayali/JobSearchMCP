#!/usr/bin/env node

/**
 * Test script for the Job Search MCP
 *
 * Tests the basic functionality without needing the full MCP protocol.
 */

import { ConfigLoader } from '../src/config-loader.js';

function testConfigLoader() {
  console.log('='.repeat(60));
  console.log('Testing Configuration Loader');
  console.log('='.repeat(60));

  // Load configurations
  const loader = new ConfigLoader('sites');

  // Test: List all companies
  console.log('\n1. Testing getAllCompanies():');
  const companies = loader.getAllCompanies();
  console.log(`   Found ${companies.length} companies: ${companies.join(', ')}`);

  // Test: Get company info
  console.log('\n2. Testing getCompanyInfo():');
  for (const companyId of companies.slice(0, 2)) {
    const config = loader.getCompanyInfo(companyId);
    if (config) {
      console.log(`\n   ${config.name}:`);
      console.log(`     - Career URL: ${config.career_url}`);
      console.log(`     - Search URL: ${config.search_url}`);
      const params = config.params;
      console.log(`     - Parameters (${params.length}):`);
      for (const param of params) {
        const valuesStr =
          param.values.length > 0 ? ` (values: ${param.values.slice(0, 3).join(', ')}${param.values.length > 3 ? '...' : ''})` : '';
        console.log(`       * ${param.name}: ${param.label} (${param.type})${valuesStr}`);
      }
    }
  }

  // Test: Get search params
  console.log('\n3. Testing getSearchParams():');
  const params = loader.getSearchParams('amgen');
  if (params) {
    console.log(`   Amgen has ${params.length} search parameters:`);
    for (const param of params) {
      console.log(`     - ${param.name}: ${param.label}`);
    }
  }

  // Test: Build search URLs
  console.log('\n4. Testing buildSearchUrl():');
  const testCases = [
    ['amgen', 'Engineer', {}],
    ['amgen', 'Manager', { location: 'California' }],
    ['pfizer', 'Data Scientist', {}],
    ['novartis', 'Scientist', { function: 'Development' }],
    ['bayer', 'Engineer', { location: 'remote' }],
    ['gsk', 'Quality', { category: 'Quality' }],
  ];

  for (const [companyId, keyword, filters] of testCases) {
    const url = loader.buildSearchUrl(
      companyId as string,
      keyword as string,
      filters as Record<string, string>
    );
    if (url) {
      const filtersStr = Object.keys(filters).length > 0 ? ` with filters ${JSON.stringify(filters)}` : '';
      console.log(`\n   ${(companyId as string).charAt(0).toUpperCase() + (companyId as string).slice(1)}: '${keyword}'${filtersStr}`);
      console.log(`     URL: ${url.substring(0, 80)}...`);
    } else {
      console.log(`   ERROR: Could not build URL for ${companyId}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('All tests completed successfully!');
  console.log('='.repeat(60));
}

testConfigLoader();
