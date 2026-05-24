# Implementation log — Stage 1 copy aligned to research base

Date: 2026-05-24
Scope: 2 text surfaces visible in the Stage 1 loading screenshot (the stage title and the loading copy). All other Stage 1 text is unchanged this pass.
Source of guidance: newly-extracted [docs/design/SCIENTIFIC_FOUNDATIONS.md](../design/SCIENTIFIC_FOUNDATIONS.md) — specifically §10's application map, plus §1.4 (growth mindset), §2.1 (SIFT-Stop), §5.2 (Mayer signaling + personalization), and §7 (anti-pattern: no fake urgency).
Status: shipped to working tree, not committed. Dev server up at http://localhost:3000.

---

## What changed

### `components/StageShell.tsx` — Stage 1 title in the page header

```diff
- "Query Design",
+ "Sharpen your question",
```

### `components/stages/Stage1.tsx` — loading-state copy

```diff
- <div className="mt-4 text-lg text-zinc-700">Your coach is writing some examples…</div>
- <div className="mt-1 text-sm text-zinc-500">(takes about 5 seconds)</div>
+ <div className="mt-4 text-lg text-zinc-700">
+   Your coach is drafting 3 questions for you to compare.
+ </div>
+ <div className="mt-1 text-sm text-zinc-500">
+   Take a breath — researchers always pause before they search.
+ </div>
```

Nothing else on the screen changed. The progress bar, the topic line, the kid illustration, the display name + mission title block, the layout — all untouched.

---

## Before / after — what the kid actually sees

### Before (from the user-supplied screenshot)

| Position | Text | Issue |
|---|---|---|
| Header H1 | "Query Design" | Jargon noun phrase. A 9-14-year-old reads "query" as either a Google query or a generic system label. Neither cues the *cognitive move* being asked. The phrase is also passive — it names a feature, not an action. |
| Loading line 1 | "Your coach is writing some examples…" | Generic. "Examples" doesn't hint at what the kid is about to do with them. The kid will land in a screen asking them to *judge*, but the priming copy treats them as a passive recipient. |
| Loading line 2 | "(takes about 5 seconds)" | Apologetic. Frames the LLM call as friction to tolerate. Honest but missing — silently teaches the kid that thinking time is "wasted" time. |

### After

| Position | Text | What the copy now does |
|---|---|---|
| Header H1 | "Sharpen your question" | Verb-led. Names the action the kid will take and the metaphor that runs through the stage. "Sharpen" is concrete (a kid knows what sharpening a pencil feels like) and tied to the brand (a sleuth sharpens evidence). |
| Loading line 1 | "Your coach is drafting 3 questions for you to compare." | The kid now knows *exactly* what's coming and *what their job will be* — comparison and judgment, not consumption. Cues the upcoming task before they see it. |
| Loading line 2 | "Take a breath — researchers always pause before they search." | Reframes the wait as part of the practice. The pause is no longer a delay — it's the *first move* of real research. Plants the SIFT-Stop principle at the exact moment the kid is sitting still. |

---

## Why this is *better* — argument from research

Each change earns its place from a specific finding in [SCIENTIFIC_FOUNDATIONS.md](../design/SCIENTIFIC_FOUNDATIONS.md). The mapping:

### 1. "Sharpen your question" replaces "Query Design"

- **Growth mindset (§1.4, Dweck).** Process verbs over noun labels. A kid reading "Query Design" sees a feature name; a kid reading "Sharpen your question" sees a thing *they* will do. Process praise produces persistence on hard tasks; the same logic applies to action prompts.
- **Mayer personalization (§5.2).** "Sharpen your question" is implicitly second-person ("your"). The original was zero-person. Personalization improves learning outcomes when the content is challenging — and Stage 1 is the first hard cognitive ask of the mission.
- **Cognitive load (§5.1).** "Query Design" makes the kid translate jargon before they engage. "Sharpen" lands without translation. Working-memory savings spent on the actual task instead.
- **Detective narrative (§3.3).** Sharpening = the same lexical family as "the sleuth's tool" — keeps the stage title coherent with the brand without leaning on a mascot.

### 2. "Your coach is drafting 3 questions for you to compare." replaces "Your coach is writing some examples…"

