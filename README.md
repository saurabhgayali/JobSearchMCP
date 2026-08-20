# Job Search MCP

A configuration-driven **Model Context Protocol (MCP)** server for searching jobs directly from company career websites.

Allows AI assistants (Claude, ChatGPT) to search and extract job listings from **5 pharmaceutical companies** with extensible architecture for unlimited company additions.

**Current Coverage:** Amgen, Bayer, GSK, Novartis, Pfizer  
**Expandable to:** 250+ companies (healthcare, tech, finance sectors)

## Features

- ✅ MCP-compatible job search tool for AI assistants
- ✅ Configuration-driven company support (JSON-based, no code changes needed)
- ✅ Extract detailed job information: title, description, requirements, expiry date, apply links
- ✅ Intelligent error tracking: classify 404s, timeouts, network errors, parse errors
- ✅ Generate CSV reports for batch processing
- ✅ Zero external parsing dependencies (pure regex-based extraction)
- ✅ TypeScript strict mode with full type safety
- ✅ Company-specific HTML parsers (Workday, Eightfold AI, Drupal platforms)
- ✅ Optional web demo at `/demo` for manual job search
- ✅ Comprehensive test suite (4 professional tests)

## Technology Stack

- **Protocol:** Model Context Protocol (MCP) SDK (TypeScript)
- **Runtime:** Node.js v18+ (LTS recommended: v18, v20, v22)
- **Language:** TypeScript 5.3+ (strict mode)
- **Parsing:** Regex-based HTML extraction (no Puppeteer, jsdom, or Cheerio)
- **Build:** TypeScript Compiler (tsc)
- **Optional Web UI:** React + Next.js + Tailwind CSS (for manual searching)
- **Testing:** Native Node.js (no jest/mocha required)

## Quick Start

### As an MCP Server (For AI Integration)

1. **Install & Build:**
```bash
npm install
npm run build
```

2. **Start the MCP Server:**
```bash
npm start
# Server runs on stdio (ready for Claude Desktop, Cursor, or other MCP clients)
```

3. **Configure in Claude Desktop** (`~/.claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "job-search": {
      "command": "node",
      "args": ["path/to/dist/server.js"]
    }
  }
}
```

4. **Use in Claude:**
```
User: "Find me senior manager jobs at Amgen and Pfizer"
Claude: (uses MCP search tool)
Claude: "I found 12 senior manager positions with details..."
```

### As a Local CLI Tool

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run job search tests
npm run test
node dist/test/test-manager-jobs.js
```

### Optional: Web Demo for Manual Browsing

Deploy the included React demo to Vercel (optional):
```bash
# Deploy demo at https://[your-app].vercel.app/
vercel deploy
```

## Project Architecture

### As MCP Server (Primary)
```
Claude / AI Assistant
        ↓
    MCP Client Protocol (stdio)
        ↓
   MCP Server (src/server.ts)
        ↓
  Search Tool Handler
        ↓
┌──────────────────────────────────────┐
│  SearchExecutor (src/search-executor.ts)
│  - Orchestrates job searches
│  - Fetches from career site URLs
│  - Parses HTML for job listings
└──────────────────────────────────────┘
        ↓
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│          │          │          │          │          │
Amgen    Bayer      GSK     Novartis    Pfizer
│          │          │          │          │
└──────────┴──────────┴──────────┴──────────┴──────────┘
        ↓
ExtractorRegistry (src/extractors/)
- 5 Company-specific parsers
- Extract: jobTitle, description, requirements, applyLink
- Track errors with classification
        ↓
Return JSON to AI Assistant
```

### Optional: Web Demo
```
User → Web Browser
        ↓
  React Component (app/demo/page.tsx)
        ↓
  Next.js API Route (app/api/search-jobs/route.ts)
        ↓
  SearchExecutor (same as MCP uses)
        ↓
  Results + CSV reports
```

## Configuration

`src/config.json` is the source of truth for the companies that the project supports.

**Current:** 5 companies (Amgen, Bayer, GSK, Novartis, Pfizer)  
**Expandable:** Add unlimited companies via JSON configuration (no code changes needed)

Example:

```json
{
  "projectname": "Job Search MCP",
  "sites": [
    {
      "name": "Amgen",
      "search_url": "https://amgen.wd1.myworkdayjobs.com/Careers?q={SEARCH_TERM}"
    },
    {
      "name": "Bayer",
      "search_url": "https://bayer.eightfold.ai/careers?query={SEARCH_TERM}"
    }
  ]
}
```

### Adding New Companies

To add a new company:
1. **Create config entry:** Add to `src/config.json` with company name and search URL
2. **Create site definition:** Add `sites/company-name.json` with search parameters
3. **Create extractor:** Add `src/extractors/company-name.ts` with HTML parsing rules (only if using new platform)
4. **Register extractor:** Add to `src/extractors/index.ts`

**No rebuild needed** - configuration is loaded at runtime.

### Company Platform Support

| Platform | Companies | File |
|----------|-----------|------|
| Workday | Amgen, Pfizer, GSK | `src/extractors/amgen.ts`, etc. |
| Eightfold AI | Bayer | `src/extractors/bayer.ts` |
| Drupal | Novartis | `src/extractors/novartis.ts` |

**Extensibility:** Adding 50+ more companies only requires JSON config + reusable platform extractors
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

