/**
 * Workday Platform Helper
 *
 * Common parsing logic for Workday-based career sites
 * Used by: Amgen, Pfizer, and any other Workday implementations
 */

import { SearchResult } from '../types.js';

export interface WorkdayConfig {
  companyId: string;
  company: string;
  baseUrl: string;
}

export class WorkdayHelper {
  private config: WorkdayConfig;

  constructor(config: WorkdayConfig) {
    this.config = config;
  }

  /**
   * Parse Workday HTML and extract job listings
   */
  parse(html: string): SearchResult[] {
    const jobs: SearchResult[] = [];

    try {
      // Pattern 1: h3 with link - <h3><a href="/path">Job Title</a></h3>
      const h3Pattern = /<h3[^>]*>[\s\n]*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
      this.extractJobsFromPattern(html, h3Pattern, jobs);

      // Pattern 2: link with data-automation attribute
      if (jobs.length < 5) {
        const automationPattern = /<a[^>]*data-automation="jobTitle"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        this.extractJobsFromPattern(html, automationPattern, jobs);
      }

      // Pattern 3: generic h2/h3 heading links
      if (jobs.length < 5) {
        const headingPattern = /<(h2|h3)[^>]*>[\s\n]*<a[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
        let match;
        while ((match = headingPattern.exec(html)) !== null) {
          const href = match[2];
          const title = match[3].trim();
          if (this.isValidJob(title, href)) {
            this.addJob(jobs, title, href);
          }
        }
      }
    } catch (error) {
      console.warn(`Error parsing Workday (${this.config.companyId}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return jobs;
  }

  private extractJobsFromPattern(html: string, pattern: RegExp, jobs: SearchResult[]): void {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const href = match[1];
      const title = match[2].trim();

      if (this.isValidJob(title, href)) {
        this.addJob(jobs, title, href);
      }
    }
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
        source: 'workday',
      });
    }
  }
}
