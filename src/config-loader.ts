/**
 * Configuration Loader for Job Search MCP
 *
 * Dynamically loads site configurations from the sites/ directory.
 * Provides no company-specific logic - purely configuration-driven.
 */

import * as fs from 'fs';
import * as path from 'path';
import { CompanyConfig, SearchParameter } from './types.js';

export class ConfigLoader {
  private sites: Map<string, CompanyConfig> = new Map();
  private sitesDir: string;

  constructor(sitesDir: string = 'sites') {
    this.sitesDir = sitesDir;
    this.loadAllSites();
  }

  /**
   * Load all site configurations from the sites directory
   */
  private loadAllSites(): void {
    if (!fs.existsSync(this.sitesDir)) {
      throw new Error(`Sites directory not found: ${this.sitesDir}`);
    }

    const files = fs.readdirSync(this.sitesDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(this.sitesDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const config: CompanyConfig = JSON.parse(content);
          const companyId = file.replace('.json', '');
          this.sites.set(companyId, config);
        } catch (error) {
          console.warn(`Failed to load ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
  }

  /**
   * Get list of all supported company identifiers
   */
  getAllCompanies(): string[] {
    return Array.from(this.sites.keys()).sort();
  }

  /**
   * Get configuration for a specific company
   */
  getCompanyInfo(companyId: string): CompanyConfig | undefined {
    return this.sites.get(companyId);
  }

  /**
   * Get search parameters for a specific company
   */
  getSearchParams(companyId: string): SearchParameter[] | undefined {
    const config = this.sites.get(companyId);
    return config ? config.params : undefined;
  }

  /**
   * Get the search URL template for a specific company
   */
  getSearchUrl(companyId: string): string | undefined {
    const config = this.sites.get(companyId);
    return config ? config.search_url : undefined;
  }

  /**
   * Build a complete search URL with keyword and filters
   */
  buildSearchUrl(
    companyId: string,
    keyword: string,
    filters?: Record<string, string>
  ): string | undefined {
    const config = this.sites.get(companyId);
    if (!config) {
      return undefined;
    }

    let searchUrl = config.search_url.replace('{keyword}', encodeURIComponent(keyword));

    // Add filters to the URL
    if (filters && Object.keys(filters).length > 0) {
      const paramNames = new Set(config.params.map((p) => p.name));
      const filterParts: string[] = [];

      for (const [key, value] of Object.entries(filters)) {
        if (paramNames.has(key) && value) {
          filterParts.push(`${key}=${encodeURIComponent(value)}`);
        }
      }

      if (filterParts.length > 0) {
        const separator = searchUrl.includes('?') ? '&' : '?';
        searchUrl += separator + filterParts.join('&');
      }
    }

    return searchUrl;
  }

  /**
   * Find company configuration by display name
   */
  getCompanyByName(name: string): CompanyConfig | undefined {
    for (const config of this.sites.values()) {
      if (config.name.toLowerCase() === name.toLowerCase()) {
        return config;
      }
    }
    return undefined;
  }

  /**
   * Get total number of loaded companies
   */
  getTotalCompanies(): number {
    return this.sites.size;
  }
}
