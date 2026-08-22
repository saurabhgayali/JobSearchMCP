import { NextRequest, NextResponse } from 'next/server';
import { SearchExecutor } from '@/dist/src/search-executor.js';
import { ConfigLoader } from '@/dist/src/config-loader.js';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 searches per day per IP
const requestCounts: { [key: string]: { count: number; resetTime: number } } = {};

interface SearchRequest {
  query: string;
  companies: string[];
}

interface SearchResponse {
  jobs: Array<{
    sno: number;
    company: string;
    jobTitle: string;
    description: string;
    url: string;
    expiryDate: string;
    applyLink: string;
  }>;
  errors: Array<{
    sno: number;
    company: string;
    url: string;
    errorCode: string;
    httpStatus: string;
    errorMessage: string;
    attemptedAt: string;
  }>;
}

export async function POST(request: NextRequest): Promise<NextResponse<SearchResponse | { error: string }>> {
  try {
    // Rate limiting: Get client IP
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limit
    const now = Date.now();
    const userRateLimit = requestCounts[clientIp];

    if (userRateLimit && now < userRateLimit.resetTime) {
      // Within current window
      if (userRateLimit.count >= RATE_LIMIT_MAX_REQUESTS) {
        const minutesLeft = Math.ceil((userRateLimit.resetTime - now) / 60000);
        return NextResponse.json(
          {
            error: `Rate limit exceeded. Maximum ${RATE_LIMIT_MAX_REQUESTS} searches per 24 hours per IP. Try again in ${minutesLeft} minutes.`,
          },
          { status: 429 }
        );
      }
      userRateLimit.count++;
    } else {
      // New window or expired
      requestCounts[clientIp] = {
        count: 1,
        resetTime: now + RATE_LIMIT_WINDOW,
      };
    }

    const body: SearchRequest = await request.json();
    const { query, companies } = body;

    if (!query || !companies || companies.length === 0) {
      return NextResponse.json({ error: 'Invalid request parameters' }, { status: 400 });
    }

    // Execute searches for selected companies
    const jobs: SearchResponse['jobs'] = [];
    const errors: SearchResponse['errors'] = [];
    const executor = new SearchExecutor(60000); // Increased timeout to 60 seconds
    
    // Pass sites path - works both locally and on Vercel
    const sitesPath = process.env.NODE_ENV === 'production' ? './sites' : '../sites';
    const configLoader = new ConfigLoader(sitesPath);
    let jobCounter = 1;
    let errorCounter = 1;

    for (const companyId of companies) {
      const companyConfig = configLoader.getCompanyInfo(companyId);
      if (!companyConfig) {
        errors.push({
          sno: errorCounter++,
          company: companyId,
          url: 'N/A',
          errorCode: 'CONFIG_NOT_FOUND',
          httpStatus: '404',
          errorMessage: `No configuration found for company: ${companyId}`,
          attemptedAt: new Date().toISOString(),
        });
        continue;
      }

      try {
        // Build search URL using the company's search_url template with {keyword} placeholder
        const searchUrl = companyConfig.search_url.replace('{keyword}', encodeURIComponent(query));
        console.log(`[${companyId}] Searching: ${searchUrl}`);
        const response = await executor.search(companyId, searchUrl);
        console.log(`[${companyId}] Response:`, response);

        if (response.success && response.results && response.results.length > 0) {
          console.log(`[${companyId}] Found ${response.results.length} results`);
          // Add successful results to jobs array
          for (const result of response.results) {
            jobs.push({
              sno: jobCounter++,
              company: companyId,
              jobTitle: result.title || 'N/A',
              description: result.description || 'N/A',
              url: result.url || companyConfig.career_url,
              expiryDate: result.posted_date || new Date().toISOString().split('T')[0],
              applyLink: result.url || companyConfig.career_url,
            });
          }
        } else if (!response.success) {
          console.log(`[${companyId}] Search failed:`, response.error);
          // Add error entry
          errors.push({
            sno: errorCounter++,
            company: companyId,
            url: response.url || companyConfig.career_url,
            errorCode: 'SEARCH_FAILED',
            httpStatus: '500',
            errorMessage: response.error || 'Search failed',
            attemptedAt: new Date().toISOString(),
          });
        } else {
          console.log(`[${companyId}] No results returned`);
          // No results but no error either
          errors.push({
            sno: errorCounter++,
            company: companyId,
            url: companyConfig.career_url,
            errorCode: 'NO_RESULTS',
            httpStatus: '200',
            errorMessage: 'Search completed but returned no jobs',
            attemptedAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error(`[${companyId}] Exception:`, error);
        errors.push({
          sno: errorCounter++,
          company: companyId,
          url: companyConfig.career_url,
          errorCode: 'EXCEPTION',
          httpStatus: '500',
          errorMessage: error instanceof Error ? error.message : 'Unknown error during search',
          attemptedAt: new Date().toISOString(),
        });
      }
    }

    console.log(`Total jobs found: ${jobs.length}, Total errors: ${errors.length}`);
    
    // Summary by company
    const companySummary = companies.map(c => {
      const count = jobs.filter(j => j.company === c).length;
      const errorCount = errors.filter(e => e.company === c).length;
      return `${c}: ${count} jobs, ${errorCount} errors`;
    }).join(' | ');
    console.log(`Summary: ${companySummary}`);
    
    return NextResponse.json({ 
      jobs, 
      errors,
      summary: { totalJobs: jobs.length, totalErrors: errors.length, companySummary }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
