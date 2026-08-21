/**
 * Job Extractors Index
 * 
 * Central registry for all job extractors
 */

import { JobExtractor } from './types.js';
import { AmgenExtractor } from './amgen.js';
import { BayerExtractor } from './bayer.js';
import { GSKExtractor } from './gsk.js';
import { NovartisExtractor } from './novartis.js';
import { PfizerExtractor } from './pfizer.js';

/**
 * Registry of all available job extractors
 */
export class ExtractorRegistry {
  private extractors: Map<string, JobExtractor> = new Map();

  constructor() {
    // Register all extractors
    this.extractors.set('amgen', new AmgenExtractor());
    this.extractors.set('bayer', new BayerExtractor());
    this.extractors.set('gsk', new GSKExtractor());
    this.extractors.set('novartis', new NovartisExtractor());
    this.extractors.set('pfizer', new PfizerExtractor());
  }

  /**
   * Get extractor by company ID
   */
  getExtractor(companyId: string): JobExtractor | null {
    return this.extractors.get(companyId.toLowerCase()) || null;
  }

  /**
   * Get all available company IDs
   */
  getAvailableCompanies(): string[] {
    return Array.from(this.extractors.keys()).sort();
  }

  /**
   * Check if extractor exists for company
   */
  hasExtractor(companyId: string): boolean {
    return this.extractors.has(companyId.toLowerCase());
  }
}

// Export all extractors
export { AmgenExtractor } from './amgen.js';
export { BayerExtractor } from './bayer.js';
export { GSKExtractor } from './gsk.js';
export { NovartisExtractor } from './novartis.js';
export { PfizerExtractor } from './pfizer.js';
export type { JobExtractor, JobExtraction, ExtractionResult } from './types.js';
