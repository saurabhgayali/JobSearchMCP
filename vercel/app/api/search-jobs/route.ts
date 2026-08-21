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

    // Demo response - in production, this would call the MCP server
    // The API depends on root MCP server which isn't available in serverless context
    const jobs: SearchResponse['jobs'] = [
      {
        sno: 1,
        company: companies[0] || 'example',
        jobTitle: `${query} - Senior Role`,
        description: 'This is a demo job listing. To use real job data, run the MCP server locally and connect to it.',
        url: 'https://jobsearch-mcp.vercel.app/demo',
        expiryDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        applyLink: 'https://jobsearch-mcp.vercel.app/demo',
      }
    ];
    
    const errors: SearchResponse['errors'] = [];

    return NextResponse.json({ jobs, errors });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
