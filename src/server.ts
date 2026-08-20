#!/usr/bin/env node

/**
 * Job Search MCP Server
 *
 * A Model Context Protocol (MCP) server for searching jobs across multiple
 * company career sites using a configuration-driven architecture.
 *
 * Runtime: Node.js
 * Language: TypeScript
 * MCP SDK: Official Model Context Protocol TypeScript SDK
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  TextContent,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigLoader } from './config-loader.js';
import { SearchExecutor } from './search-executor.js';
import {
  CompanyInfo,
  GetCompanyInfoResponse,
  GetSearchParamsResponse,
  ListCompaniesResponse,
  SearchResponse,
} from './types.js';

// Initialize components
const configLoader = new ConfigLoader('sites');
const searchExecutor = new SearchExecutor();

// Create MCP server
const server = new Server(
  {
    name: 'JobSearchMCP',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================================================
// MCP Tools Definition
// ============================================================================

/**
 * Tool: list_companies
 * List all supported companies that can be searched for jobs
 */
async function handleListCompanies(): Promise<ListCompaniesResponse> {
  const companies = configLoader.getAllCompanies();

  const companiesInfo: CompanyInfo[] = companies.map((companyId) => {
    const config = configLoader.getCompanyInfo(companyId);
    return {
      id: companyId,
      name: config?.name || 'Unknown',
      career_url: config?.career_url || '',
      params_count: config?.params.length || 0,
    };
  });

  return {
    total_companies: companiesInfo.length,
    companies: companiesInfo,
  };
}

/**
 * Tool: get_company_info
 * Get detailed information about a company's search capabilities
 */
async function handleGetCompanyInfo(companyId: string): Promise<GetCompanyInfoResponse | { error: string }> {
  const config = configLoader.getCompanyInfo(companyId);

  if (!config) {
    const available = configLoader.getAllCompanies().join(', ');
    return {
      error: `Company not found: ${companyId}\n\nAvailable companies: ${available}`,
    };
  }

  return {
    company_id: companyId,
    name: config.name,
    career_url: config.career_url,
    search_url: config.search_url,
    parameters: config.params,
  };
}

/**
 * Tool: get_search_params
 * Get the available search parameters and filters for a specific company
 */
async function handleGetSearchParams(companyId: string): Promise<GetSearchParamsResponse | { error: string }> {
  const params = configLoader.getSearchParams(companyId);

  if (params === undefined) {
    return {
      error: `Company not found: ${companyId}`,
    };
  }

  return {
    company_id: companyId,
    parameters: params,
  };
}

/**
 * Tool: search_jobs
 * Search for jobs at a specific company using keyword and optional filters
 */
async function handleSearchJobs(
  companyId: string,
  keyword: string,
  filters?: Record<string, string>
): Promise<SearchResponse | { error: string }> {
  if (!keyword) {
    return {
      error: 'Error: keyword parameter is required',
    };
  }

  const searchUrl = configLoader.buildSearchUrl(companyId, keyword, filters || {});

  if (!searchUrl) {
    return {
      error: `Error: Company not found: ${companyId}`,
    };
  }

  const results = await searchExecutor.search(companyId, searchUrl);
  return results;
}

/**
 * Tool: search_all_companies
 * Search for jobs across all supported companies with a single keyword
 */
async function handleSearchAllCompanies(keyword: string): Promise<
  {
    keyword: string;
    companies_searched: number;
    results: SearchResponse[];
  } | { error: string }
> {
  if (!keyword) {
    return {
      error: 'Error: keyword parameter is required',
    };
  }

  const companies = configLoader.getAllCompanies();
  const allResults: SearchResponse[] = [];

  for (const companyId of companies) {
    const searchUrl = configLoader.buildSearchUrl(companyId, keyword, {});
    if (searchUrl) {
      const results = await searchExecutor.search(companyId, searchUrl);
      allResults.push(results);
    }
  }

  return {
    keyword,
    companies_searched: companies.length,
    results: allResults,
  };
}

// ============================================================================
// MCP Server Setup
// ============================================================================

/**
 * Handle ListTools requests
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_companies',
        description: 'List all supported companies that can be searched for jobs',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      } as Tool,
      {
        name: 'get_company_info',
        description: 'Get detailed information about a company\'s search capabilities and available parameters',
        inputSchema: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              description: 'The company identifier (e.g., "amgen", "pfizer", "novartis", "bayer", "gsk")',
            },
          },
          required: ['company_id'],
        },
      } as Tool,
      {
        name: 'get_search_params',
        description: 'Get the available search parameters and filters for a specific company',
        inputSchema: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              description: 'The company identifier',
            },
          },
          required: ['company_id'],
        },
      } as Tool,
      {
        name: 'search_jobs',
        description: 'Search for jobs at a specific company using keyword and optional filters',
        inputSchema: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              description: 'The company identifier (e.g., "amgen", "pfizer")',
            },
            keyword: {
              type: 'string',
              description: 'Job search keyword (e.g., "Engineer", "Manager")',
            },
            filters: {
              type: 'object',
              description: 'Optional filters specific to each company (e.g., location, timeType, etc.)',
              additionalProperties: {
                type: 'string',
              },
            },
          },
          required: ['company_id', 'keyword'],
        },
      } as Tool,
      {
        name: 'search_all_companies',
        description: 'Search for jobs across all supported companies with a single keyword',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Job search keyword (e.g., "Engineer")',
            },
          },
          required: ['keyword'],
        },
      } as Tool,
    ],
  };
});

/**
 * Handle CallTool requests
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  let result: unknown;

  try {
    switch (name) {
      case 'list_companies':
        result = await handleListCompanies();
        break;

      case 'get_company_info':
        result = await handleGetCompanyInfo(String((args as any).company_id || ''));
        break;

      case 'get_search_params':
        result = await handleGetSearchParams(String((args as any).company_id || ''));
        break;

      case 'search_jobs':
        result = await handleSearchJobs(
          String((args as any).company_id || ''),
          String((args as any).keyword || ''),
          (args as any).filters as Record<string, string> | undefined
        );
        break;

      case 'search_all_companies':
        result = await handleSearchAllCompanies(String((args as any).keyword || ''));
        break;

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown tool: ${name}`,
            } as TextContent,
          ],
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing tool ${name}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        } as TextContent,
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      } as TextContent,
    ],
  };
});

// ============================================================================
// Server Startup
// ============================================================================

async function main() {
  console.log('Starting Job Search MCP Server...');
  console.log(`Loaded ${configLoader.getTotalCompanies()} companies`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log('Server connected and listening for requests');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
