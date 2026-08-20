/**
 * Phenom People Platform Helper
 *
 * Common parsing logic for Phenom People-based career sites
 * Used by: GSK and any other Phenom implementations
 */

import { SearchResult } from '../types.js';

export interface PhenomConfig {
  companyId: string;
  company: string;
  baseUrl: string;
}

export class PhenomHelper {
  private config: PhenomConfig;

  constructor(config: PhenomConfig) {
    this.config = config;
  }

  /**
   * Parse Phenom People HTML and extract job listings
   */
  parse(html: string): SearchResult[] {
    const jobs: SearchResult[] = [];

    try {
      // Pattern 1: Workday job URLs (GSK uses Workday jobs on Phenom portal)
      // https://gsk.wd5.myworkdayjobs.com/GSKCareers/job/...
      const workdayJobPattern = /(https?:\/\/[a-z0-9.]*\.myworkdayjobs\.com\/[^\s"<>]+)/gi;
      let match;
      while ((match = workdayJobPattern.exec(html)) !== null && jobs.length < 100) {
        const url = match[1];
        if (this.isValidJob('Job', url)) {
          // Extract job title from URL path
          const titleMatch = url.match(/\/([^/?]+)(?:[?/]|$)/);
          const title = titleMatch ? titleMatch[1].replace(/_\d+/, '').replace(/-/g, ' ') : 'Job Listing';
          this.addJob(jobs, title, url);
        }
      }

      // Pattern 2: Direct Phenom job links
      if (jobs.length < 50) {
        const phenomJobPattern = /<a[^>]*href="([^"]*\/jobs\/[^"]*)"[^>]*>([^<]{5,150})<\/a>/gi;
        while ((match = phenomJobPattern.exec(html)) !== null) {
          const url = match[1];
          const title = match[2].trim();

          if (this.isValidJob(title, url)) {
            this.addJob(jobs, title, url);
          }
        }
      }

      // Pattern 3: Generic job link matching
      if (jobs.length < 50) {
        const genericPattern = /<a[^>]*href="([^"]+)"[^>]*>([^<]{5,150})<\/a>/gi;
        while ((match = genericPattern.exec(html)) !== null && jobs.length < 100) {
          const url = match[1];
          const title = match[2].trim();

          if (this.isJobLink(url) && this.isValidJob(title, url)) {
            this.addJob(jobs, title, url);
          }
        }
      }
    } catch (error) {
      console.warn(`Error parsing Phenom (${this.config.companyId}): ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return jobs;
  }

  private isJobLink(url: string): boolean {
    return url.includes('/jobs/') || url.includes('/job/');
  }

  private isValidJob(title: string, href: string): boolean {
    return !!(
      title &&
      title.length > 2 &&
      href &&
      !href.includes('#') &&
      !title.toLowerCase().includes('menu') &&
      !title.toLowerCase().includes('home') &&
      !title.toLowerCase().includes('language')
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
        source: 'phenom',
      });
    }
  }
}
