/**
 * Search Executor for Job Search MCP
 *
 * Handles job search execution with modular parser architecture.
 * Each company has individual parser handling its platform-specific HTML.
 */

import { SearchResult, SearchResponse } from './types.js';
import { ParserRegistry } from './parsers/index.js';
import { AmgenParser } from './parsers/amgen.js';
import { PfizerParser } from './parsers/pfizer.js';
import { NovartisParser } from './parsers/novartis.js';
import { BayerParser } from './parsers/bayer.js';
import { GskParser } from './parsers/gsk.js';

export class SearchExecutor {
  private timeout: number;
  private parserRegistry: ParserRegistry;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
    this.parserRegistry = new ParserRegistry();
    this.initializeParsers();
  }

  /**
   * Initialize all company parsers and register them
   */
  private initializeParsers(): void {
    this.parserRegistry.register(new AmgenParser());
    this.parserRegistry.register(new PfizerParser());
    this.parserRegistry.register(new NovartisParser());
    this.parserRegistry.register(new BayerParser());
    this.parserRegistry.register(new GskParser());
  }

  /**
   * Execute a search on a company's career site
   */
  async search(companyId: string, searchUrl: string): Promise<SearchResponse> {
    try {
      const parser = this.parserRegistry.getParser(companyId);
      if (!parser) {
        return {
          success: false,
          company: companyId,
          url: searchUrl,
          results: [],
          count: 0,
          error: `No parser registered for company: ${companyId}`,
        };
      }

      // Check if parser has async API search capability
      if (parser.apiSearch) {
        try {
          // Extract search text from URL query parameters
          const searchText = this.extractSearchText(searchUrl);
          const results = await parser.apiSearch(searchText, 100); // Request up to 100 results

          return {
            success: true,
            company: companyId,
            url: searchUrl,
            results,
            count: results.length,
          };
        } catch (apiError) {
          console.warn(
            `API search failed for ${companyId}, falling back to HTML parsing: ${
              apiError instanceof Error ? apiError.message : 'Unknown error'
            }`
          );
          // Fall through to HTML parsing
        }
      }

      // Fall back to HTML parsing with pagination support
      const allResults: SearchResult[] = [];
      let pageNum = 1;
      let maxPages = 50; // Increased to fetch all available pages (no limit on total results)

      while (pageNum <= maxPages) {
        const pageUrl = this.getPageUrl(searchUrl, companyId, pageNum);

        try {
          const response = await fetch(pageUrl, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            },
            signal: AbortSignal.timeout(this.timeout),
          });

          if (!response.ok) {
            // On first page, return error; on subsequent pages, just stop
            if (pageNum === 1) {
              return {
                success: false,
                company: companyId,
                url: searchUrl,
                results: [],
                count: 0,
                error: `HTTP ${response.status}: ${response.statusText}`,
              };
            }
            break;
          }

          const html = await response.text();
          const pageResults = this.parseResults(companyId, html, pageUrl);

          if (pageResults.length === 0 && pageNum > 1) {
            // No more results on this page, stop pagination
            break;
          }

          allResults.push(...pageResults);
          pageNum++;
        } catch (error) {
          // Stop pagination on error (but return results we've collected)
          break;
        }
      }

      return {
        success: true,
        company: companyId,
        url: searchUrl,
        results: allResults,
        count: allResults.length,
      };
    } catch (error) {
      return {
        success: false,
        company: companyId,
        url: searchUrl,
        results: [],
        count: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate pagination URL for a given page number
   * Handles site-specific pagination patterns
   */
  private getPageUrl(baseUrl: string, companyId: string, pageNum: number): string {
    if (pageNum === 1) {
      return baseUrl;
    }

    const url = new URL(baseUrl);

    // Site-specific pagination handling
    if (companyId === 'novartis') {
      // Novartis uses offset parameter
      url.searchParams.set('offset', String((pageNum - 1) * 20));
    } else if (companyId === 'bayer') {
      // Eightfold uses page parameter
      url.searchParams.set('page', String(pageNum));
    } else if (companyId === 'gsk') {
      // GSK likely uses page parameter
      url.searchParams.set('page', String(pageNum));
    }

    return url.toString();
  }

  /**
   * Extract search text from URL query parameters
   * Handles common patterns: ?q=, ?searchText=, ?keywords=
   */
  private extractSearchText(url: string): string {
    try {
      const urlObj = new URL(url);
      return (
        urlObj.searchParams.get('q') ||
        urlObj.searchParams.get('searchText') ||
        urlObj.searchParams.get('keywords') ||
        ''
      );
    } catch {
      return '';
    }
  }

  /**
   * Parse HTML results using registered parser for company
   */
  private parseResults(companyId: string, html: string, searchUrl: string): SearchResult[] {
    try {
      const parser = this.parserRegistry.getParser(companyId);
      if (!parser) {
        console.warn(`No parser registered for company: ${companyId}`);
        return [];
      }

      return parser.parse(html, searchUrl);
    } catch (error) {
      console.warn(`Error parsing results for ${companyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }


  /**
   * Normalize a job posting to common format
   */
  normalizeJob(jobData: Partial<SearchResult>, companyId: string): SearchResult {
    return {
      title: jobData.title || '',
      url: jobData.url || '',
      company: jobData.company || '',
      location: jobData.location || '',
      posted_date: jobData.posted_date || undefined,
      description: jobData.description || undefined,
      employment_type: jobData.employment_type || undefined,
      source: jobData.source || companyId,
    };
  }
}
