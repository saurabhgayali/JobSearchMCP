/**
 * Amgen Job Extractor
 * 
 * Extracts job details from Amgen Workday career site
 * URL format: https://amgen.wd1.myworkdayjobs.com/job/.../...
 */

import { JobExtractor, ExtractionResult, JobExtraction } from './types.js';

export class AmgenExtractor implements JobExtractor {
  private readonly timeout = 30000;
  private readonly source = 'amgen';

  async extract(url: string): Promise<ExtractionResult> {
    try {
      // Validate URL
      if (!url.includes('amgen.wd') && !url.includes('myworkdayjobs.com')) {
        return {
          success: false,
          error: 'Invalid Amgen URL format',
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

      // Extract job details using regex patterns and DOM parsing
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
    // Look for job title in h1 or meta tags
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    if (h1Match) {
      return this.cleanText(h1Match[1]);
    }

    // Try OpenGraph title
    const ogMatch = html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i);
    if (ogMatch) {
      return this.cleanText(ogMatch[1]);
    }

    // Try page title
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch) {
      const title = this.cleanText(titleMatch[1]);
      // Extract job title from page title (often "Job Title | Company - Workday")
      const parts = title.split('|');
      return parts[0]?.trim() || '';
    }

    return '';
  }

  /**
   * Extract main job description/responsibilities
   */
  private extractJobDescription(html: string): string {
    // Look for job details section
    // Workday typically has structure: <div> with job description content
    const descMatch = html.match(
      /<section[^>]*role="region"[^>]*>[\s\S]*?<\/section>/i
    );

    if (descMatch) {
      let desc = descMatch[0];

      // Remove script tags
      desc = desc.replace(/<script[\s\S]*?<\/script>/gi, '');

      // Remove style tags
      desc = desc.replace(/<style[\s\S]*?<\/style>/gi, '');

      // Extract text content while preserving structure
      const textMatch = desc.match(
        /(?:<p|<div|<li)[^>]*>[\s\S]*?(?:<\/p>|<\/div>|<\/li>)/gi
      );

      if (textMatch) {
        return textMatch.join('\n').substring(0, 5000); // Limit to 5000 chars
      }

      // Fallback: extract all text
      const plainText = desc
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return plainText.substring(0, 5000);
    }

    return '';
  }

  /**
   * Extract eligibility/requirements/qualifications
   */
  private extractEligibility(html: string): string {
    // Look for requirements/qualifications section
    const patterns = [
      /(?:Required Qualifications|Requirements|Qualifications)[:\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/i,
      /(?:requirements?|qualifications?|skills?)[:\s]*<\/h[1-6]>[\s\S]*?(?=<h[1-6]|$)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        let text = match[0];

        // Remove HTML tags
        text = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

        return text.substring(0, 3000); // Limit to 3000 chars
      }
    }

    return '';
  }

  /**
   * Extract job expiry date
   */
  private extractExpiryDate(html: string): string {
    // Look for "Posted on" or "Closing date" or "Apply by"
    const patterns = [
      /(?:Closing Date|Apply By|Expires?)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:is the closing date|is the expir)/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        // Convert date format
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
      // Convert relative URLs to absolute
      if (href.startsWith('http')) {
        return href;
      } else if (href.startsWith('/')) {
        return `https://amgen.wd1.myworkdayjobs.com${href}`;
      }
    }

    // Fallback to default URL
    return defaultUrl;
  }

  /**
   * Clean text by removing extra whitespace and special characters
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
   * Convert various date formats to YYYY-MM-DD
   */
  private convertDateFormat(dateStr: string): string {
    // Handle MM/DD/YYYY format
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
