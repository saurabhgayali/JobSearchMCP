# Setup Guide

## Requirements

### System Requirements
- **Node.js:** v18.0.0 or higher
- **npm:** v8.0.0 or higher
- **OS:** Windows, macOS, or Linux
- **Memory:** 512 MB minimum
- **Disk Space:** 500 MB for dependencies and build artifacts

### Development Requirements (Optional)
- Git for version control
- VS Code or any TypeScript-capable editor
- Terminal/Shell environment

## Installation

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd JobSearchMCP
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- TypeScript compiler
- Model Context Protocol SDK
- Development tools (ts-node, type definitions)

### 3. Build TypeScript

```bash
npm run build
```

This compiles all TypeScript files in `src/` and `test/` to JavaScript in `dist/`.

### 4. Verify Installation

```bash
node dist/test/test-config.js
```

Expected output: List of available companies (Amgen, Bayer, GSK, Novartis, Pfizer)

## Project Structure

```
JobSearchMCP/
├── src/
│   ├── config.json                 # List of companies and search URLs
│   ├── config-loader.ts            # Configuration loader
│   ├── search-executor.ts          # Search functionality
│   ├── extraction-helpers.ts       # Reusable extraction utilities
│   ├── types.ts                    # TypeScript type definitions
│   └── extractors/
│       ├── index.ts                # Extractor registry
│       ├── types.ts                # Extractor interfaces
│       ├── amgen.ts                # Amgen extractor
│       ├── pfizer.ts               # Pfizer extractor
│       ├── bayer.ts                # Bayer extractor
│       ├── gsk.ts                  # GSK extractor
│       └── novartis.ts             # Novartis extractor
├── test/
│   ├── test-config.ts              # Config loading test
│   ├── test-search.ts              # Search functionality test
│   ├── test-extractors.ts          # Extractor functionality test
│   ├── test-manager-jobs.ts        # E2E integration test
│   ├── sample.json                 # Sample configuration template
│   └── *.html                      # Sample HTML files
├── app/
│   ├── demo/
│   │   └── page.tsx                # React demo page
│   └── api/
│       └── search-jobs/
│           └── route.ts            # API endpoint for demo
├── docs/
│   ├── SETUP.md                    # This file
│   ├── RUNNING_TESTS.md            # Test documentation
│   ├── DEPLOYMENT.md               # Deployment guides
│   ├── RATE_LIMITING.md            # Rate limiting config
│   └── API.md                      # API documentation
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── README.md                        # Project overview
└── .gitignore                      # Git ignore patterns

```

## Quick Commands Reference

```bash
# Build TypeScript
npm run build

# Run TypeScript with ts-node (no build needed)
npm run dev

# Run a test
node dist/test/test-config.js
node dist/test/test-search.js
node dist/test/test-extractors.js
node dist/test/test-manager-jobs.js

# Start MCP server
npm start

# Clean build artifacts
npm run clean

# View compiled JavaScript
ls -la dist/
```

## Troubleshooting

### "Node.js version too old"
```bash
# Check your Node.js version
node --version

# Update Node.js from https://nodejs.org/
```

### "Command not found: npm"
```bash
# npm is included with Node.js installation
# Reinstall Node.js from https://nodejs.org/
```

### "Cannot find module 'typescript'"
```bash
# Reinstall dependencies
npm install
npm run build
```

### Tests failing with network errors
- Verify internet connectivity
- Check if career site URLs are accessible from your network
- Some corporate firewalls may block access to external sites
- Try running from a different network if behind a proxy

### Large file sizes in dist/
```bash
# Clean build artifacts and rebuild
npm run clean
npm run build
```

## Next Steps

1. Read [RUNNING_TESTS.md](RUNNING_TESTS.md) to understand the test suite
2. Run the tests to verify your setup is complete
3. Check [API.md](API.md) to understand the extraction pipeline
4. Review [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment options
