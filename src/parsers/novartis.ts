/**
 * Novartis Parser
 *
 * Handles job listings from Novartis careers site (Drupal platform)
 * Individual company parser - delegates parsing to DrupalHelper
 */

import { Parser } from './index.js';
import { SearchResult } from '../types.js';
import { DrupalHelper } from '../helpers/drupal-helper.js';

export class NovartisParser implements Parser {
  readonly companyId = 'novartis';
  private helper: DrupalHelper;

  constructor() {
    this.helper = new DrupalHelper({
      companyId: 'novartis',
      company: 'Novartis',
      baseUrl: 'https://www.novartis.com',
    });
  }

  parse(html: string, searchUrl: string): SearchResult[] {
    return this.helper.parse(html);
  }
}
