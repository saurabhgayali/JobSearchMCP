/**
 * Job Extractor Types
 * 
 * Defines the interface and types for extracting detailed job information
 * from individual job posting URLs
 */

/**
 * Extracted job details from a job posting URL
 */
export interface JobExtraction {
  // URL of the job posting
  url: string;

  // Job title (e.g., "Senior Manager, Product Development")
  jobTitle: string;

  // Main job description/responsibilities (HTML markup allowed)
  jobDescription: string;

  // Eligibility/requirements/qualifications (HTML markup allowed)
  eligibility: string;

  // Job expiry date (format: YYYY-MM-DD or empty if not available)
  expiryDate: string;

  // Direct link to apply (may differ from job URL)
  applyLink: string;

  // Additional metadata
  extractedAt: string; // ISO timestamp
  source: string; // 'amgen' | 'pfizer' | 'bayer' | 'gsk' | 'novartis'
}

/**
 * Result of extraction attempt
 */
export interface ExtractionResult {
  success: boolean;
  data?: JobExtraction;
  error?: string;
  errorCode?: string; // 'NOT_FOUND' | 'TIMEOUT' | 'NETWORK_ERROR' | 'PARSE_ERROR' | 'UNKNOWN'
  httpStatus?: number; // HTTP status code (404, 403, 500, etc.)
  url?: string; // The URL that was attempted
}

/**
 * Job Extractor interface - implemented by each site-specific extractor
 */
export interface JobExtractor {
  /**
   * Extract job details from a job posting URL
   * @param url - The job posting URL
   * @returns Extraction result with job details or error
   */
  extract(url: string): Promise<ExtractionResult>;

  /**
   * Get the source company identifier
   */
  getSource(): string;
}
