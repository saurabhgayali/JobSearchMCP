/**
 * Type definitions for Job Search MCP
 */

export interface SearchParameter {
  name: string;
  label: string;
  type: 'text' | 'select' | 'multiselect';
  required: boolean;
  values: string[];
  placeholder?: string;
}

export interface CompanyConfig {
  name: string;
  career_url: string;
  search_url: string;
  params: SearchParameter[];
}

export interface SearchResult {
  title: string;
  url: string;
  company: string;
  location?: string;
  posted_date?: string;
  description?: string;
  employment_type?: string;
  source?: string;
}

export interface SearchResponse {
  success: boolean;
  company: string;
  url: string;
  results: SearchResult[];
  count: number;
  error?: string;
}

export interface CompanyInfo {
  id: string;
  name: string;
  career_url: string;
  params_count: number;
}

export interface ListCompaniesResponse {
  total_companies: number;
  companies: CompanyInfo[];
}

export interface GetCompanyInfoResponse {
  company_id: string;
  name: string;
  career_url: string;
  search_url: string;
  parameters: SearchParameter[];
}

export interface GetSearchParamsResponse {
  company_id: string;
  parameters: SearchParameter[];
}
