# Deployment Guide

Complete instructions for deploying Job Search MCP to Vercel and AWS.

## Quick Deploy to Vercel

Vercel is the **recommended deployment option** for this project. It's serverless, free tier available, and optimized for Next.js.

### 1. Prerequisites

- GitHub account (recommended for auto-deployment)
- Vercel account (free at https://vercel.com)
- Optional: Custom domain

### 2. Deploy via GitHub (Recommended)

**Option A: Using Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project directory
vercel

# Follow prompts to link to GitHub repo
# Vercel will automatically deploy on each push
```

**Option B: Using Vercel Web Dashboard**

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repository
4. Click "Import"
5. Vercel auto-detects Next.js configuration
6. Click "Deploy"

### 3. Post-Deployment Configuration

**Environment Variables:**

Set in Vercel Dashboard → Settings → Environment Variables

```
# Add these if using Redis for rate limiting
REDIS_URL=your_redis_url_here
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_HOURS=24
```

**Deployment URL:**

After deployment, your app is live at:
```
https://[project-name].vercel.app
```

**Demo Page URL (via redirect):**
```
https://[project-name].vercel.app/
# Automatically redirects to /demo internally
```

**Direct demo access (if you prefer):**
```
https://[project-name].vercel.app/demo
```

**API Endpoint:**
```
https://[project-name].vercel.app/api/search-jobs
```

### 4. File Structure for Vercel

Vercel auto-detects:
- ✅ `package.json` - Dependencies
- ✅ `tsconfig.json` - TypeScript config
- ✅ `next.config.js` (if present) - Next.js config
- ✅ `app/` directory - App router pages and API routes

**Key files for deployment:**
- `app/demo/page.tsx` - Demo web page
- `app/api/search-jobs/route.ts` - API endpoint
- `src/` - Extraction pipeline (compiled to JavaScript)

### 5. Monitoring on Vercel

- **Analytics:** Vercel Dashboard → Analytics
- **Logs:** Vercel Dashboard → Functions → Logs
- **Status:** https://status.vercel.com

### Vercel Cost Estimate

**Free Tier:**
- 100GB bandwidth/month
- 12x 512MB function executions
- 100 Serverless Function invocations

**Usage for Job Search:**
- ~5MB per search (HTML parsing)
- Typical: 10-50 searches/day = well within free limits
- **Estimated cost:** $0 (free tier sufficient)

---

## Deploy to AWS

Alternative option using AWS Lambda + API Gateway + S3.

### 1. Prerequisites

- AWS account with free tier access
- AWS CLI installed: `pip install awscli`
- Configured AWS credentials: `aws configure`

### 2. AWS Architecture

```
User
  ↓
CloudFront CDN
  ↓
API Gateway
  ↓
Lambda Functions (Serverless)
  ├── /api/search-jobs
  └── /demo (Static serving)
  ↓
ElastiCache (Rate limiting)
  ↓
IAM Role (Permissions)
```

### 3. Deployment Steps

#### Step A: Prepare Build

```bash
# Build TypeScript
npm run build

# Create Lambda-compatible package
zip -r lambda-deployment.zip \
  dist/ \
  package.json \
  node_modules/
```

#### Step B: Create IAM Role

```bash
# Create role for Lambda
aws iam create-role \
  --role-name job-search-lambda-role \
  --assume-role-policy-document file://trust-policy.json
```

**trust-policy.json:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

#### Step C: Deploy Lambda Function

```bash
# Create Lambda function
aws lambda create-function \
  --function-name job-search-mcp \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/job-search-lambda-role \
  --handler dist/server.handler \
  --zip-file fileb://lambda-deployment.zip \
  --timeout 30 \
  --memory-size 512 \
  --environment Variables="{RATE_LIMIT_MAX_REQUESTS=5,REDIS_URL=redis://...}"
```

#### Step D: Create API Gateway

```bash
# Create REST API
aws apigateway create-rest-api \
  --name job-search-api \
  --description "Job Search MCP API"

# Note: Returns API_ID, use it in next steps
```

#### Step E: Connect Lambda to API Gateway

Use AWS Console for easier configuration:

1. Go to API Gateway → APIs → job-search-api
2. Click "Resources"
3. Click "Create Resource"
4. Set path to `/api/search-jobs`
5. Click "Create Method" → POST
6. Select "Lambda Function"
7. Enter function name: `job-search-mcp`
8. Click "Deploy API" → New Stage → prod

#### Step F: Configure Rate Limiting with ElastiCache

```bash
# Create ElastiCache cluster (Redis)
aws elasticache create-cache-cluster \
  --cache-cluster-id job-search-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --port 6379

# Get endpoint (use in Lambda environment variables)
aws elasticache describe-cache-clusters \
  --cache-cluster-id job-search-redis \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint'
```

#### Step G: Deploy Demo Page

Use CloudFront + S3 for static hosting:

```bash
# Create S3 bucket
aws s3 mb s3://job-search-mcp-demo

# Build Next.js (generates optimized output in .next/)
npm run build

# For AWS with S3 + CloudFront:
# Upload the entire .next/ build output
aws s3 sync .next s3://job-search-mcp-demo/

# Create CloudFront distribution pointing to S3 bucket
# Use AWS Console for easier configuration
```

### 4. AWS Cost Estimate

**Monthly costs (typical usage):**
- Lambda: ~$0.20 (1M requests × $0.0000002)
- API Gateway: ~$3.50 (1M requests × $3.50/million)
- ElastiCache: $15/month (t3.micro instance)
- S3: <$1/month (demo page storage)
- CloudFront: ~$0.50 (low traffic)

**Total:** ~$20/month (can be reduced to <$5 with lower rate limits)

### 5. Monitoring AWS Deployment

```bash
# View Lambda logs
aws logs tail /aws/lambda/job-search-mcp --follow

# Monitor API Gateway metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApiGateway \
  --metric-name Count \
  --start-time 2024-08-20T00:00:00Z \
  --end-time 2024-08-21T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

---

## Comparison: Vercel vs AWS

| Feature | Vercel | AWS |
|---------|--------|-----|
| **Setup Time** | 5 minutes | 30+ minutes |
| **Cost** | Free (generous) | ~$20/month |
| **Scaling** | Automatic | Manual/Auto-scaling |
| **Learning Curve** | Easy | Moderate-Hard |
| **Best For** | Small-Medium projects | Enterprise-scale |
| **Developer Experience** | Excellent | Good |

**Recommendation:** Use **Vercel** for v0.1-v0.2. Switch to AWS only when you exceed Vercel free tier limits.

---

## Custom Domain

### Vercel Custom Domain

1. Go to Vercel Dashboard → Project → Domains
2. Enter your domain
3. Add DNS records shown in dashboard
4. Wait for DNS propagation (5-30 minutes)

```
# Example DNS records to add
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A (if root domain)
Value: 76.76.19.5
```

### AWS Custom Domain

1. Register domain in Route 53 or external registrar
2. Create CloudFront distribution pointing to API Gateway
3. Add SSL certificate in AWS Certificate Manager
4. Update Route 53 records

---

## Environment Variables

### Critical Variables

```bash
# All environments
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api

# Rate limiting (optional, has defaults)
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_HOURS=24

# Redis (only if using external rate limiting)
REDIS_URL=redis://user:password@hostname:port
```

### Setting Variables

**Vercel:**
1. Dashboard → Project → Settings → Environment Variables
2. Add variables for different environments (development, preview, production)

**AWS Lambda:**
```bash
aws lambda update-function-configuration \
  --function-name job-search-mcp \
  --environment Variables="{KEY=value,KEY2=value2}"
```

---

## Troubleshooting

### Vercel

**Problem:** Deployment fails
```
Solution: Check build logs in Vercel Dashboard → Deployments → Logs
```

**Problem:** API returns 502 Bad Gateway
```
Solution: Check Lambda execution in AWS or Vercel Functions logs
```

**Problem:** Rate limiting not working
```
Solution: Ensure Redis URL set in environment variables
```

### AWS

**Problem:** Lambda timeout errors
```
Increase timeout in Lambda settings (default 3s, set to 30s)
```

**Problem:** CORS errors from browser
```
Add CORS headers in API Gateway → Settings → CORS
```

**Problem:** High costs
```
Reduce RATE_LIMIT_MAX_REQUESTS
Use API Gateway caching
Set Lambda memory to 256MB (from 512MB)
```

---

## Scaling for Future Growth

### v0.2 (250+ companies)

**Caching Strategy:**
- Cache search results for 24 hours
- Reduce backend load by 80-90%
- Use Redis: `SET cache:{company}:{query} results EX 86400`

**Database:**
- Add PostgreSQL for tracking user searches
- Store extraction results for reuse

**Performance:**
- Split search and extraction into separate Lambda functions
- Use job queues (SQS) for large jobs

### v0.3 (Production Scale)

**Optimizations:**
- CDN caching for demo page
- Implement lazy-loading for results tables
- Add pagination (show 20 results at a time)
- Use DynamoDB for rate limiting (distributed)

**Features:**
- User accounts and search history
- Saved searches and job alerts
- Public API with API keys
- Advanced filtering and sorting

---

## Next Steps

1. Choose deployment platform (Vercel recommended)
2. Follow platform-specific setup steps
3. Test demo page at deployment URL
4. Monitor logs for errors
5. Share public URL with users
6. Read [RATE_LIMITING.md](RATE_LIMITING.md) for production safety

For questions or issues, check deployment platform documentation:
- **Vercel:** https://vercel.com/docs
- **AWS:** https://docs.aws.amazon.com/lambda/
