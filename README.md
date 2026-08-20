# Job Search Engine

Fast, reliable job search across 5 major pharmaceutical companies.

Search for jobs directly from Amgen, Bayer, GSK, Novartis, and Pfizer career websites. Extract job titles, descriptions, requirements, and apply links instantly.

**Demo:** https://[your-vercel-app].vercel.app/

## Features

- ✅ Search across 5 companies simultaneously
- ✅ Extract detailed job information (title, description, requirements, expiry)
- ✅ Track failed extractions with error codes (404s, timeouts, etc.)
- ✅ Generate CSV reports with results
- ✅ Zero external dependencies, fast regex-based parsing
- ✅ TypeScript + strict type safety
- ✅ Comprehensive error handling and classification
- ✅ Rate-limited API (5 searches/day/IP)

## Technology Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Next.js + Node.js
- **Parsing:** Regex-based HTML extraction (no heavy dependencies)
- **Runtime:** Node.js (v18+)
- **Language:** TypeScript 5.3+
- **Build:** TypeScript Compiler (tsc)
- **Deployment:** Vercel (recommended) or AWS Lambda

## Quick Start

### Try the Demo

Visit: `https://[your-vercel-app].vercel.app/`

You'll be redirected to the job search interface. Enter a job title, select companies, and browse results instantly.

### Local Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run a test
node dist/test/test-manager-jobs.js

# Start development server (requires Next.js setup)
npm run dev
```

### Production Deployment

```bash
# Deploy to Vercel (recommended)
npm install -g vercel
vercel

# Or deploy to AWS
# See docs/DEPLOYMENT.md for AWS Lambda setup
```

## Project Architecture

```
User searches for jobs → Demo page (/app/demo/page.tsx)
                          ↓
                    React UI Component
                    - Search input
                    - Company multi-select
                    - Sortable results tables
                    ↓
                   REST API (/api/search-jobs)
                    ↓
    ┌───────────────┬────────────────┬────────────────┐
    │               │                │                │
  Amgen          Bayer            GSK           Novartis  Pfizer
(Workday)   (Eightfold AI)    (Workday)      (Drupal)   (Workday)
    │               │                │                │
    └───────────────┴────────────────┴────────────────┘
                    ↓
          Search Executor (src/search-executor.ts)
          - Fetches job URLs from each site
          - Parses HTML for job listings
          ↓
    Extractor Registry (src/extractors/)
    - Extracts job details from each URL
    - Company-specific parsers
    - Error tracking & classification
          ↓
    Extraction Helpers (src/extraction-helpers.ts)
    - CSV report generation
    - Error aggregation
          ↓
    REST API Response (JSON)
          ↓
    Demo Page displays results
    - Success table: Jobs with details
    - Error table: Failed extractions
    - Download CSV buttons
```

## Configuration

`src/config.json` is the source of truth for the companies that the project supports.

Example:

```json
{
  "projectname": "Job Search MCP",
  "sites": [
    {
      "name": "Amgen",
      "search_url": "https://amgen.wd1.myworkdayjobs.com/Careers?q=Engineer"
    },
    {
      "name": "Pfizer",
      "search_url": "..."
    }
  ]
}
```

Only the company name and a usable search URL need to be supplied when adding a new company.

## Site Definitions

Each company is represented by a separate file under `sites/`.

For example:

```text
sites/amgen.json
```

The structure must follow `test/sample.json`.

A site definition contains:

- company name
- career URL
- search URL
- supported search parameters
- parameter labels
- parameter types
- available parameter values

The parameter structure is intentionally an array rather than fixed JSON keys because different career websites expose different search parameters.

For example, one site may expose:

```text
location
country
jobType
```

while another may expose:

```text
location
timeType
LocationCountry
jobFamilyGroup
workerSubType
```

The MCP must not assume that every company supports the same parameters.

## Job Extractors

The project includes **site-specific job extractors** that parse individual job posting URLs and extract detailed information.

### Extracted Data

Each extractor retrieves:

- **Job Title** - Position name
- **Job Description** - Full job description/responsibilities (excludes headers/footers)
- **Eligibility** - Requirements, qualifications, and skills
- **Expiry Date** - Application closing date (YYYY-MM-DD format, blank if not available)
- **Apply Link** - Direct URL to apply (may differ from job posting URL)

### Available Extractors

```
src/extractors/
├── types.ts                  # JobExtractor interface & types
├── amgen.ts                  # Amgen (Workday-based)
├── pfizer.ts                 # Pfizer (Workday-based)
├── bayer.ts                  # Bayer (Eightfold AI)
├── gsk.ts                    # GSK (Workday-based)
├── novartis.ts               # Novartis (Drupal)
└── index.ts                  # ExtractorRegistry
```

### Usage Example

```typescript
import { ExtractorRegistry } from './src/extractors/index.js';

const registry = new ExtractorRegistry();
const amgenExtractor = registry.getExtractor('amgen');

const result = await amgenExtractor?.extract(
  'https://amgen.wd1.myworkdayjobs.com/job/India---Hyderabad/Assoc-Director---Data-Product-Mgmt_R-219150'
);

