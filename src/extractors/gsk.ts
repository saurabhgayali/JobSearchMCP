/**
 * GSK Job Extractor
 * 
 * Extracts job details from GSK Workday career site
 * URL format: https://gsk.wd5.myworkdayjobs.com/GSKCareers/job/.../apply
 */

import { JobExtractor, ExtractionResult, JobExtraction } from './types.js';

export class GSKExtractor implements JobExtractor {
  private readonly timeout = 30000;
  private readonly source = 'gsk';

  async extract(url: string): Promise<ExtractionResult> {
    try {
      // Validate URL
      if (!url.includes('gsk.wd') && !url.includes('myworkdayjobs.com')) {
        return {
          success: false,
          error: 'Invalid GSK URL format',
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
    // Look for h1 tag
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return this.cleanText(h1Match[1]);
    }

    // Try page title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = this.cleanText(titleMatch[1]);
      // Extract job title (usually first part before separators)
      const parts = title.split('|');
      return parts[0]?.trim() || '';
    }

    return '';
  }

  /**
   * Extract main job description
   */
  private extractJobDescription(html: string): string {
    // GSK Workday job description is in specific sections
    const patterns = [
      /<section[^>]*>[\s\S]*?(?:Job Summary|About the role)[^<]*[\s\S]*?<\/section>/i,
      /<div[^>]*class="[^"]*(?:description|details)[^"]*"[^>]*>[\s\S]*?<\/div>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let desc = match[0];

        // Remove scripts and styles
        desc = desc.replace(/<script[\s\S]*?<\/script>/gi, '');
        desc = desc.replace(/<style[\s\S]*?<\/style>/gi, '');

        // Extract text content
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
   * Extract eligibility/requirements/qualifications
   */
  private extractEligibility(html: string): string {
    // Look for requirements or qualifications sections
    const patterns = [
      /(?:Required Qualifications|Qualifications|Requirements|What you need)[:\s]*(?:<\/h[1-6]>)?[\s\S]{0,50}?(?:<ul>|<ol>)?[\s\S]*?(?=<h[1-6]|<\/section>|$)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let text = match[0];

        // Keep list structure
        text = text
          .replace(/<li[^>]*>/g, '• ')
          .replace(/<\/li>/g, '\n')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        return text.substring(0, 3000);
      }
    }

    return '';
  }

  /**
   * Extract job expiry date
   */
  private extractExpiryDate(html: string): string {
    const patterns = [
      /(?:Closing Date|Apply By|Expires?)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:is the closing|application closes)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return this.convertDateFormat(match[1]);
      }
    }

    return '';
  }

  /**
   * Extract apply link
   */
  private extractApplyLink(html: string, defaultUrl: string): string {
    // Look for apply button
    const applyMatch = html.match(
      /<a[^>]*href="([^"]*(?:apply|submit|join)[^"]*)"/i
    );

    if (applyMatch && applyMatch[1]) {
      const href = applyMatch[1];
      if (href.startsWith('http')) {
        return href;
      } else if (href.startsWith('/')) {
        return `https://gsk.wd5.myworkdayjobs.com${href}`;
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
   * Convert date format MM/DD/YYYY to YYYY-MM-DD
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
