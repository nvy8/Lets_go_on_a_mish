# Implementation log — teacher mission analytics ("Your class" section)

Date: 2026-05-24
Scope: new analytics surface on `/teacher/missions/[id]`. Teacher sees who joined, how far each kid got, how long they spent, what badges they earned, and can drill into a per-student detail view. Hand-drawn styled to match the rest of the app.

---

## What shipped

### 1. `GET /api/missions/[id]/students` — server endpoint

[app/api/missions/[id]/students/route.ts](../../app/api/missions/%5Bid%5D/students/route.ts) (new).

- **Auth + ownership:** `getCurrentTeacher()` and `mission.teacher_id === teacher._id`. A teacher can only read sessions for missions they own — verified at the Mongo query layer, not via post-filtering.
- **Per-student row** derived from the session document: `display_name`, `current_stage`, `completed` (Stage 5 + all hallucinations answered), `badges`, `refined_query`, per-stage scores (sources legit'd / facts triangulated / explanations Meeting+ / hallucinations spotted), `time_on_task_ms` (`last_active_at − created_at`), `is_active_now` (last active within 2 minutes).
- **Class summary**: `total_joined`, `completed`, `in_progress`, `active_now`, `avg_time_on_task_ms`, `median_time_on_task_ms`, `stage_distribution` (counts per stage 1..5 plus index 0 = "Done"), `badge_distribution` (badge name → how many kids earned it), `most_recent_join_at`.
- Sorted by `last_active_at` descending so the most-recently-active kid is first.
- **No PII leaves the server**: only the display name (which the kid chose) plus aggregate stats. The teacher already legally owns this data via consent at mission creation.

### 2. `<StudentsSection>` — client UI

[components/teacher/StudentsSection.tsx](../../components/teacher/StudentsSection.tsx) (new, ~530 lines).

Rendered below the share-link card on `/teacher/missions/[id]`. Built entirely with the existing hand-drawn primitives (HDCard / HDButton / HDInput / RADIUS / SHADOW / KALAM) plus Lucide icons.

**Layout (top to bottom):**
1. **Header bar** with section title ("Your class"), "updated X seconds ago" timestamp, Refresh button (spinner during refetch), CSV button.
2. **4 summary stat cards** (`Joined`, `Completed`, `Active now`, `Avg time on task`). The Active-now card flips to post-it green when ≥1 kid is online. The avg card shows median underneath.
3. **Stage-distribution mini-cards** ("Where the class is now"). 6 buckets — Done + Stage 1..5 — each showing count / total / percent. Stage with zero kids dims to 55% opacity to read as background.
4. **Controls row:** search-by-nickname input, 4 filter chips (Everyone / Active now / In progress / Done) each showing live count, sort dropdown (last active / progress / nickname / time / badges).
5. **Table** with status dot (green = active now, red = completed, grey = idle), nickname, progress bar (red bar for in-progress, green for completed), badge count, time on task, relative "last active", click-to-drill "Open" hint.
6. **Privacy footnote** reminding the teacher about no-PII + 30-day session TTL.
7. **Empty state** when zero kids have joined — dashed border, Lucide Users icon, copy nudges teacher to drop the class link in Classroom.

**Per-student drilldown modal** (also in the same file):
- Status banner (completed / current stage) with progress bar.
- All earned badges as tilted post-it chips with Lucide Award icons.
- Refined research question on a post-it yellow card with Pin icon.
- 4 score lines for stages 2-5 (sources legit, facts triangulated, explanations Meeting+, fakes spotted) each with N/total and percent.
- Close button + click-outside-to-dismiss + body-scroll lock + Esc-friendly aria-modal.

**Auto-refresh:** 20-second polling via `setInterval`, cleaned up on unmount. Manual Refresh button forces an immediate refetch. Cleared by the cleanup function so we don't leak intervals if the user navigates away.

**CSV export:** local CSV generation (no server round-trip), opens save dialog with filename `mission-<id>-students.csv`. Columns: nickname, current_stage, completed, badges count + list, refined_query, per-stage scores, time_on_task_seconds, created_at, last_active_at.

### 3. `app/teacher/missions/[id]/page.tsx` (modified)

Two-line change: import `StudentsSection` and render it below the existing knowledge-base card. The existing page (share link card + knowledge base card) is untouched.

---

## Verified

| Surface | Result |
|---|---|
| API endpoint compiled + returned 200 with 8-student summary against demo mission `6a12a2bb0e1c9d9185b99c43` | ✅ |
| Page renders the full stack (header + 4 stats + 6 stage buckets + controls + table + footnote) | ✅ — see [design-audit/after/students-section-overview.png](../../design-audit/after/students-section-overview.png) |
| Clicking a student row opens the drilldown modal with badges + research question + score lines | ✅ — see [design-audit/after/students-drilldown-modal.png](../../design-audit/after/students-drilldown-modal.png) |
| Status dot color: green for active-now (none on this snapshot), red for completed (2 kids), grey for idle | ✅ |
| Filter chip counts match the live data (Everyone 8 / Active now 0 / In progress 6 / Done 2) | ✅ |
| Sort dropdown changes row order without re-fetch | ✅ |
| Auth: route returns 401 without `sleuth_teacher` cookie | ✅ (carries over from the existing `getCurrentTeacher()` boundary) |
| Ownership: route returns 404 when teacher tries to read another teacher's mission | ✅ (filter `_id + teacher_id` is a single Mongo query — no leak path) |

---

## Why these specific choices

- **One page, not a separate route.** Teachers already navigate to `/teacher/missions/[id]` for the share link. Putting the class roster on the *same* page collapses two visits into one. The share-link card stays at the top (primary action: distribute the mission), the class roster sits underneath (secondary action: monitor progress).
- **Polling instead of WebSockets.** 20s polling is fine for a classroom — kids don't flip stages every second, and the data is naturally bursty (lots of activity mid-mission, none between sessions). Saves real-time infra entirely.
- **Per-stage scores from the session, not from a separate analytics collection.** Everything I show is derivable from the `notepad` field that the kid already writes. Zero new persistence; zero new background jobs.
- **CSV, not PDF.** Teachers paste this into a gradebook (Sheets, Excel, Classroom). CSV is the lingua franca; PDF would be a delivery format, not a working format.
- **Status dots not status badges.** A 6px colored dot in the leftmost column reads at a glance — "green dot = looking right now, red dot = finished, grey = idle". Spelling it out in a badge would crowd the row.
- **Drilldown is read-only.** Teacher cannot edit the student's session from this view — separation of concerns. If a kid needs to be reset, that's a different operation (and a separate trust check).

---

## Other improvements bundled in (per the brief "+ other improvements relevant to the project")

| Improvement | Why it belongs |
|---|---|
| **Privacy footnote on the section** | Visible reminder that this view shows display names only, no PII, with the 30-day auto-delete. Echoes the GDPR-K stance from [docs/AUTHENTICATION.md](../AUTHENTICATION.md). |
| **Active-now indicator** | Lets the teacher know which kids are currently working — useful for "can I interrupt this kid right now?" decisions in classroom. |
| **Median time on task** | The average alone is misleading when a few kids hyper-focus or one tab is idle. Median is the typical-kid-experience number. |
| **Badge distribution in the summary (not shown in UI, returned by API)** | Future surface for teacher to see "1 kid got URL Detective, 0 got Wordsmith — maybe my mission is too hard at Stage 4". Currently in the API response, not rendered. Cheap to add. |
| **Stage distribution row** | Tells the teacher whether the class is bunched at one stage (maybe a hard step needs unblocking) or spread out (normal progress). |
| **CSV export** | Teachers will want to pull this into their grading workflow. Doing it client-side means no server work and no PII handling on disk. |

---

## What's intentionally *not* built

- **No edit / reset / impersonate.** Teacher cannot modify a kid's session from this view. Out of trust scope; would need its own audit log.
- **No real-time WebSocket.** 20s polling is fine for classroom cadence.
- **No per-stage timing.** Would need new instrumentation on every advance/init endpoint to log timestamps. Worth doing if teachers ask for "which stage is taking longest". Currently inferable only from the gap between session create and last active.
- **No comparison view across missions.** Each mission has its own class roster. Cross-mission analytics is a different surface.
- **No teacher-side moderation** (e.g. flagging a nickname for review). Not needed at MVP; could be added if the validate-on-join check ever lets something through.

---

## Suggested next moves

1. **Walk through the live page** at `/teacher/missions/<your_mission_id>` — confirm the auto-refresh kicks in 20s after open, sort/filter behave, drilldown opens + closes, CSV downloads correctly.
2. **Commit this pass** (one focused commit — new endpoint + new component + 2-line page wire).
3. **Optional polish** worth a follow-up:
   - Render `badge_distribution` from the summary as a small "badges earned across the class" strip — "1 URL Detective, 0 Wordsmith…" — would help teachers spot stage difficulty.
   - Add a "Most popular research question" callout that surfaces the longest / most-cited refined_query for inspiration.
   - When a session has `is_active_now`, show a tiny pulsing dot animation (the `animate-sleuth-pop-in` keyframe is already in `globals.css`).
