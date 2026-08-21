/**
 * Bayer Parser
 *
 * Handles job listings from Bayer careers site (Eightfold AI platform)
 * Individual company parser - delegates parsing to EightfoldHelper
 */

import { Parser } from './index.js';
import { SearchResult } from '../types.js';
import { EightfoldHelper } from '../helpers/eightfold-helper.js';

export class BayerParser implements Parser {
  readonly companyId = 'bayer';
  private helper: EightfoldHelper;

  constructor() {
    this.helper = new EightfoldHelper({
      companyId: 'bayer',
      company: 'Bayer',
      baseUrl: 'https://bayer.eightfold.ai',
    });
  }

  parse(html: string, _searchUrl: string): SearchResult[] {
    return this.helper.parse(html);
  }
}
