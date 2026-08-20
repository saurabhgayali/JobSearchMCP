# API Documentation

Complete reference for the Job Search MCP API and extraction pipeline.

## Overview

The Job Search MCP provides two main interfaces:

1. **REST API** - For the web demo and external integrations
2. **TypeScript SDK** - For programmatic usage in Node.js

## REST API

### Endpoint

```
POST /api/search-jobs
```

Base URL: `https://[deployment-url]/api/search-jobs`

Examples:
- Vercel: `https://[project].vercel.app/api/search-jobs`
- AWS: `https://[api-id].execute-api.[region].amazonaws.com/prod/api/search-jobs`
- Local: `http://localhost:3000/api/search-jobs`

### Authentication

**None required** for demo. Rate limiting is applied per IP address.

Rate Limit: 5 requests per 24 hours per IP address

### Request Format

**Method:** POST  
**Content-Type:** application/json

**Body:**
```json
{
  "query": "Manager",
  "companies": ["amgen", "bayer", "gsk", "novartis", "pfizer"]
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Job search keyword (e.g., "Manager", "Engineer") |
| companies | string[] | Yes | Array of company IDs to search. Valid values: "amgen", "bayer", "gsk", "novartis", "pfizer" |

### Request Examples

**cURL:**
```bash
curl -X POST https://[url]/api/search-jobs \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Engineer",
    "companies": ["amgen", "pfizer"]
  }'
```

**JavaScript/Fetch:**
```javascript
const response = await fetch('/api/search-jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    query: 'Manager',
    companies: ['amgen', 'bayer', 'gsk', 'novartis', 'pfizer'],
  }),
});

const data = await response.json();
```

**Python:**
```python
import requests

response = requests.post(
  'https://[url]/api/search-jobs',
  json={
    'query': 'Analyst',
    'companies': ['gsk', 'novartis']
  }
)

data = response.json()
```

### Response Format

**Status Code:** 200 (Success) or 429 (Rate Limited) or 500 (Error)

**Success Response (200):**
```json
{
  "jobs": [
    {
      "sno": 1,
      "company": "amgen",
      "jobTitle": "Senior Manager - Analytics",
      "description": "We are seeking a talented Senior Manager...",
      "url": "https://amgen.wd1.myworkdayjobs.com/job/...",
      "expiryDate": "2025-12-31",
      "applyLink": "https://amgen.wd1.myworkdayjobs.com/job/..."
    },
    {
      "sno": 2,
      "company": "bayer",
      "jobTitle": "Manager - Product Development",
      "description": "Join our team as a Manager...",
      "url": "https://bayer.eightfold.ai/jobs/...",
      "expiryDate": "2025-11-15",
      "applyLink": "https://bayer.eightfold.ai/jobs/..."
    }
  ],
  "errors": [
    {
      "sno": 1,
      "company": "gsk",
      "url": "https://jobs.gsk.com/...",
      "errorCode": "NOT_FOUND",
      "httpStatus": "404",
      "errorMessage": "HTTP 404: Not Found",
      "attemptedAt": "2026-08-20T15:30:00.000Z"
    }
  ]
}
```

**Rate Limited Response (429):**
```json
{
  "error": "Rate limit exceeded. Maximum 5 searches per 24 hours per IP. Try again in 18 hours."
}
```

**Error Response (400/500):**
```json
{
  "error": "Invalid request parameters"
}
```

### Response Fields

**Jobs Array:**

| Field | Type | Description |
|-------|------|-------------|
| sno | number | Sequential number (1, 2, 3...) |
| company | string | Company ID that posted this job |
| jobTitle | string | Position name/title |
| description | string | Job description (first 200 chars) |
| url | string | URL to original job posting |
| expiryDate | string | Application deadline (YYYY-MM-DD format) |
| applyLink | string | URL to apply for job |

**Errors Array:**

| Field | Type | Description |
|-------|------|-------------|
| sno | number | Sequential error number |
| company | string | Company where extraction failed |
| url | string | Job URL that failed to extract |
| errorCode | string | Error classification (see Error Codes below) |
| httpStatus | string | HTTP status code or "N/A" |
| errorMessage | string | Human-readable error message |
| attemptedAt | string | ISO 8601 timestamp of attempt |

### Error Codes

| Code | HTTP Status | Description | Cause |
|------|------------|-------------|-------|
| NOT_FOUND | 404 | Job URL no longer exists | Job deleted or URL expired |
| TIMEOUT | N/A | Request took too long | Site unresponsive, network slow |
| NETWORK_ERROR | N/A | Network connectivity issue | No internet, firewall blocked |
| HTTP_ERROR | 5xx | Server error | Career site having issues |
| PARSE_ERROR | 200 | Failed to parse job details | Page structure changed |
| EXCEPTION | N/A | Unexpected runtime error | Bug in extraction code |
| UNKNOWN | N/A | Unknown error type | Unclassified issue |

### Rate Limiting Details

- **Limit:** 5 searches per 24-hour period per client IP
- **Window:** Rolling 24-hour window
- **Tracking:** Client IP address (X-Forwarded-For or X-Real-IP header)
- **Response:** 429 status with remaining time to retry
- **Reset:** Automatic after 24 hours from first request

### Response Time

Typical response times:

| Scenario | Time |
|----------|------|
| Search 1 company | 10-15 seconds |
| Search 5 companies | 30-60 seconds |
| Extract 2 jobs | 5-10 seconds |
| Full pipeline (5 companies, 2 jobs each) | 60-120 seconds |

## TypeScript SDK

For Node.js/TypeScript applications, use the classes directly.

### Installation

```bash
npm install
npm run build
```

### Basic Usage

```typescript
import { SearchExecutor } from './src/search-executor.js';
import { ExtractorRegistry } from './src/extractors/index.js';

