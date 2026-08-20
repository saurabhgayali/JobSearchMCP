/**
 * Amgen Parser
 *
 * Handles job listings from Amgen careers site (Workday platform)
 * Uses Workday API for direct job search instead of HTML parsing
 */

import { Parser } from './index.js';
import { SearchResult } from '../types.js';
import { WorkdayAPIHelper, WorkdayAPIConfig } from '../helpers/workday-api-helper.js';

export class AmgenParser implements Parser {
  readonly companyId = 'amgen';
  private apiHelper: WorkdayAPIHelper;

  constructor() {
    const config: WorkdayAPIConfig = {
      companyId: 'amgen',
      company: 'Amgen',
      baseUrl: 'https://amgen.wd1.myworkdayjobs.com',
      apiPath: 'amgen/Careers', // Amgen uses "Careers" as portal name
    };
    this.apiHelper = new WorkdayAPIHelper(config);
  }

  // Fallback: parse HTML if API fails (not typically used)
  parse(_html: string, _searchUrl: string): SearchResult[] {
    return [];
  }

  // Use Workday API for search
  async apiSearch(searchText: string, limit: number = 50): Promise<SearchResult[]> {
    return this.apiHelper.search(searchText, limit);
  }
}
