# AI vs App: Clarification

## TL;DR

- **Demo App (Vercel):** Pure web application, NO AI needed ✅
- **MCP Server:** Designed for integration with AI assistants (optional, future) 🤖
- **Development Notes:** Keep in /ai folder (gitignored, not in final app) 📝

---

## Architecture Overview

Job Search MCP has TWO distinct interfaces:

### 1. Standalone Demo App (Primary - v0.1)

**File:** `app/demo/page.tsx` (served at root via `app/page.tsx` redirect) → Deploy to Vercel

**What it is:**
- Traditional React/Next.js web application
- Users manually search for jobs
- No AI, no ML, no LLMs required
- Pure client-server architecture

**Tech Stack:**
- Frontend: React + TypeScript + Tailwind CSS
- Backend: Next.js API routes + Node.js
- Database: None (stateless)
- AI/ML: Not used

**Deployment:**
```bash
vercel deploy
# Results in: https://your-app.vercel.app/
# (Root URL redirects to /demo automatically)
```

**Users:**
- Job seekers browsing for positions
- HR professionals doing research
- Regular internet users

---

### 2. MCP Server (Optional - Future)

**File:** `src/server.ts` → Use with AI assistants

**What it is:**
- Model Context Protocol server
- Allows Claude, ChatGPT, etc. to search jobs
- User asks AI: "Find me Manager jobs at Pfizer"
- AI uses MCP to execute search without coding

**Typical Conversation:**
```
User: "Find me manager jobs at top pharma companies"
Claude: (uses MCP search tool)
Claude: "I found 15 manager positions across Pfizer, Novartis, and Amgen..."
```

**Tech Stack:**
- MCP SDK (Model Context Protocol)
- Designed for Claude integration
- Serves as a "plugin" for AI assistants

**Deployment:**
```bash
# Typically installed in Claude desktop app or web interface
npm start
```

**Users:**
- AI enthusiasts
- Developers building AI workflows
- Advanced job search scenarios

---

## What Goes Into v0.1 Release

✅ **Included:**
- Demo web app at `/app/demo`
- REST API at `/api/search-jobs`
- Job extractors in `/src/extractors`
- Configuration in `/src/config.json`
- Comprehensive docs in `/docs`
- Tests in `/test`

❌ **NOT Included:**
- MCP server code (stays optional)
- AI/ML models
- LLM integrations
- Development notes (in /ai, gitignored)

---

## Folder Structure Clarification

### Root Level
```
JobSearchMCP/
├── app/              ← Demo web app (DEPLOYED)
│   ├── page.tsx      ← Root path (/) → redirects to /demo
│   ├── demo/page.tsx ← Demo UI at /demo
│   └── api/          ← API endpoints
├── src/              ← Core logic (DEPLOYED)
├── docs/             ← User documentation (DEPLOYED)
├── test/             ← Test suite (NOT deployed)
├── ai/               ← Dev notes (gitignored, NOT deployed)
└── .gitignore        ← Excludes /ai folder
```

### Routing Overview

| URL | Serves | File |
|-----|--------|------|
| `/` | Redirect to /demo | `app/page.tsx` |
| `/demo` | Job search interface | `app/demo/page.tsx` |
| `/api/search-jobs` | Job search API | `app/api/search-jobs/route.ts` |

### What Gets Deployed

**Vercel receives:**
```
app/
src/
docs/
package.json
tsconfig.json
README.md
```

**Files excluded from deployment:**
```
ai/                  (gitignored)
test/                (not referenced)
BUILD.md             (optional reference)
UPDATE.md            (optional reference)
```

---

## Comparison: App vs MCP

| Feature | Demo App | MCP Server |
|---------|----------|-----------|
| Purpose | Website for job search | AI assistant integration |
| UI | Web browser | AI chat interface |
| Deployment | Vercel | Desktop/Web app |
| Users | General public | AI users |
| AI Requirement | No | Optional |
| v0.1 Priority | PRIMARY | Secondary |

---

## Should You Discuss AI in Final App?

**NO.** ❌

**Reasons:**
1. Demo app is standalone web application
2. Users don't interact with AI
3. No LLM or ML components
4. MCP is optional future feature
5. /ai folder is development only

**What to mention:**
- ✅ "Job search engine"
- ✅ "Career site aggregator"
- ✅ "5 company jobs, fast extraction"
- ❌ "AI-powered" (misleading)
- ❌ "Machine learning" (not used)

---

## Removing AI References

To clean up for v0.1 release:

### 1. Update README.md

**Change from:**
```
"An AI-powered job search using Model Context Protocol"
```

**Change to:**
```
"A configuration-driven job search engine across 5 career websites"
```

### 2. Update Landing Page Description

**In app/demo/page.tsx:**
```tsx
<p className="text-gray-600">
  Search for jobs across Amgen, Bayer, GSK, Novartis, and Pfizer careers sites
  {/* Removed: "powered by AI" */}
</p>
```

### 3. Keep AI Notes in /ai (Gitignored)

Do NOT reference AI in:
- app/demo/page.tsx
- app/api/search-jobs/route.ts
- docs/ files
- README.md

**Only mention MCP/AI in:**
- /ai/UPDATE.md (development notes)
- /ai/AI.md (discovery notes)

### 4. .gitignore Verification

Ensure /ai is excluded:
```
ai/
.env.local
dist/
node_modules/
.next/
```

---

## Future: If You Want to Add AI

**Only if you explicitly want it:**

1. Create separate `mcp-server.ts` entry point
2. Document in separate "MCP Integration" guide
3. Optional npm flag: `npm run dev:mcp`
4. Keep demo app completely separate

**But for v0.1:** Not needed. Ship web app first. 🚀

---

## Final Recommendation

**Remove all AI references from v0.1:**

1. Update README description
2. Update demo page copy
3. Keep /ai folder gitignored
4. Focus on job search quality
5. Deploy clean, simple web app

**Messaging:**
> "Fast, reliable job search across 5 major pharma companies. Extract job titles, descriptions, and requirements in seconds."

No AI needed. No AI mentioned. Clean, professional, focused. ✅

---

## Version Roadmap

**v0.1** (current): Web app only
- Demo page at /demo
- REST API at /api
- 5 companies, 0 AI

**v0.2** (future): Scale companies
- 250+ companies
- Same web app, more coverage

**v0.3** (future): MCP optional
- Add optional MCP server
- Integrate with Claude (optional)
- Document as separate feature

**This keeps things clean and focused.**
