# Build Instructions

This document defines how to build the Job Search MCP from the project configuration.

## 1. Read the Project Configuration

Read:

```text
src/config.json
test/sample.json
ai/AI.md
```

`src/config.json` is the source of truth for all companies that must be supported.

Each entry provides at minimum:

```json
{
  "name": "Amgen",
  "search_url": "https://amgen.wd1.myworkdayjobs.com/Careers?q=Engineer"
}
```

Do not add companies that are not present in `src/config.json`.

## 2. Prepare the Sites Directory

The generated company configurations must be stored in:

```text
sites/
```

Each company must have one JSON file.

Example:

```text
sites/
├── amgen.json
├── pfizer.json
├── novartis.json
└── ...
```

Use a consistent, filesystem-safe filename based on the company name.

## 3. Analyze Every Career Site

For every entry in `config.json`:

1. Open the supplied `search_url`.
2. Identify the company's career platform.
3. Identify the actual career URL.
4. Determine how keyword searching works.
5. Inspect the available search/filter controls.
6. Identify the underlying parameter names.
7. Identify parameter types.
8. Identify available values for predefined/select parameters.
9. Determine how the parameters are passed to the website.
10. Test the search where possible.

Do not assume that the website uses the same parameters as another company.

## 4. Generate the Site Configuration

Create:

```text
sites/<company>.json
```

using the structure defined by `test/sample.json`.

The configuration should contain:

```text
name
career_url
search_url
params[]
```

Each parameter should contain the information necessary for the common MCP to construct and execute searches.

Example:

```json
{
  "name": "Amgen",
  "career_url": "...",
  "search_url": "...?q={keyword}",
  "params": [
    {
      "name": "location",
      "label": "Location",
      "type": "text",
      "values": []
    }
  ]
}
```

Do not invent parameters or values.

## 5. Preserve Native Parameter Names

The parameter name must represent the actual parameter used by the career website.

For example:

```text
LocationCountry
jobFamilyGroup
workerSubType
timeType
```

should remain unchanged if those are the actual site parameters.

Do not normalize them while generating the site configuration.

Normalization belongs in the common MCP layer if it is required.

## 6. Build the Common MCP

After all site configurations have been generated, implement the MCP using the common architecture.

The MCP must load company configurations dynamically from:

```text
sites/
```

It should not contain hard-coded company-specific search logic.

Avoid implementations such as:

```text
if company == "Amgen"
```

Instead:

```text
load company configuration
        ↓
read search_url
        ↓
read params[]
        ↓
construct search
        ↓
execute search
        ↓
return normalized results
```

## 7. MCP Interface

The exact MCP tools should be implemented according to the project requirements, but the architecture should allow an AI client to:

- discover supported companies;
- inspect a company's search capabilities;
- search a company;
- provide supported filters;
- retrieve job results;
- retrieve job details when required.

The MCP should use the site configuration rather than requiring company-specific code.

## 8. Parameter Handling

The MCP must support different parameter sets for different companies.

For example:

```text
Amgen:
location
timeType
LocationCountry
jobFamilyGroup
workerSubType
```

Another company may have only:

```text
location
country
jobType
```

The MCP must handle both without requiring architectural changes.

Do not assume that a filter exists globally.

## 9. Search Construction

When constructing a search:

1. Start with the company's configured `search_url`.
2. Insert the keyword using the configured search mechanism.
3. Apply only parameters supported by that company.
4. Encode parameter values correctly.
5. Submit the resulting request.
6. Parse the returned jobs.
7. Normalize the result into the common MCP response format.

Do not send unsupported parameters to a company website.

## 10. Result Normalization

Although search inputs differ between companies, returned jobs should be represented through a common structure wherever possible.

A normalized job should contain information such as:

```text
title
company
location
url
description
employment type
date posted
source
```

Only populate fields that can actually be determined.

Do not fabricate missing information.

## 11. Validation

After building each company configuration, validate it.

At minimum verify:

```text
✓ Career URL works
✓ Search URL works
✓ Keyword search works
✓ Configured parameters are valid
✓ Select values are valid where applicable
✓ Search returns jobs
✓ Site JSON follows `test/sample.json` structure
```

If a parameter cannot be validated, document the limitation rather than inventing a value.

## 12. Build Validation

After all sites are generated:

1. Confirm every company in `config.json` has a corresponding site JSON.
2. Confirm there are no obsolete site configurations unless explicitly retained.
3. Validate every JSON file.
4. Validate the common MCP.
5. Run all tests.
6. Test representative searches across different career platforms.

The build is complete only when the common MCP can operate from the generated site configurations.

## 13. Job Extractors

After successful site searches, implement **job extractors** to parse individual job posting URLs and extract detailed information.

### Extractor Requirements

For each company, create a site-specific extractor in:

```text
src/extractors/<company>.ts
```

Each extractor must:

1. Implement the `JobExtractor` interface from `src/extractors/types.ts`
2. Accept a job posting URL as input
3. Fetch and parse the job page
4. Extract:
   - **jobTitle** - Job position name
   - **jobDescription** - Full job description/responsibilities (exclude headers/footers)
   - **eligibility** - Requirements, qualifications, skills
   - **expiryDate** - Application deadline (YYYY-MM-DD format, leave blank if not available)
   - **applyLink** - Direct link to apply
5. Return blank fields for information not found (do not fabricate)
6. Handle errors gracefully

### Extractor Implementation

Template:

```typescript
import { JobExtractor, ExtractionResult, JobExtraction } from './types.js';

export class CompanyExtractor implements JobExtractor {
  async extract(url: string): Promise<ExtractionResult> {
    try {
      // 1. Fetch the job posting page
      const response = await fetch(url);
      const html = await response.text();

      // 2. Extract each field using regex or DOM patterns
      const jobTitle = this.extractJobTitle(html);
      const jobDescription = this.extractJobDescription(html);
      const eligibility = this.extractEligibility(html);
      const expiryDate = this.extractExpiryDate(html);
      const applyLink = this.extractApplyLink(html, url);

      // 3. Return structured extraction
      return {
        success: true,
        data: {
          url,
          jobTitle,
          jobDescription,
          eligibility,
          expiryDate,
          applyLink,
          extractedAt: new Date().toISOString(),
          source: 'company',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getSource(): string {
    return 'company';
  }

  // Private methods for each extraction pattern...
}
```

### Register Extractors

Update `src/extractors/index.ts`:

```typescript
this.extractors.set('companyid', new CompanyExtractor());
```

### Test Extractors

After implementing each extractor:

```bash
npm run build
node test/test-extractors.js
```

Verify extracted data contains expected information and blanks for unavailable fields.

## 14. Final Validation

The complete build is ready when:

1. ✅ All 5 companies can search for jobs (>0 results)
2. ✅ Job URLs are properly extracted
3. ✅ Individual job extractors parse details correctly
4. ✅ Missing fields are blank (not fabricated)
5. ✅ All tests pass
6. ✅ Documentation is updated