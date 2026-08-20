# Rate Limiting Configuration

## Overview

The demo application implements **IP-based rate limiting** to protect backend resources and prevent abuse.

## Default Configuration

```
- Daily Limit: 5 searches per IP address
- Time Window: 24 hours (rolling)
- Tracked By: Client IP address
- Storage: In-memory (development) or Redis (production)
```

## Why Rate Limiting?

1. **Prevent Abuse:** Blocks excessive requests from single IP
2. **Protect Backend:** Prevents career site overload
3. **Fair Usage:** Ensures resources available for all users
4. **Cost Control:** Limits data transfer and processing costs

## Configuration

### Development (In-Memory)

Default rate limiting uses in-memory storage suitable for development.

**File:** `app/api/search-jobs/route.ts`

```typescript
// Rate limiter configuration
const RATE_LIMIT_WINDOW = 24 * 60 * 60 * 1000; // 24 hours
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 searches per day
const requestCounts: { [key: string]: { count: number; resetTime: number } } = {};
```

### Production (Redis)

For production deployment on Vercel or AWS, use Redis for distributed rate limiting.

**Installation:**
```bash
npm install redis
```

**Configuration:**
```typescript
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL,
});

// Get client IP
const clientIp = request.headers.get('x-forwarded-for') || 'unknown';

// Check rate limit
const key = `rate-limit:${clientIp}`;
const count = await redis.incr(key);

if (count === 1) {
  await redis.expire(key, 24 * 60 * 60); // 24 hour expiration
}

if (count > RATE_LIMIT_MAX_REQUESTS) {
  return NextResponse.json(
    { error: 'Rate limit exceeded. Max 5 searches per day.' },
    { status: 429 }
  );
}
```

### Environment Variables

```bash
# .env.local (development)
# No additional configuration needed for in-memory rate limiting

# .env.production (production)
REDIS_URL=redis://default:password@hostname:port
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_HOURS=24
```

## Adjusting Limits

### Increase Daily Limit

**File:** `app/api/search-jobs/route.ts`

```typescript
const RATE_LIMIT_MAX_REQUESTS = 20; // Changed from 5 to 20 searches per day
```

### Extend Time Window

```typescript
const RATE_LIMIT_WINDOW = 7 * 24 * 60 * 60 * 1000; // 7 days instead of 24 hours
```

### Disable Rate Limiting (Development Only)

```typescript
if (process.env.NODE_ENV === 'development' && process.env.DISABLE_RATE_LIMIT === 'true') {
  // Skip rate limiting checks
} else {
  // Apply rate limiting
}
```

## Error Handling

When rate limit is exceeded:

**HTTP Status:** 429 Too Many Requests

**Response:**
```json
{
  "error": "Rate limit exceeded. Max 5 searches per day per IP. Try again tomorrow."
}
```

## Monitoring

### View Rate Limit Status

Add endpoint to check remaining requests:

```typescript
// GET /api/rate-limit-status
export async function GET(request: NextRequest) {
  const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
  const key = `rate-limit:${clientIp}`;
  
  const count = requestCounts[key]?.count || 0;
  const remaining = Math.max(0, RATE_LIMIT_MAX_REQUESTS - count);
  
  return NextResponse.json({
    clientIp,
    requestsUsed: count,
    requestsRemaining: remaining,
    totalLimit: RATE_LIMIT_MAX_REQUESTS,
    windowHours: RATE_LIMIT_WINDOW / (60 * 60 * 1000),
  });
}
```

### Frontend Display

Update demo page to show rate limit status:

```tsx
// In app/demo/page.tsx
useEffect(() => {
  async function checkRateLimit() {
    const res = await fetch('/api/rate-limit-status');
    const data = await res.json();
    setRateLimitStatus(data);
  }
  checkRateLimit();
}, []);

return (
  <div className="text-sm text-gray-600 mt-2">
    Searches remaining today: {rateLimitStatus?.requestsRemaining || 5} / 5
  </div>
);
```

## Best Practices

### For Users
1. Plan searches efficiently
2. Use specific keywords to get better results
3. Save CSV reports for offline analysis
4. Request higher limits if you have legitimate use case

### For Administrators
1. Monitor rate limit violations for abuse patterns
2. Adjust limits based on actual usage patterns
3. Implement geographic rate limiting for high-abuse regions
4. Log all rate limit violations for security audit

## Vercel Deployment

**No additional configuration needed** - rate limiting works automatically in Vercel serverless functions.

```bash
# Deploy to Vercel
vercel deploy

# Rate limiting uses in-memory storage (limited to ~100 IPs per function)
# For high-traffic, add Redis as shown in Production section above
```

## AWS Deployment

For AWS Lambda + API Gateway:

```typescript
// Using AWS ElastiCache (Redis)
import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: process.env.ELASTICACHE_ENDPOINT,
    port: 6379,
  },
});
```

## Testing Rate Limits

```bash
# Test with curl (5 requests)
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/search-jobs \
    -H "Content-Type: application/json" \
    -d '{"query":"manager","companies":["amgen"]}' \
    -H "X-Forwarded-For: 192.168.1.1"
  echo ""
done

# 6th request should return 429 Too Many Requests
```

## Future Enhancements

1. **User-based limiting** - Different limits for authenticated users
2. **Dynamic limits** - Adjust based on system load
3. **Tiered access** - Premium users get higher limits
4. **Geolocation filtering** - Different limits by region
5. **Machine learning** - Detect abuse patterns automatically
