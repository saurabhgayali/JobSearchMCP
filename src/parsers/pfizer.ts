/**
 * Pfizer Parser
 *
 * Handles job listings from Pfizer careers site (Workday platform)
 * Uses Workday API for direct job search instead of HTML parsing
 */

import { Parser } from './index.js';
import { SearchResult } from '../types.js';
import { WorkdayAPIHelper, WorkdayAPIConfig } from '../helpers/workday-api-helper.js';

export class PfizerParser implements Parser {
  readonly companyId = 'pfizer';
  private apiHelper: WorkdayAPIHelper;

  constructor() {
    const config: WorkdayAPIConfig = {
      companyId: 'pfizer',
      company: 'Pfizer',
      baseUrl: 'https://pfizer.wd1.myworkdayjobs.com',
      apiPath: 'pfizer/PfizerCareers', // Pfizer uses "PfizerCareers" as portal name
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
