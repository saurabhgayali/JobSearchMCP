/**
 * Drupal Platform Helper
 *
 * Common parsing logic for Drupal-based career sites
 * Used by: Novartis and any other Drupal implementations
 */

import { SearchResult } from '../types.js';

export interface DrupalConfig {
  companyId: string;
  company: string;
  baseUrl: string;
}

export class DrupalHelper {
  private config: DrupalConfig;

  constructor(config: DrupalConfig) {
    this.config = config;
  }

  /**
   * Parse Drupal HTML and extract job listings from table format
   */
  parse(html: string): SearchResult[] {
    const jobs: SearchResult[] = [];

    try {
      // Look for table rows with job links
      // Pattern: <tr>...<a href="/careers/career-search/job/details/req-...">Job Title</a>...</tr>
      const rowPattern = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
      const linkPattern = /<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;

      let rowMatch;
      while ((rowMatch = rowPattern.exec(html)) !== null && jobs.length < 50) {
        const rowHtml = rowMatch[0];

        // Find links in this row
        let linkMatch;
        let foundJobInRow = false;

        linkPattern.lastIndex = 0; // Reset pattern state
        while ((linkMatch = linkPattern.exec(rowHtml)) !== null) {
          const href = linkMatch[1];
          const text = linkMatch[2].trim();

          // First link in the row is typically the job title
          if (!foundJobInRow && href.includes('/careers/career-search/job/details/')) {
            if (this.isValidJob(text, href)) {
              this.addJob(jobs, text, href);
              foundJobInRow = true;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Error parsing Drupal (${this.config.companyId}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return jobs;
  }

  private isValidJob(title: string, href: string): boolean {
    return !!(title && title.length > 2 && href && !href.includes('#'));
  }

  private addJob(jobs: SearchResult[], title: string, href: string): void {
    let url = href;
    if (url.startsWith('/')) {
      url = `${this.config.baseUrl}${url}`;
    }

    if (!jobs.some(j => j.url === url)) {
      jobs.push({
        title,
        url,
        company: this.config.company,
        location: 'Multiple',
        source: 'drupal',
      });
    }
  }
}
