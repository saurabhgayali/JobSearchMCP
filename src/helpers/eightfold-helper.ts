/**
 * Eightfold AI Platform Helper
 *
 * Common parsing logic for Eightfold AI-based career sites
 * Used by: Bayer and any other Eightfold implementations
 */

import { SearchResult } from '../types.js';

export interface EightfoldConfig {
  companyId: string;
  company: string;
  baseUrl: string;
}

export class EightfoldHelper {
  private config: EightfoldConfig;

  constructor(config: EightfoldConfig) {
    this.config = config;
  }

  /**
   * Parse Eightfold AI HTML and extract job listings
   */
  parse(html: string): SearchResult[] {
    const jobs: SearchResult[] = [];

    try {
      // Pattern 1: Direct talent.bayer.com job URLs (actual jobs in static HTML)
      const bayerJobPattern = /(https?:\/\/talent\.bayer\.com\/careers\/job\/\d+)/gi;
      let match;
      while ((match = bayerJobPattern.exec(html)) !== null) {
        const url = match[1];
        if (this.isValidJob('Job', url)) {
          this.addJob(jobs, 'Manager Role', url);
        }
      }

      // Pattern 2: Eightfold career site job links
      if (jobs.length < 10) {
        const linkPattern = /<a[^>]*href="([^"]*\/careers\/job\/[^"]*)"[^>]*>([^<]{5,150})<\/a>/gi;
        while ((match = linkPattern.exec(html)) !== null) {
          const url = match[1];
          const title = match[2].trim();

          if (this.isValidJob(title, url)) {
            this.addJob(jobs, title, url);
          }
        }
      }

      // Pattern 3: Look for job links with /job/ path
      if (jobs.length < 10) {
        const genericJobPattern = /<a[^>]*href="([^"]*\/job\/[^"]*)"[^>]*>([^<]{5,150})<\/a>/gi;
        while ((match = genericJobPattern.exec(html)) !== null) {
          const url = match[1];
          const title = match[2].trim();

          if (this.isValidJob(title, url)) {
            this.addJob(jobs, title, url);
          }
        }
      }
    } catch (error) {
      console.warn(`Error parsing Eightfold (${this.config.companyId}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return jobs;
  }

  private isValidJob(title: string, href: string): boolean {
    return !!(
      title &&
      title.length > 2 &&
      href &&
      !href.includes('#') &&
      !title.toLowerCase().includes('menu') &&
      !title.toLowerCase().includes('home')
    );
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
        source: 'eightfold',
      });
    }
  }
}
