/**
 * Bayer Job Extractor
 * 
 * Extracts job details from Bayer Eightfold AI career site
 * URL format: https://talent.bayer.com/careers/job/...
 */

import { JobExtractor, ExtractionResult, JobExtraction } from './types.js';

export class BayerExtractor implements JobExtractor {
  private readonly timeout = 30000;
  private readonly source = 'bayer';

  async extract(url: string): Promise<ExtractionResult> {
    try {
      // Validate URL
      if (!url.includes('talent.bayer.com') && !url.includes('/careers/job/')) {
        return {
          success: false,
          error: 'Invalid Bayer URL format',
        };
      }

      // Fetch the job posting page
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        const errorCode = response.status === 404 ? 'NOT_FOUND' : 'HTTP_ERROR';
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
          errorCode,
          httpStatus: response.status,
          url,
        };
      }

      const html = await response.text();

      // Extract job details
      const extraction: JobExtraction = {
        url,
        jobTitle: this.extractJobTitle(html),
        jobDescription: this.extractJobDescription(html),
        eligibility: this.extractEligibility(html),
        expiryDate: this.extractExpiryDate(html),
        applyLink: this.extractApplyLink(html, url),
        extractedAt: new Date().toISOString(),
        source: this.source,
      };

      return {
        success: true,
        data: extraction,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      let errorCode = 'UNKNOWN';
      if (errorMsg.includes('timeout') || errorMsg.includes('aborted')) {
        errorCode = 'TIMEOUT';
      } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
        errorCode = 'NETWORK_ERROR';
      }
      return {
        success: false,
        error: errorMsg,
        errorCode,
        url,
      };
    }
  }

  getSource(): string {
    return this.source;
  }

  /**
   * Extract job title from HTML
   */
  private extractJobTitle(html: string): string {
    // Eightfold typically has job title in h1 or specific element
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return this.cleanText(h1Match[1]);
    }

    // Try data attribute or class
    const dataMatch = html.match(
      /<[^>]*(?:class|data-test)="[^"]*title[^"]*"[^>]*>([^<]+)<\/[^>]*>/i
    );
    if (dataMatch) {
      return this.cleanText(dataMatch[1]);
    }

    // Fallback to page title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = this.cleanText(titleMatch[1]);
      const parts = title.split('|');
      return parts[0]?.trim() || '';
    }

    return '';
  }

  /**
   * Extract main job description
   */
  private extractJobDescription(html: string): string {
    // Look for job description in main content area
    const patterns = [
      /<main[^>]*>[\s\S]*?<\/main>/i,
      /<article[^>]*>[\s\S]*?<\/article>/i,
      /<div[^>]*class="[^"]*job[^"]*description[^"]*"[^>]*>[\s\S]*?<\/div>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let desc = match[0];

        // Remove navigation, headers, footers
        desc = desc.replace(
          /<(?:nav|header|footer|script|style|form)[^>]*>[\s\S]*?<\/(?:nav|header|footer|script|style|form)>/gi,
          ''
        );

        // Remove ads and promotional content
        desc = desc.replace(
          /<div[^>]*class="[^"]*(?:ad|promo|banner)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ''
        );

        // Extract main content text
        const plainText = desc
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return plainText.substring(0, 5000);
      }
    }

    return '';
  }

  /**
   * Extract eligibility/requirements
   */
  private extractEligibility(html: string): string {
    // Look for requirements/qualifications section
    const patterns = [
      /(?:Qualifications|Requirements|What we're looking for)[:\s]*(?:<\/h[1-6]>)?[\s\S]*?(?=<h[1-6]|<\/section>|$)/i,
      /<ul[^>]*>[\s\S]*?<\/ul>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let text = match[0];

        // Convert list items
        text = text
          .replace(/<li[^>]*>/g, '• ')
          .replace(/<\/li>/g, '\n')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        if (text.length > 50) {
          return text.substring(0, 3000);
        }
      }
    }

    return '';
  }

  /**
   * Extract job expiry date
   */
  private extractExpiryDate(html: string): string {
    const patterns = [
      /(?:Posted|Closes?|Expires?)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        if (match[3]) {
          // Already in YYYY-MM-DD format
          return `${match[1]}-${match[2]?.padStart(2, '0')}-${match[3]?.padStart(2, '0')}`;
        } else if (match[1]) {
          // MM/DD/YYYY format
          return this.convertDateFormat(match[1]);
        }
      }
    }

    return '';
  }

  /**
   * Extract apply link
   */
  private extractApplyLink(html: string, defaultUrl: string): string {
    // Look for apply button
    const patterns = [
      /<a[^>]*href="([^"]*(?:apply|join|submit)[^"]*)"/i,
      /<button[^>]*onclick="[^"]*(?:apply|submit)[^"]*"[^>]*>[\s\S]*?<\/button>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const href = match[1];
        if (href.startsWith('http')) {
          return href;
        }
      }
    }

    return defaultUrl;
  }

  /**
   * Clean text
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  /**
   * Convert date format
   */
  private convertDateFormat(dateStr: string): string {
    const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const month = match[1].padStart(2, '0');
      const day = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }

    return '';
  }
}
