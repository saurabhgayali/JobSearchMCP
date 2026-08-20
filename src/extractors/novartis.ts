/**
 * Novartis Job Extractor
 * 
 * Extracts job details from Novartis Drupal career site
 * URL format: https://www.novartis.com/careers/career-search/job/details/req-...-...
 */

import { JobExtractor, ExtractionResult, JobExtraction } from './types.js';

export class NovartisExtractor implements JobExtractor {
  private readonly timeout = 30000;
  private readonly source = 'novartis';

  async extract(url: string): Promise<ExtractionResult> {
    try {
      // Validate URL
      if (!url.includes('novartis.com') && !url.includes('/career-search/job/details/')) {
        return {
          success: false,
          error: 'Invalid Novartis URL format',
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
    // Novartis Drupal sites have job title in h1
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return this.cleanText(h1Match[1]);
    }

    // Try data attributes
    const dataMatch = html.match(
      /<div[^>]*data-test="job-title"[^>]*>([^<]+)<\/div>/i
    );
    if (dataMatch) {
      return this.cleanText(dataMatch[1]);
    }

    // Fallback to page title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      return this.cleanText(titleMatch[1]).split('|')[0]?.trim() || '';
    }

    return '';
  }

  /**
   * Extract main job description
   */
  private extractJobDescription(html: string): string {
    // Look for main job content
    const patterns = [
      /<main[^>]*>[\s\S]*?<\/main>/i,
      /<article[^>]*>[\s\S]*?<\/article>/i,
      /<div[^>]*class="[^"]*job[^"]*content[^"]*"[^>]*>[\s\S]*?<\/div>/i,
      /<div[^>]*id="[^"]*content[^"]*"[^>]*>[\s\S]*?<\/div>/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let desc = match[0];

        // Remove navigation, headers, footers
        desc = desc.replace(
          /<(?:nav|header|footer|aside|script|style)[^>]*>[\s\S]*?<\/(?:nav|header|footer|aside|script|style)>/gi,
          ''
        );

        // Remove common UI elements
        desc = desc.replace(
          /<div[^>]*class="[^"]*(?:sidebar|menu|navigation|ads)[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
          ''
        );

        // Extract text
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
    // Look for requirements sections
    const patterns = [
      /(?:Requirements|Qualifications|What we're looking for|Desired Skills)[:\s]*(?:<\/h[1-6]>)?[\s\S]*?(?=<h[1-6]|<\/section>|<\/article>|$)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let text = match[0];

        // Convert list items to bullet points
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
      /(?:Application Deadline|Closing Date|Posted Until)[:\s]*([A-Za-z]+\s+\d{1,2},?\s+\d{4})/i,
      /(?:Application Deadline|Closing Date)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{4})-(\d{1,2})-(\d{1,2})\s*(?:at midnight|UTC|GMT)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        if (match[3]) {
          // Already in YYYY-MM-DD
          return `${match[1]}-${match[2]?.padStart(2, '0')}-${match[3]?.padStart(2, '0')}`;
        } else if (match[1]) {
          // Try to parse various formats
          const dateStr = match[1];
          const parsed = this.parseDate(dateStr);
          if (parsed) {
            return parsed;
          }
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
      /<a[^>]*href="([^"]*(?:apply|submit|join)[^"]*)"/i,
      /<a[^>]*data-test="apply-button"[^>]*href="([^"]*)"/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const href = match[1];
        if (href.startsWith('http')) {
          return href;
        } else if (href.startsWith('/')) {
          return `https://www.novartis.com${href}`;
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
   * Parse various date formats
   */
  private parseDate(dateStr: string): string {
    // Try MM/DD/YYYY
    let match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (match) {
      const month = match[1].padStart(2, '0');
      const day = match[2].padStart(2, '0');
      const year = match[3];
      return `${year}-${month}-${day}`;
    }

    // Try "Month DD, YYYY"
    match = dateStr.match(
      /(\w+)\s+(\d{1,2}),?\s+(\d{4})/
    );
    if (match) {
      const months: { [key: string]: string } = {
        january: '01',
        february: '02',
        march: '03',
        april: '04',
        may: '05',
        june: '06',
        july: '07',
        august: '08',
        september: '09',
        october: '10',
        november: '11',
        december: '12',
      };
      const month = months[match[1].toLowerCase()];
      if (month) {
        const day = match[2].padStart(2, '0');
        const year = match[3];
        return `${year}-${month}-${day}`;
      }
    }

    return '';
  }
}
