/**
 * GSK Parser
 *
 * Handles job listings from GSK careers site (Phenom People platform)
 * Individual company parser - delegates parsing to PhenomHelper
 */

import { Parser } from './index.js';
import { SearchResult } from '../types.js';
import { PhenomHelper } from '../helpers/phenom-helper.js';

export class GskParser implements Parser {
  readonly companyId = 'gsk';
  private helper: PhenomHelper;

  constructor() {
    this.helper = new PhenomHelper({
      companyId: 'gsk',
      company: 'GSK',
      baseUrl: 'https://jobs.gsk.com',
    });
  }

  parse(html: string, _searchUrl: string): SearchResult[] {
    return this.helper.parse(html);
  }
}