- **Mayer signaling (§5.2).** The single most-effective intervention for novice learners on a multi-step task: *tell them what's coming and what they'll need to do*. The original "examples" is content-neutral; the new copy specifies (a) the count (3), (b) the kid's role (compare), and (c) the timing (about to land). All three reduce on-arrival confusion.
- **Cowan's 4-chunk working memory (§5.1).** Knowing in advance there are *3* items lets the kid pre-allocate attention — they won't be surprised by the count when the buttons appear and won't lose memory budget orienting.
- **SDT competence (§4.1).** "For you to compare" frames the kid as the judge, not the audience. Competence cues — even small ones — drive intrinsic motivation.

### 3. "Take a breath — researchers always pause before they search." replaces "(takes about 5 seconds)"

- **SIFT — the "Stop" move (§2.1).** Caulfield's first SIFT step is literally *Stop* — before evaluating credibility, *pause*. This loading state is the perfect moment to plant that principle, because the kid is *already paused*. The screen now teaches what the wait is *for*.
- **Anti-pattern refusal (§7).** Apologetic "takes about 5 seconds" is the well-meaning cousin of the fake countdown — it positions time-on-task as friction. The replacement positions it as practice. Same honesty (the LLM call is still ~5 seconds; we just stopped apologizing for it).
- **Growth mindset (§1.4).** "Researchers always pause" is process language about a *strategy real people use*. A kid who hears that internalizes "I am someone who pauses", not "I am someone who waits".
- **Mayer personalization (§5.2).** "Take a breath" is a direct instruction in second-person register, conversational without being patronizing. Tested register for the 9-14 band per §5.3 (no "let's all sit on the rug").

---

## Verification

- **Source-of-truth check.** New strings are present in [components/StageShell.tsx:6](../../components/StageShell.tsx) and [components/stages/Stage1.tsx:69-74](../../components/stages/Stage1.tsx); old strings ("Query Design", "Your coach is writing some examples…", "takes about 5 seconds") no longer appear in any kid-flow source file (verified by grep across the repo, excluding `node_modules/` and docs).
- **Dev-server compile.** Both files compiled cleanly (`✓ Compiled in 191ms`, `✓ Compiled in 167ms`). `GET /m/yUtB160NlxBG3tSF/stage/1 → 200 in 287ms` against the demo mission "The Continents of the Earth".
- **Visual verification — blocked again.** Same problem as the [2026-05-24 iconography pass](2026-05-24-iconography-pass.md): the Playwright MCP browser returns `net::ERR_BLOCKED_BY_CLIENT` for every URL including `https://example.com`. The bundled Chrome client in this MCP environment refuses navigation. Manual verification needed — the user's open Stage 1 tab can be hard-refreshed to see the change.
- **Reference for the "before" state.** The user-supplied screenshot of the loading state (`Main-Detective` viewing "The Continents of the Earth") is the authoritative before — it shows the exact three text surfaces this commit replaces.

---

## What this does NOT change

Per the task scope ("doar textul din imaginea atașată"), only the 2 text surfaces visible in the screenshot were touched. The following adjacent items are flagged in [SCIENTIFIC_FOUNDATIONS.md §10](../design/SCIENTIFIC_FOUNDATIONS.md) as candidates for the next pass:

- **Stage 1 pick-phase H2** ("🤔 Which question is best?") — already research-aligned; minor polish only.
- **Stage 1 critique copy** ("Coach says: awesome!" / "Coach says: almost there") — currently borderline trait praise. Should become process-specific ("Coach says: that question will find a real answer" / "Coach says: try adding *why* or *how*").
- **Stage 2-5 titles** ("Investigate", "Triangulate", "Explain", "Spot Hallucinations") — already verb-led, but worth a consistency audit against the same rubric in a future pass.
- **All other emoji used in copy** — the iconography pass (Phosphor) and the §6.1 emoji/icon split rule apply, but propagation is out of scope this commit.

---

## Suggested next moves

1. **Visually verify** in your open Stage 1 tab — hard-refresh, confirm the header reads "Sharpen your question", the topic line is unchanged, and the loading state shows the two new lines.
2. **Commit this pass** as a single commit (`Re-write Stage 1 title + loading copy per research base`) once visual is approved.
3. **Pick the next surface** from [SCIENTIFIC_FOUNDATIONS.md §10](../design/SCIENTIFIC_FOUNDATIONS.md). Highest-leverage candidates: the Stage 1 critique copy (process-praise rewrite), then Stage 2 lateral-reading affordance.
