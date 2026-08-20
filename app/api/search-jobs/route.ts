import { SearchExecutor } from '@/src/search-executor';
import { ExtractorRegistry } from '@/src/extractors/index';
import { NextRequest, NextResponse } from 'next/server';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 searches per day per IP
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

const SEARCH_URLS: { [key: string]: string } = {
  amgen: 'https://amgen.wd1.myworkdayjobs.com/Careers?q={query}',
  bayer: 'https://bayer.eightfold.ai/careers?query={query}',
  gsk: 'https://jobs.gsk.com/gb/en/search-results?keywords={query}',
  novartis: 'https://www.novartis.com/careers/career-search?search_api_fulltext={query}',
  pfizer: 'https://pfizer.wd1.myworkdayjobs.com/en-US/PfizerCareers?q={query}',
};

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

    const searchExecutor = new SearchExecutor();
    const extractorRegistry = new ExtractorRegistry();

    const jobs: SearchResponse['jobs'] = [];
    const errors: SearchResponse['errors'] = [];
    let jobCounter = 1;
    let errorCounter = 1;

    // Search each company
    for (const company of companies) {
      if (!SEARCH_URLS[company]) continue;

      const searchUrl = SEARCH_URLS[company].replace('{query}', encodeURIComponent(query));

      try {
        const searchResult = await searchExecutor.search(company, searchUrl);

        if (!searchResult.success || !searchResult.results) continue;

        // Extract details from first 5 results
        const extractor = extractorRegistry.getExtractor(company);
        if (!extractor) continue;

        for (let i = 0; i < Math.min(5, searchResult.results.length); i++) {
          const jobUrl = searchResult.results[i].url;

          try {
            const extractionResult = await extractor.extract(jobUrl);

            if (extractionResult.success && extractionResult.data) {
              jobs.push({
                sno: jobCounter++,
                company,
                jobTitle: extractionResult.data.jobTitle,
                description: extractionResult.data.jobDescription.substring(0, 200),
                url: jobUrl,
                expiryDate: extractionResult.data.expiryDate,
                applyLink: extractionResult.data.applyLink,
              });
            } else {
              errors.push({
                sno: errorCounter++,
                company,
                url: jobUrl,
                errorCode: extractionResult.errorCode || 'UNKNOWN',
                httpStatus: String(extractionResult.httpStatus || 'N/A'),
                errorMessage: extractionResult.error || 'Unknown error',
                attemptedAt: new Date().toISOString(),
              });
            }
          } catch (error) {
            errors.push({
              sno: errorCounter++,
              company,
              url: jobUrl,
              errorCode: 'EXCEPTION',
              httpStatus: 'N/A',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              attemptedAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error(`Search error for ${company}:`, error);
      }
    }

    return NextResponse.json({ jobs, errors });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
