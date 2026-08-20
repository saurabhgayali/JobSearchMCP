# Running Tests

Comprehensive guide to the Job Search MCP test suite.

## Quick Start

```bash
npm run build
node dist/test/test-manager-jobs.js
```

This runs the full end-to-end test that searches for jobs, extracts details, and generates CSV reports.

## Test Descriptions

### 1. Configuration Test (test-config.ts)

**Purpose:** Verify that company configurations load correctly

**Run:**
```bash
npm run build
node dist/test/test-config.js
```

**What it tests:**
- ✅ Loads `src/config.json`
- ✅ Validates JSON structure
- ✅ Lists available companies
- ✅ Displays search URLs for each company

**Expected output:**
```
Available Companies
================================================================================
1. Amgen
   Search URL: https://amgen.wd1.myworkdayjobs.com/Careers?q={query}

2. Bayer
   Search URL: https://bayer.eightfold.ai/careers?query={query}

...
```

**Success criteria:**
- All 5 companies listed
- All search URLs are valid

---

### 2. Search Test (test-search.ts)

**Purpose:** Verify that job searches work across all company career sites

**Run:**
```bash
npm run build
node dist/test/test-search.js
```

**What it tests:**
- ✅ Searches for "Manager" jobs on each company site
- ✅ Extracts job URLs from search results
- ✅ Validates URL format and accessibility
- ✅ Counts jobs per company

**Expected output:**
```
Searching for "Manager" jobs...

AMGEN
=========================
✅ Search successful: 100 results
URLs: [
  https://amgen.wd1.myworkdayjobs.com/job/India-Bangalore/...
  https://amgen.wd1.myworkdayjobs.com/job/India-Bangalore/...
  ...
]

BAYER
=========================
✅ Search successful: 50 results
...
```

**Success criteria:**
- Each company returns at least 1 job
- URLs are properly formatted
- No network errors occur

**Typical output:**
- Amgen: 100 jobs
- Bayer: 50 jobs
- GSK: 50 jobs
- Novartis: 50 jobs
- Pfizer: 100 jobs

---

### 3. Extractor Test (test-extractors.ts)

**Purpose:** Verify that job details can be extracted from individual job URLs

**Run:**
```bash
npm run build
node dist/test/test-extractors.js
```

**What it tests:**
- ✅ Extracts job title from posting page
- ✅ Extracts job description/responsibilities
- ✅ Extracts eligibility/requirements
- ✅ Extracts expiry date (if available)
- ✅ Extracts apply link

**Expected output:**
```
Job Extractor Functionality Test
================================================================================

Available extractors: amgen, bayer, gsk, novartis, pfizer

AMGEN EXTRACTOR
================================================================================
Testing URL: https://amgen.wd1.myworkdayjobs.com/job/India-Bangalore/...

✅ Extraction successful
   Title: Senior Manager - Data Analytics
   Expiry: 2025-12-31
   Description: We are seeking a talented Senior Manager...
```

**Success criteria:**
- All extractors present
- Job titles are non-empty
- Descriptions contain meaningful content
- Expiry dates are in YYYY-MM-DD format (or blank)

**Note:** For this test to work with real data, you should run `test-search.ts` first to generate actual job URLs.

---

### 4. End-to-End Integration Test (test-manager-jobs.ts)

**Purpose:** Full pipeline: search → extract → report with error tracking

**Run:**
```bash
npm run build
node dist/test/test-manager-jobs.js
```

**What it tests:**
- ✅ Searches for "Manager" jobs (2 per company)
- ✅ Extracts details from each job URL
- ✅ Tracks extraction errors separately (404s, timeouts, etc.)
- ✅ Generates CSV reports for both success and failure
- ✅ Classifies error types (NOT_FOUND, TIMEOUT, NETWORK_ERROR, etc.)

