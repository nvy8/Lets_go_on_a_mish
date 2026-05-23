# Sleuth — Research with friction

A web app that teaches kids (9-14) research skills + AI literacy through 6 gated stages. Built for the 2026 hackathon.

## What it does

Teacher creates a Mission (topic + optional knowledge base) → gets a shareable link → drops it in Google Classroom. Kids open the link, type a display name (no email/login), and walk through:

1. **Query Design** — narrow a broad topic into a focused research question
2. **Search & Select** — pick the 3 most trustworthy from 10 results (5 web + 5 AI-generated)
3. **Investigate** — judge each of 10 sources Legit/Sus, compare to AI coach
4. **Triangulate** — split-screen reading. Click ✓ when you spot each fact in a source. AI semantically verifies the click.
5. **Explain** — write each fact in your own words. AI grades (Approaching/Meeting/Exceeding).
6. **Spot the Hallucination** — pick the accurate version from 4 (1 clean + 3 fakes with factual errors and AI-tell language)

Final output: PDF Research Brief with badges + facts + own-words explanations + citations. Kid uploads to Google Classroom.

## Architecture

- **Frontend**: Next.js 16 App Router + TypeScript + Tailwind v4
- **Backend**: Next.js API routes
- **Database**: MongoDB Atlas (`TEMP_HACKATHON` database — isolated from production)
- **Auth**: JWT + bcrypt (teacher only). Kids use session cookies via shareable links — no PII.
- **LLM**: Claude CLI via `child_process.spawn` (no API key needed, uses Claude Max OAuth). Single `runClaude()` helper at `lib/llm.ts`.
- **PDF**: Client-side `jsPDF`

## Running locally

```bash
cd /home/sebastian/HACKATHON_APP
npm install
# Edit .env.local using .env.local.example as template
npm run dev
# → http://localhost:3000
```

Required env vars:
- `MONGODB_URI` — pointed at any Atlas cluster (TEMP_HACKATHON DB auto-creates)
- `JWT_SECRET` — random 32+ char hex string (auto-generated during setup)
- `CLAUDE_BIN` — optional, defaults to `claude` (must be on PATH)

The `claude` CLI must be available on the host with valid Claude Code OAuth (Claude Max subscription works). The `runClaude()` wrapper passes `ANTHROPIC_API_KEY=""` to force OAuth fallback even if a stale API key env var is set.

## File layout

```
app/
  page.tsx                          landing
  teacher/login | dashboard | missions/[id]   teacher flows
  m/[shareToken]/                   kid flows
    page.tsx                        join + name picker
    stage/[n]/                      stages 1-6
    complete/                       final summary + PDF download
  api/
    teacher/{register,login,logout,me}
    missions[/id]
    m/[shareToken][/join]
    session/state
    stage/{1..6}/...
    export
components/
  StageShell.tsx
  stages/Stage1.tsx ... Stage6.tsx
lib/
  db.ts auth.ts llm.ts search.ts scrape.ts pdf.ts types.ts
  prompts/stage1.ts ... stage6.ts
  fortified_churches_fallback.ts    demo dataset
```

## What's hardcoded for the hackathon

- **Stage 2 web results** for the fortified-churches topic are hardcoded in `lib/search.ts`. Other topics fall back to LLM-generated results. Plug in real Google Custom Search post-hackathon.
- **Stage 3 preview fallback texts** for fortified-churches URLs (UNESCO, Britannica, Smithsonian) live in `lib/fortified_churches_fallback.ts` because Cloudflare blocks our scraper. Without these the demo has too-thin material for Stage 4 fact extraction.

## Demo path

1. Open `/teacher/login` → register
2. Create a mission with topic = "Why did Transylvanian churches need defensive walls?"
3. Copy the share link → open in incognito/new browser
4. Type a kid name → walk through all 6 stages
5. Click "Download Research Brief (PDF)" on the complete page

Each stage uses real Claude Sonnet calls (5-15 seconds per stage). Stage 4's verify-click runs in optimistic UI mode — checkmark appears immediately, AI verifies in the background.

## Out of scope (do NOT build without explicit ask)

- Teacher dashboard with class progress
- Multi-language
- Real-time collaboration
- Native iPad app
- Auto-grading (illegal under EU AI Act)
- Voice/audio coach (kept silent for in-class use)
- Payments

## Deployment notes

Vercel will NOT work out of the box because the `claude` CLI isn't installable in their serverless runtime. To demo remotely, run `npm run dev` on a host with the Claude CLI installed and expose via ngrok:

```bash
ngrok http 3000
```

For the hackathon demo, local + ngrok is the path. Long-term, swap `runClaude()` for direct Anthropic SDK with a real API key.