// Search
const searchExecutor = new SearchExecutor();
const results = await searchExecutor.search('amgen', 
  'https://amgen.wd1.myworkdayjobs.com/Careers?q=Manager'
);

console.log(`Found ${results.results.length} jobs`);

// Extract details
const registry = new ExtractorRegistry();
const extractor = registry.getExtractor('amgen');

const extraction = await extractor?.extract(results.results[0].url);
if (extraction?.success) {
  console.log(extraction.data.jobTitle);
}
```

### SearchExecutor

Handles job search across all career websites.

```typescript
class SearchExecutor {
  async search(companyId: string, searchUrl: string): Promise<{
    success: boolean;
    results: Array<{ url: string; title?: string }>;
    error?: string;
  }>;
}
```

**Example:**
```typescript
const executor = new SearchExecutor();
const result = await executor.search('pfizer', 
  'https://pfizer.wd1.myworkdayjobs.com/en-US/PfizerCareers?q=Engineer'
);

if (result.success) {
  result.results.forEach((job, idx) => {
    console.log(`${idx + 1}. ${job.title}`);
    console.log(`   ${job.url}`);
  });
}
```

### ExtractorRegistry

Manages job detail extraction for each company.

```typescript
class ExtractorRegistry {
  getExtractor(companyId: string): JobExtractor | null;
  hasExtractor(companyId: string): boolean;
  getAvailableCompanies(): string[];
}

interface JobExtractor {
  extract(url: string): Promise<ExtractionResult>;
  getSource(): string;
}

interface ExtractionResult {
  success: boolean;
  data?: JobExtraction;
  error?: string;
  errorCode?: string;
  httpStatus?: number;
  url?: string;
}

interface JobExtraction {
  url: string;
  jobTitle: string;
  jobDescription: string;
  eligibility: string;
  expiryDate: string;
  applyLink: string;
  extractedAt: string;
  source: string;
}
```

**Example:**
```typescript
const registry = new ExtractorRegistry();

// List available extractors
console.log(registry.getAvailableCompanies());
// Output: ["amgen", "bayer", "gsk", "novartis", "pfizer"]

