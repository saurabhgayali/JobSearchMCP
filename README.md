# Job Search MCP

A configuration-driven MCP for searching jobs directly from company career websites.

The project maintains company-specific career-site configurations while keeping the MCP search architecture common across all companies.

## Project Architecture

```text
config.json
    │
    │  list of companies + search URLs
    ▼
AI discovery/build process
    │
    │  inspect each career site
    ▼
sites/
    ├── amgen.json
    ├── pfizer.json
    ├── novartis.json
    └── ...
    │
    ▼
Common MCP architecture
    │
    ▼
AI / MCP job search
```

## Configuration

`config.json` is the source of truth for the companies that the project supports.

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

The structure must follow `sample.json`.

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

## `sample.json`

`sample.json` defines the expected structure for individual company files.

It is a schema-by-example/template rather than a company registry.

The current example uses parameters such as `location`, `timeType`, `LocationCountry`, `jobFamilyGroup`, and `workerSubType`. 
## BUILD.md

`BUILD.md` contains instructions for the AI/development process that builds the MCP from the company configurations.

The build process should:

1. Read `config.json`.
2. Process every company listed in `sites`.
3. Visit/analyze the supplied search URL.
4. Determine the company's actual career/search structure.
5. Discover the available search parameters and their values.
6. Generate or update the corresponding `sites/<company>.json`.
7. Ensure the generated file follows the structure defined by `sample.json`.
8. Build/update the common MCP implementation.
9. Validate that all configured sites can be searched.

## UPDATE.md

`UPDATE.md` contains instructions for rebuilding the project when a new release is created.

When `config.json` changes, the AI must rebuild **all** company definitions, not only newly added companies.

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
config.json updated
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