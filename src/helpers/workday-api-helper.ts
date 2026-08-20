/**
 * Workday API Helper
 *
 * Uses the native Workday API endpoint instead of HTML parsing
 * Pattern: https://[company].wd[N].myworkdayjobs.com/wday/cxs/[company]/[PortalName]/jobs
 */

import { SearchResult } from '../types.js';

export interface WorkdayAPIConfig {
  companyId: string;
  company: string;
  baseUrl: string;
  apiPath: string; // e.g., "pfizer/PfizerCareers" or "amgen/Careers"
}

export class WorkdayAPIHelper {
  private config: WorkdayAPIConfig;

  constructor(config: WorkdayAPIConfig) {
    this.config = config;
  }

  /**
   * Search jobs using Workday API
   * Supports pagination to retrieve ALL matching jobs
   */
  async search(searchText: string, limit: number = 100): Promise<SearchResult[]> {
    const jobs: SearchResult[] = [];
    let offset = 0;
    let hasMore = true;
    const pageSize = 20; // API max limit per page

    try {
      while (hasMore) {
        const apiUrl = `https://${this.config.companyId}.wd1.myworkdayjobs.com/wday/cxs/${this.config.apiPath}/jobs`;

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          },
          body: JSON.stringify({
            appliedFacets: {},
            limit: pageSize,
            offset,
            searchText,
          }),
        });

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json() as {
          total?: number;
          jobPostings?: Array<{
            title: string;
            externalPath: string;
            locationsText?: string;
            postedOn?: string;
          }>;
        };

        if (!data.jobPostings || data.jobPostings.length === 0) {
          hasMore = false;
          break;
        }

        // Convert API response to SearchResult format
        for (const job of data.jobPostings) {
          if (this.isValidJob(job.title, job.externalPath)) {
            this.addJob(jobs, job.title, job.externalPath, job.locationsText || 'Multiple');
          }

          // Stop if we've reached the limit
          if (jobs.length >= limit) {
            hasMore = false;
            break;
          }
        }

        // Stop if we got fewer results than pageSize (means we've reached the end)
        if (data.jobPostings.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }
    } catch (error) {
      console.warn(
        `Error searching Workday API (${this.config.companyId}): ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }

    return jobs;
  }

  private isValidJob(title: string, path: string): boolean {
    return !!(
      title &&
      title.length > 2 &&
      path &&
      !title.toLowerCase().includes('menu') &&
      !title.toLowerCase().includes('home')
    );
  }

  private addJob(
    jobs: SearchResult[],
    title: string,
    externalPath: string,
    location: string
  ): void {
    // Build full URL from external path
    let url = externalPath;
    if (!url.startsWith('http')) {
      url = `${this.config.baseUrl}${externalPath}`;
    }

    if (!jobs.some(j => j.url === url)) {
      jobs.push({
        title,
        url,
        company: this.config.company,
        location,
        source: 'workday-api',
      });
    }
  }
}