// Get extractor
const extractor = registry.getExtractor('bayer');
if (extractor) {
  const result = await extractor.extract('https://bayer.eightfold.ai/jobs/...');
  
  if (result.success && result.data) {
    console.log(result.data.jobTitle);
    console.log(result.data.jobDescription);
    console.log(result.data.eligibility);
  } else {
    console.error(`Extraction failed: ${result.errorCode}`);
  }
}
```

### Extraction Helpers

Utilities for tracking and reporting extraction results.

```typescript
import {
  ExtractedJob,
  ExtractionError,
  ExtractionReport,
  generateSuccessCSV,
  generateErrorsCSV,
  writeExtractionReports,
  printExtractionSummary,
} from './src/extraction-helpers.js';

// Create report
const report: ExtractionReport = {
  successfulJobs: [
    {
      company: 'amgen',
      jobTitle: 'Manager',
      description: '...',
      expiryDate: '2025-12-31',
      applyLink: '...',
    },
  ],
  failedExtractions: [
    {
      company: 'gsk',
      url: '...',
      errorCode: 'NOT_FOUND',
      httpStatus: '404',
      errorMessage: 'HTTP 404: Not Found',
      attemptedAt: new Date().toISOString(),
    },
  ],
};

// Generate CSV
const successCsv = generateSuccessCSV(report.successfulJobs);
const errorsCsv = generateErrorsCSV(report.failedExtractions);

// Write to disk and console
writeExtractionReports(report, 'output/jobs.csv', 'output/errors.csv');
printExtractionSummary(report);
```

## Company IDs

Valid company identifiers for API requests:

| ID | Company | Platform | Region |
|----|---------|----------|--------|
| amgen | Amgen | Workday | US/India |
| bayer | Bayer | Eightfold AI | Global |
| gsk | GlaxoSmithKline | Workday | UK/Global |
| novartis | Novartis | Drupal | Global |
| pfizer | Pfizer | Workday | US/Global |

## Pagination

For large result sets, the API returns up to 100 results per company.

To get additional results:
1. Modify search URL with offset/page parameters
2. Make separate requests for each page
3. Combine results

**Workday (Amgen, GSK, Pfizer):**
```
Add &offset=20 parameter to get next 20 results
https://amgen.wd1.myworkdayjobs.com/Careers?q=Manager&offset=20
```

**Eightfold (Bayer):**
```
Add &page=2 for next page
https://bayer.eightfold.ai/careers?query=Manager&page=2
```

## Rate Limiting Strategy

To work within 5 searches/day limit:

1. **Batch searches** - Search multiple keywords in single request
2. **Save results** - Download CSV and reuse offline
3. **Cache results** - Implement local storage
4. **User accounts** - Track searches per user (future feature)

## Examples

### Complete End-to-End Example

```typescript
import { SearchExecutor } from './src/search-executor.js';
import { ExtractorRegistry } from './src/extractors/index.js';

async function searchAndExtract() {
  const searchExecutor = new SearchExecutor();
  const extractorRegistry = new ExtractorRegistry();
  
  // 1. Search for jobs
  const searchUrl = 'https://pfizer.wd1.myworkdayjobs.com/en-US/PfizerCareers?q=Manager';
  const searchResult = await searchExecutor.search('pfizer', searchUrl);
  
  if (!searchResult.success) {
    console.error('Search failed');
    return;
  }
  
  // 2. Extract details from first 3 jobs
  const extractor = extractorRegistry.getExtractor('pfizer');
  if (!extractor) return;
  
  for (let i = 0; i < Math.min(3, searchResult.results.length); i++) {
    const jobUrl = searchResult.results[i].url;
    const extraction = await extractor.extract(jobUrl);
    
    if (extraction.success && extraction.data) {
      console.log(`${i + 1}. ${extraction.data.jobTitle}`);
      console.log(`   Expires: ${extraction.data.expiryDate}`);
      console.log(`   Apply: ${extraction.data.applyLink}\n`);
    } else {
      console.log(`${i + 1}. Failed: ${extraction.errorCode}`);
    }
  }
}

searchAndExtract().catch(console.error);
```

## Support

- **Documentation:** [docs/](../)
- **Issues:** Create GitHub issue with error code and URL
- **Rate Limit Help:** See [RATE_LIMITING.md](RATE_LIMITING.md)
