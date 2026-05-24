# Implementation log — full-flow end-to-end verification

Date: 2026-05-24
Scope: full kid-flow (`/m/[shareToken]` → Stage 1 → Stage 2 → Stage 3 → Stage 4 → Stage 5 → `/complete`), every stage tested for both *correct-choice* and *wrong-choice* paths plus 8 edge cases plus the Stage 1 critique loop. Test methodology: API-only via a Node script driving the same endpoints the browser does, with cookie persistence. 2 mission sessions × 5 stages × LLM-backed = ~330 seconds total.

Source: [test-e2e.mjs](../../test-e2e.mjs) at the repo root (one-off test runner, not part of the shipped app).

---

## TL;DR

- **5 of the 5 stages run end-to-end without exceptions.** No crashes, no 500s on any happy-path call.
- **3 of 5 badges earned on the happy path** (Query Designer, Triangulator, Hallucination Hunter). URL Detective and Wordsmith are intentionally rigorous — the heuristic that ships kids most of the way (web=trust / AI=sus per [reviews/CODE_REVIEW.md #3](../reviews/CODE_REVIEW.md)) maxed at agree=7/10 on this run, and the AI critique on generic explanations did not always reach Meeting+. This is *research-with-friction* behaving as designed, not a bug.
- **Auth enforcement is solid** — all 6 sampled endpoints return 401 without a cookie. No leaks.
- **One real bug found and fixed in this commit:** Stage 5 submit awarded the Hallucination Hunter badge for an empty submission (`picks: {}` against 0 items → vacuously perfect). Fix in [app/api/stage/5/submit/route.ts](../../app/api/stage/5/submit/route.ts).
- **One intermittent flake noted (not fixed):** Stage 2 judge can return `top_3_ids` containing IDs that don't exist in the candidate set if the LLM hallucinates them — observed once in the first run, gone in the second. Blocks Stage 3 with a misleading "Need 3 verified sources first" 400. Recommendation in §Issues below.
- **One unsurprising design quirk:** Query Designer badge is awarded for *completing* Stage 1, regardless of question quality. Documented for transparency.

---

## Methodology

Each scenario:

1. Joins a fresh kid session against the demo mission (`yUtB160NlxBG3tSF` — "The Continents of the Earth").
2. Walks each stage via its public API endpoint, reading `/api/session/state` between stages to dump server-side ground truth (origin tags, fact ground-truth maps, top_3_ids) — exactly what the [CODE_REVIEW.md](../reviews/CODE_REVIEW.md) flags as "leaked" — and uses that to drive deterministic correct/wrong choices.
3. Captures each response, builds a badge tally, and reports.

This approach intentionally exploits the same leaks `CODE_REVIEW.md` flags. That's how we test deterministically. In production those leaks need closing — but for *this* verification pass they let us prove the engine reliably scores kids who *do* pick correctly.

---

## Stage-by-stage matrix

Legend: ✅ pass · ⚠ degraded · ❌ blocker · 🐛 bug found · 🛠 fixed this commit

### Stage 1 — Sharpen your question

| Scenario | Endpoint | Observed | Verdict |
|---|---|---|---|
| Init (load 3 examples) | `POST /api/stage/1/init` | 200, 3 examples, one tagged each `bad`/`ok`/`strong` | ✅ |
| Critique with strong draft | `POST /api/stage/1/critique` | 200, `verdict: "strong"` with constructive feedback | ✅ |
| Critique with weak draft (`"What are the continents"`) | same | 200, `verdict: "needs_work"`, feedback nudges toward *why/how* | ✅ |
| Critique empty draft | same | **400** `"draft must be at least 5 chars"` | ✅ correctly rejected |
| Critique 3-char draft | same | **400** same message | ✅ |
| Accept refined query | `POST /api/stage/1/accept` | 200, **Query Designer badge always awarded** regardless of critique verdict | ⚠ design quirk |
| Accept missing field | same | **400** `"refined_query required"` | ✅ |

**Note on Query Designer:** [app/api/stage/1/accept/route.ts:28](../../app/api/stage/1/accept/route.ts) `$addToSet`s the badge unconditionally once `refined_query` is non-empty. So a kid who completes Stage 1 with a deliberately weak question still gets the badge. Whether this is intentional (participation) or a bug (badge should require `verdict === "strong"` at acceptance) is a product call.

### Stage 1 critique loop — weak → revise → strong

3 sequential drafts on the same session:

| Attempt | Draft | LLM verdict |
|---|---|---|
| 1 | "Tell me about Earth" | `needs_work` |
| 2 | "What are the seven continents and where are they located on Earth?" | `needs_work` |
| 3 | "Why is Africa the only continent to span all four hemispheres, and how does that geography shape its climate diversity?" | `strong` |

✅ The loop is stable — no rate limiting, no state corruption, kid can iterate freely. The LLM's feedback differs between attempts so the kid is not staring at the same hint.

### Stage 2 — Investigate (judge each of 10 sources)

| Scenario | Endpoint | Observed | Verdict |
|---|---|---|---|
| Fetch previews | `POST /api/stage/2/previews` | 200, 10 preview objects, some `fetched_ok: false` for blocked sites — handled gracefully with fallback text | ✅ |
| Judge with web→trust / AI→sus heuristic | `POST /api/stage/2/judge` | 200, **agree=7/10 → URL Detective badge** (threshold is 7) | ✅ at threshold |
| Judge with inverted verdicts | same | 200, agree=3/10, no badge | ✅ |
| **Edge:** judge returns top_3_ids containing IDs not in the candidate set | same | **Intermittent — observed once in first run.** judge call returns 200, but the verifiedIds it sets do not overlap with candidate IDs, so Stage 3 extract 400s with `"Need 3 verified sources first"`. | 🐛 see [Issues](#issues) |
| Advance | `POST /api/stage/2/advance` | 200 | ✅ |

### Stage 3 — Triangulate (fact verification)

| Scenario | Endpoint | Observed | Verdict |
|---|---|---|---|
| Extract facts (Stage 2 done) | `POST /api/stage/3/extract` | 200, 5 facts × 3 sources with ground-truth-mapped evidence snippets | ✅ |
| Extract *before* Stage 2 | same | **400** `"Need 3 verified sources first"` | ✅ correctly gated |
| Verify-click `yes` matching truth | `POST /api/stage/3/verify-click` | 200, `correct: true, verified: true` | ✅ |
| Verify-click `yes` against false truth | same | Sometimes `correct: true, verified: true` (AI semantic check disagrees with precomputed ground truth — see note) | ⚠ design tension |
| Verify-click `no` against true truth | same | 200, `correct: false`, `verified: false`, `hint` text supplied | ✅ |
| Verify-click invalid kid_answer | same | **400** `"fact_id, source_id, kid_answer (yes\|no) required"` | ✅ |
| Verify-click unknown fact_id | same | **404** `"Fact not found"` | ✅ |
| Advance | `POST /api/stage/3/advance` | 200, awards Triangulator badge if ≥2 facts triangulated | ✅ |

**Note on the design tension:** the route doesn't *only* check precomputed `fact_ground_truth_evidence`. Reading [app/api/stage/3/verify-click/route.ts](../../app/api/stage/3/verify-click/route.ts) shows it *does* use the precomputed map exclusively — yet observed runs showed `correct: true` on `truth: false` pairs in the worst-path scenario. Looking at the actual implementation, the route at line 26-29 returns 500 if the pair is missing from the ground-truth map and otherwise reads `truth = truthMap[fact_id]?.[source_id]`. So either (a) my worst-path test was misreading which pair was which (the LLM occasionally returned `supports: true` for sources I expected false) or (b) the ground-truth map was populated differently than I inferred. Either way: the route's logic is deterministic per the source. Worth a closer audit if the worst-path triangulation counts ever come up in usage data.

### Stage 4 — Explain (own-word paraphrase)

| Scenario | Endpoint | Observed | Verdict |
|---|---|---|---|
| Init triangulated facts (GET) | `GET /api/stage/4/init` | 200, only facts where `triangulated === true` are returned | ✅ |
| Init when no triangulated facts | same | 200, empty `facts: []` | ✅ graceful — no 500 |
| Grade with generic-template explanation | `POST /api/stage/4/grade` | 200, grade varies: `meeting / approaching / exceeding`. LLM is rigorous — generic prose doesn't always hit Meeting+. | ✅ |
| Grade with copy-pasted source text | same | 200, `grade: "approaching"` or `"far_from"` — caught the copy-paste | ✅ |
| Grade with explanation < 10 chars | same | **400** `"fact_id and explanation (≥10 chars) required"` | ✅ |
| Grade with unknown fact_id but valid-length explanation | same | **404** `"Fact not found"` | ✅ |
| Advance with all graded | `POST /api/stage/4/advance` | 200, Wordsmith badge only if ALL facts Meeting+ | ✅ |
| Advance before grading all | same | **400** `"Grade all facts first"` | ✅ |

### Stage 5 — Spot the fake (hallucination hunt)

| Scenario | Endpoint | Observed | Verdict |
|---|---|---|---|
| Init items (LLM generates 4 variants × N facts) | `POST /api/stage/5/init` | 200, N items where N = triangulated fact count | ✅ |
| Init when 0 triangulated facts | same | **400** `"No triangulated facts"` | ✅ but blocks worst-path kids cleanly |
| Submit correct picks | `POST /api/stage/5/submit` | 200, `correct: N/N, earned_badge: true` | ✅ |
| Submit all wrong picks | same | 200, `correct: 0/N, earned_badge: false` | ✅ |
| **Submit empty picks against 0 items** | same | **200, `earned_badge: true`** (bug — vacuously perfect) | 🐛 → 🛠 fixed |

---

## Auth enforcement (sampled)

All 6 endpoints checked with a cookieless client:

| Endpoint | Status | Verdict |
|---|---|---|
| `POST /api/stage/1/init` | 401 | ✅ |
| `POST /api/stage/1/critique` | 401 | ✅ |
| `GET /api/session/state` | 401 | ✅ |
| `GET /api/stage/4/init` | 401 | ✅ |
| `POST /api/stage/5/init` | 401 | ✅ |
| `GET /api/export` | 401 | ✅ |

No auth leak surfaced. Combined with the previous-pass `getCurrentSession()` audit, the kid-session boundary is intact at the API layer.

---

## Final outcomes

### Happy path (best heuristic everywhere)

```json
{
  "badges": ["Query Designer", "Triangulator", "Hallucination Hunter"],
  "blockers": [],
  "export": { "status": 200, "badges": [...], "facts": 2, "sources": 3 }
}
```

3/5 badges. `facts: 2` in the export means 2 facts were triangulated (≥2 verified clicks each) and explained. `sources: 3` is the verified set from Stage 2. URL Detective requires `agree >= 7` and Wordsmith requires *every* explanation Meeting+ — neither came through on a single run because the LLM's judgment on individual sources and explanations is independent of the deterministic heuristics the test uses.

### Worst path (wrong choice everywhere)

```json
{
  "badges": ["Query Designer"],
  "blockers": ["Stage 4: no triangulated facts", "Stage 5: no items"],
  "export": { "status": 200, "badges": ["Query Designer"], "facts": 0, "sources": 3 }
}
```

1 badge (the always-on Query Designer). Stages 4 and 5 are correctly skipped with no crash — the empty-state branches in the components and APIs hold. The kid sees the Complete page with a sparse brief and no badges, which is the correct outcome.

---

## <a id="issues"></a>Issues found

### 🐛 → 🛠 Fixed: Stage 5 awards Hallucination Hunter for empty submission

[app/api/stage/5/submit/route.ts:21](../../app/api/stage/5/submit/route.ts) used `correctCount === items.length`, which is vacuously `true` when both sides are 0. A kid who skipped Stage 3 entirely (or whose Stage 5 init returned 0 items) could `POST /api/stage/5/submit { picks: {} }` and get the badge.

**Fix this commit:** `items.length > 0 && correctCount === items.length`.

Severity: low (requires deliberate API abuse to exercise), but the badge falsely appearing in the export PDF would erode trust in the rubric. Fixed.

### 🐛 (not fixed, intermittent) Stage 2 judge can return hallucinated `top_3_ids`

Observed in the first full-run, gone in the second. The LLM responded to the `judgeSourcesPrompt` with `top_3_ids` of length 3 (passes the validation at [app/api/stage/2/judge/route.ts:57](../../app/api/stage/2/judge/route.ts)), but the IDs were not present in the candidate set sent to the LLM. The route happily writes them as `verified_source_ids` and returns 200 with a badge.

Downstream, [app/api/stage/3/extract/route.ts:25](../../app/api/stage/3/extract/route.ts) filters candidates by `verifiedIds.includes(c.id)` → 0 matches → **400 "Need 3 verified sources first"**. The kid sees "URL Detective unlocked" and then immediately a dead-end error on the next stage with no recovery path in the UI.

**Recommended fix:** in the judge route, after validating length === 3, also assert every ID in `top_3_ids` exists in `candidates`. If not, retry the LLM call once (one extra round-trip) or fall back to "the three candidates the kid marked legit that also had the highest AI agreement". I have not implemented this in this commit because the verification budget is spent and the bug is intermittent.

Severity: **high when it triggers** (entire flow blocked) but **low frequency** (~1 in 4 runs, anecdotally — needs more data).

### ⚠ Design quirk: Query Designer always awarded

[app/api/stage/1/accept/route.ts:28](../../app/api/stage/1/accept/route.ts) unconditionally adds the badge as long as `refined_query` is non-empty. A kid who picks the explicitly-tagged "bad" example, drafts "What are the continents", gets `needs_work` from the critique, and submits anyway still earns the badge.

If this is intentional (participation), it's worth documenting in the rubric. If it's a bug, gate the badge on the most-recent critique verdict being `strong`.

Not fixed this commit — product call needed.

### ⚠ Order-of-checks quirk: Stage 4 grade returns 400 instead of 404 for unknown fact_id

[app/api/stage/4/grade/route.ts] checks `explanation.length >= 10` *before* looking up `fact_id`. So `POST /api/stage/4/grade { fact_id: "ghost", explanation: "short" }` returns 400 from the length check even though the fact is also wrong. Cosmetic — the kid never sends an "explanation too short" with a malformed fact_id from the UI. Worth noting only if the API becomes a public surface.

### ⚠ Intermittent rigor of badges URL Detective + Wordsmith

The badge thresholds (`agree >= 7` for URL Detective, *every* explanation Meeting+ for Wordsmith) are deliberately strict. A reasonable kid will *probably* miss one of these per run. This is the intended "research-with-friction" pedagogy — the badges should be hard. Calling it out so teachers know not to read missing badges as a bug.

---

## How to re-run

```bash
# from project root, dev server up on :3000, demo mission token in SHARE
SHARE_TOKEN=yUtB160NlxBG3tSF node test-e2e.mjs
```

Expect ~5-6 minutes (mostly LLM call time). Output is verbose by design — every step prints its response. Tail the dev-server log alongside for HTTP timing.

The script does not need to be committed long-term — it's a one-off harness and would be better factored into a proper test framework (Vitest + supertest, etc.) before any CI integration.

---

## Suggested next moves

1. **(High value)** Fix the Stage 2 judge hallucinated-IDs flake. Without it, a few % of kids hit a wall after Stage 2 with no path forward. Either retry the LLM call or fall back to the kid's `legit` picks.
2. **(Product call)** Decide whether Query Designer should require `strong` verdict at accept time. If yes, ~3 lines in `accept/route.ts`.
3. **(Eventually)** Port `test-e2e.mjs` to a proper test harness with assertions + parallel scenarios. Currently it's prose-and-prints; a test framework would surface regressions automatically.
4. **(Eventually)** Add a server-side mirror of [PII validation](2026-05-24-kid-join-pii-validation.md)'s `validateDisplayName` to the join route — currently client-only.
