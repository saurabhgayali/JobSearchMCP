# Node.js/TypeScript MCP - Quick Start

## Installation

### Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

### Setup

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build
```

## Running the Server

### Option 1: Production (Compiled)

```bash
# Build first (if not already done)
npm run build

# Start the server
npm start
```

### Option 2: Development (Direct TypeScript)

```bash
# Run with ts-node (no build needed)
npm run dev
```

The server will:
1. Load all site configurations from `sites/` directory
2. Register MCP tools
3. Listen for client connections via stdio

### Server Output

```
Starting Job Search MCP Server...
Loaded 5 companies
Server connected and listening for requests
```

The server is now ready to receive tool calls from MCP clients.

## Testing

Run the configuration loader test:

```bash
npm test
```

**Expected output:**

```
============================================================
Testing Configuration Loader
============================================================

1. Testing getAllCompanies():
   Found 5 companies: amgen, bayer, gsk, novartis, pfizer

2. Testing getCompanyInfo():

   Amgen:
     - Career URL: https://amgen.wd1.myworkdayjobs.com/Careers
     - Search URL: https://amgen.wd1.myworkdayjobs.com/Careers?q={keyword}
     - Parameters (4):
       * q: Search (text)
       * location: Location (text)
       * timeType: Time Type (select)
       * country: Country/Territory (select)
...
```

## Project Structure

```
JobSearchMCP/
├── src/                      # Source code & configuration
│   ├── server.ts             # MCP server entry point
│   ├── config-loader.ts      # Loads site configurations
│   ├── search-executor.ts    # Executes searches & parses results
│   ├── types.ts              # TypeScript type definitions
│   ├── config.json           # Company registry
│   └── site_*.json           # Site analysis files
├── sites/                    # Company-specific configurations
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
├── reports/                  # Project documentation
├── dist/                     # Compiled JavaScript output
├── package.json              # NPM configuration
└── tsconfig.json             # TypeScript configuration
```

## npm Scripts

```bash
npm run build              # Compile TypeScript to JavaScript
npm run dev               # Run with ts-node (no build)
npm start                 # Run compiled server
npm test                  # Run configuration tests
npm run clean             # Delete dist/ folder
```

## Debugging

### Check if configurations load

```bash
npm test
```

### View compiled JavaScript

```bash
# Check what was generated
ls dist/
```

### Enable source maps

Already enabled in `tsconfig.json`. Source maps help with debugging compiled code.

## Common Issues

### Issue: `npm: command not found`

**Solution:** Install Node.js from https://nodejs.org/ (v18 or higher)

### Issue: `node_modules not found`

**Solution:**
```bash
npm install
```

### Issue: TypeScript errors

**Solution:**
```bash
npm run build
```

This will show compilation errors.

### Issue: Module import errors in compiled output

**Solution:** Make sure `tsconfig.json` has `"module": "ES2020"` and `"type": "module"` in `package.json`.

## Adding a New Company

1. Analyze the company's career site
## Adding a New Company

1. Add entry to `src/config.json`:

```json
{
  "name": "NewCompany",
  "career_url": "https://careers.newcompany.com"
}
```

2. Create `sites/<company>.json` following `test/sample.json` structure.

3. Create extractor in `src/extractors/<company>.ts`:

```typescript
import { JobExtractor, ExtractionResult, JobExtraction } from './types.js';

export class NewCompanyExtractor implements JobExtractor {
  async extract(url: string): Promise<ExtractionResult> {
    // Fetch job URL and extract:
    // - jobTitle
    // - jobDescription
    // - eligibility
    // - expiryDate
    // - applyLink
    return { success: true, data: extraction };
  }
  
  getSource(): string {
    return 'newcompany';
  }
}
```

4. Register in `src/extractors/index.ts`:

```typescript
this.extractors.set('newcompany', new NewCompanyExtractor());
```

5. Rebuild and test:

```bash
npm run build
npm test
node test/test-extractors.js
```

## Testing Job Extraction

Extract details from individual job posting URLs:

```bash
npm run build
node test/test-extractors.js
```

Expected output shows extracted job title, description, eligibility, expiry date, and apply link for each site.
3. Run `npm test` to verify it loads
4. Restart the server - it will automatically discover the new company

Example:

```bash
cat > sites/mycompany.json << 'EOF'
{
  "name": "My Company",
  "career_url": "https://careers.mycompany.com",
  "search_url": "https://careers.mycompany.com/jobs?search={keyword}",
  "params": [
    {
      "name": "search",
      "label": "Search",
      "type": "text",
      "required": true,
      "values": []
    }
  ]
}
EOF

npm test
```

## Building for Production

```bash
# Clean previous build
npm run clean

# Build optimized version
npm run build

# Test the build
npm start
```

The compiled server is in `dist/server.js`.

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Test configuration: `npm test`
3. ✅ Build the project: `npm run build`
4. ✅ Start the server: `npm start`
5. ✅ Connect an MCP client to use the tools
6. ✅ Add new companies by creating JSON configs in `sites/`

## Documentation

For more details, see:
- **MCP_USAGE.md** - Complete MCP tool documentation
- **IMPLEMENTATION.md** - Architecture and design decisions
- **BUILD.md** - Build instructions for site configurations