if (result?.success && result.data) {
  console.log(result.data.jobTitle);
  console.log(result.data.jobDescription);
  console.log(result.data.eligibility);
}
```

## Testing

The project includes a comprehensive test suite for validating search and extraction functionality.

### Test Suite Overview

All tests are self-contained TypeScript files that can be run independently:

```bash
npm run build
node dist/test/[test-name].js
```

### Available Tests

#### 1. **test-config.ts** - Configuration Loading Test
Tests that company configurations load correctly from `src/config.json`.

```bash
node dist/test/test-config.js
```

**Purpose:** Validates configuration structure and company discovery
**Output:** Lists available companies and their search URLs

---

#### 2. **test-search.ts** - Job Search Test
Tests the search functionality across all companies.

```bash
node dist/test/test-search.js
```

**Purpose:** Verifies that searches return valid job URLs
**Output:** Search results for "Manager" jobs from each company
**Note:** Requires internet connectivity to actual career sites

---

#### 3. **test-extractors.ts** - Job Extraction Test
Tests that job detail extraction works for each company's job URLs.

```bash
node dist/test/test-extractors.js
```

**Purpose:** Validates job title, description, and eligibility extraction
**Output:** Extraction success rate and field details
**Note:** Requires real job URLs from test-search.ts output

---

#### 4. **test-manager-jobs.ts** - End-to-End Integration Test
Complete pipeline test: searches for jobs → extracts details → generates reports

```bash
node dist/test/test-manager-jobs.js
```

**Purpose:** Full integration test with error tracking and CSV report generation
**Output:** 
  - `test/manager-jobs-success.csv` - Successfully extracted job data
  - `test/manager-jobs-errors.csv` - Extraction errors (404s, timeouts, etc.)
  - Console summary showing success rate and error breakdown

### Running All Tests

```bash
npm run build
node dist/test/test-config.js
node dist/test/test-search.js
node dist/test/test-extractors.js
node dist/test/test-manager-jobs.js
```

### Test Output Files

Generated CSV reports are stored in the `test/` folder:
- `manager-jobs-success.csv` - Successful job extractions
- `manager-jobs-errors.csv` - Failed extraction attempts with error codes
- Sample HTML files for debugging

These files are generated during test runs and can be safely deleted. They are in `.gitignore`.

## `test/sample.json`

`test/sample.json` defines the expected structure for individual company files.

It is a schema-by-example/template rather than a company registry.

The current example uses parameters such as `location`, `timeType`, `LocationCountry`, `jobFamilyGroup`, and `workerSubType`. 
## BUILD.md

`BUILD.md` contains instructions for the AI/development process that builds the MCP from the company configurations.

The build process should:

1. Read `src/config.json`.
2. Process every company listed in `sites`.
3. Visit/analyze the supplied search URL.
4. Determine the company's actual career/search structure.
5. Discover the available search parameters and their values.
6. Generate or update the corresponding `sites/<company>.json`.
7. Ensure the generated file follows the structure defined by `test/sample.json`.
8. Build/update the common MCP implementation.
9. Validate that all configured sites can be searched.

## UPDATE.md

See `ai/UPDATE.md` for instructions for rebuilding the project when a new release is created.

When `src/config.json` changes, the AI must rebuild **all** company definitions, not only newly added companies.

This is intentional.

Existing career sites can change their:

- search URLs
- query parameters
- filter names
- filter values
- career-site structure
- ATS implementation

Therefore, every release should re-check existing `sites/*.json` files against the current live career sites.

```text
src/config.json updated
       │
       ▼
Rebuild ALL sites
       │
       ├── New company → create site JSON
       │
       └── Existing company → re-analyze and update
       │
       ▼
Rebuild common MCP
       │
       ▼
Validate

```

## Project Structure

```
JobSearchMCP/
├── src/                      # Source code & configs
│   ├── server.ts             # MCP server entry point
│   ├── search-executor.ts    # Search execution & parsing
│   ├── config-loader.ts      # Configuration loader
│   ├── types.ts              # TypeScript types
│   ├── config.json           # Company registry
│   ├── site_configurations.json
│   └── site_analysis.json
├── sites/                    # Company-specific configs
│   ├── amgen.json
│   ├── pfizer.json
│   ├── novartis.json
│   ├── bayer.json
│   └── gsk.json
├── test/                     # Tests & test data
│   ├── test-*.js             # Test scripts
│   ├── sample.json           # Configuration template
│   └── *.html                # Sample HTML files
├── ai/                       # AI development notes (Gitignored)
│   ├── AI.md
│   └── UPDATE.md
├── reports/                  # Documentation
│   ├── IMPLEMENTATION.md
│   ├── ANALYSIS_GUIDE.md
│   ├── MCP_USAGE.md
│   └── MIGRATION.md
├── dist/                     # Compiled JavaScript
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript config
└── README.md                 # This file
```

## Technology
Runtime: Node.js
Language: TypeScript
MCP SDK: Official Model Context Protocol TypeScript SDK
Configuration: JSON

## Design Principle

The project separates **site-specific knowledge** from **common MCP logic**.

```text
sites/*.json
    = How a particular company career site works

MCP implementation
    = How to search any configured company

AI
    = Understand the user's request and select/use the appropriate
      company search configuration
```

The MCP should not contain hard-coded assumptions about parameters such as `location`, `remote`, `full_time`, or `job_type`.

A parameter only exists for a company if that company's career site actually supports it or exposes the information required by the configuration.

## Goal

The goal is to create a reusable job-search MCP where adding companies is primarily a matter of adding their search URLs to `config.json`, allowing the AI build process to discover and maintain the site-specific configurations automatically.