**Expected output:**
```
Manager Jobs Extraction Test - CSV Reports with Error Tracking
================================================================================

Step 1: Searching for "Manager" jobs across all companies...

✅ AMGEN: Found 100 results, extracting 2 URLs
✅ BAYER: Found 50 results, extracting 2 URLs
✅ GSK: Found 50 results, extracting 2 URLs
✅ NOVARTIS: Found 50 results, extracting 2 URLs
✅ PFIZER: Found 100 results, extracting 2 URLs

Step 2: Extracting job details from 2 jobs per company...

================================================================================
AMGEN
================================================================================

📋 Job 1/2
URL: https://amgen.wd1.myworkdayjobs.com/job/...

✅ Extraction successful
   Title: Senior Manager - Analytics
   Expiry: 2025-12-31
   Desc Preview: We are seeking a talented Senior Manager with 5+ years...

...

CSV Report 1 - Successful Job Extractions
================================================================================
Company,JobTitle,Description,ExpiryDate,ApplyLink
"amgen","Senior Manager - Analytics","We are seeking a talented...",2025-12-31,"https://..."
...

CSV Report 2 - Extraction Errors (404s, Timeouts, etc.)
================================================================================
Company,URL,ErrorCode,HTTPStatus,ErrorMessage,AttemptedAt
"bayer","https://bayer.eightfold.ai/jobs/...","NOT_FOUND","404","HTTP 404: Not Found","2026-08-20T..."
...

Summary
================================================================================
✅ Successful Extractions: 8
⚠️  Extraction Errors: 2

Errors by Type:
  NOT_FOUND: 1
  TIMEOUT: 1
```

**Output Files Generated:**
- `test/manager-jobs-success.csv` - Successfully extracted jobs
  - Columns: Company, JobTitle, Description, ExpiryDate, ApplyLink
- `test/manager-jobs-errors.csv` - Failed extractions
  - Columns: Company, URL, ErrorCode, HTTPStatus, ErrorMessage, AttemptedAt

**Success criteria:**
- At least 5 jobs extracted successfully (2 per company × 5 companies)
- Both CSV files generated
- Error codes properly classified
- HTTP status codes captured for 404s

**Error Types Reference:**
- `NOT_FOUND` (404) - Job URL no longer exists
- `TIMEOUT` - Request took too long
- `NETWORK_ERROR` - Network connectivity issue
- `HTTP_ERROR` - Server error (5xx)
- `PARSE_ERROR` - Failed to parse job details
- `EXCEPTION` - Unexpected runtime error

---

## Running All Tests in Sequence

```bash
#!/bin/bash
npm run build

echo "Running Configuration Test..."
node dist/test/test-config.js

echo -e "\n\nRunning Search Test..."
node dist/test/test-search.js

echo -e "\n\nRunning Extractor Test..."
node dist/test/test-extractors.js

echo -e "\n\nRunning Integration Test..."
node dist/test/test-manager-jobs.js

echo -e "\n\n=== All tests completed ==="
```

## Interpreting Results

### Successful Test Run
- All 5 companies listed in config test
- Each company returns jobs in search test
- No critical errors in console output
- CSV files generated with data in integration test

### Common Issues

**Issue: "Cannot find module" errors**
- Run `npm run build` first
- Verify all dependencies installed with `npm install`

**Issue: Network timeouts**
- Check internet connectivity
- Try again later (sites may be temporarily unavailable)
- Some corporate firewalls may block external requests

**Issue: 404 errors in extraction errors CSV**
- This is expected and tracked correctly
- Indicates job URL was found in search but deleted before extraction
- Error is properly classified in the error report

**Issue: No results from searches**
- Verify company career sites are accessible
- Try accessing them manually in browser
- Check if your IP is blocked by rate limiting
- Wait a few minutes and try again

## Performance Baseline

Typical test execution times:

| Test | Duration | Notes |
|------|----------|-------|
| test-config.ts | <1 second | Local file loading |
| test-search.ts | 30-60 seconds | Network requests to 5 companies |
| test-extractors.ts | 5-10 seconds | With sample URLs |
| test-manager-jobs.ts | 60-120 seconds | Complete pipeline + extractions |

**Total time:** ~2-3 minutes for full test suite

## Next Steps

- Review the generated CSV files for data quality
- Check [API.md](API.md) for programmatic usage
- See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Read [RATE_LIMITING.md](RATE_LIMITING.md) for production safety settings
