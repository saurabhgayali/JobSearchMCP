/**
 * Parser Interface and Registry
 *
 * Defines the contract that all site-specific parsers must implement.
 * Enables a plugin-based architecture for adding new sites without modifying core code.
 */

import { SearchResult } from '../types.js';

/**
 * Interface that all parsers must implement
 */
export interface Parser {
  /**
   * Company/Site ID this parser handles (e.g., "amgen", "novartis")
   */
  readonly companyId: string;

  /**
   * Parse HTML response and extract job listings
   * @param html The HTML content from the careers page
   * @param searchUrl The URL that was used to fetch this HTML
   * @returns Array of extracted job results
   */
  parse(html: string, searchUrl: string): SearchResult[];

  /**
   * Optional: Async API search for companies with public APIs
   * If provided, SearchExecutor will use this instead of HTML parsing
   * @param searchText The search query
   * @param limit Maximum results to return
   * @returns Promise of extracted job results
   */
  apiSearch?(searchText: string, limit?: number): Promise<SearchResult[]>;
}

/**
 * Registry for site-specific parsers
 * Allows dynamic loading and management of parsers
 */
export class ParserRegistry {
  private parsers: Map<string, Parser> = new Map();

  /**
   * Register a parser for a specific company/site
   */
  register(parser: Parser): void {
    if (this.parsers.has(parser.companyId)) {
      console.warn(`Parser for "${parser.companyId}" already registered, replacing it`);
    }
    this.parsers.set(parser.companyId, parser);
  }

  /**
   * Get a parser for a specific company
   */
  getParser(companyId: string): Parser | undefined {
    return this.parsers.get(companyId);
  }

  /**
   * Check if a parser exists for a company
   */
  hasParser(companyId: string): boolean {
    return this.parsers.has(companyId);
  }

  /**
   * Get all registered parsers
   */
  getAllParsers(): Parser[] {
    return Array.from(this.parsers.values());
  }

  /**
   * Get count of registered parsers
   */
  getParserCount(): number {
    return this.parsers.size;
  }
}

export default ParserRegistry;
