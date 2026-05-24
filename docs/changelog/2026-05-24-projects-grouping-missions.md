# Implementation log — projects: grouping missions into multi-week units

Date: 2026-05-24
Scope: introduce a *Project* entity that optionally groups missions. A project can be a 6-week unit with 2 lessons/day (or any cadence the teacher wants). Missions remain valid on their own (standalone). Existing missions become standalone by default — zero data migration.

---

## Blockers + design decisions surfaced before implementation

The user asked to identify errors/blockers. These came up during design and were each resolved deliberately:

| # | Question | Decision | Why |
|---|---|---|---|
| 1 | Cascade vs. detach on project delete? | **Detach** (set `project_id = null`, unset `position` + `week_number`). Sessions live on. | Cascade would wipe the kid-session history attached to those missions — irrecoverable. Detach lets the teacher reorganize without data loss. |
| 2 | Backwards compat for existing standalone missions? | `project_id` is **optional**. Missing == standalone. Mongo's missing-field semantics + `$or` query handle both shapes. **No migration script needed.** | Zero-downtime rollout. Existing missions surface in the new "Standalone missions" section automatically. |
| 3 | Position field on what — project or mission? | On the **mission** (`position: number`). Append-at-end on create (`max(positions) + 1`). | One denormalized field, no separate ordering table, no reindexing on insert. |
| 4 | How rich is the scheduling concept? | **Lean**: optional `week_number` per mission, optional `week_count` per project. Pure metadata for grouping in the UI. **No** date arithmetic, **no** calendar enforcement. | A 6-week plan is a teacher convention — locking it to real calendar dates would force re-scheduling on every snow day. |
| 5 | Share token still per-mission? | **Yes**, unchanged. Project gets no aggregate share link. | Kids consume one mission at a time; the share-link → join → session flow is per-mission. A project-level link would force a new "browse the project" kid surface that doesn't exist. |
| 6 | What about archive vs. delete on a project? | **Both**, with different semantics. Archive = soft-delete, hidden from default list, missions stay attached. Delete = hard-delete, missions detached to standalone. | Teachers want to "put away" finished projects without losing the grouping; *delete* is for cleanup, *archive* is for history. |
| 7 | Can deleting a project orphan a kid session? | **No**. Sessions are bound to `mission_id`, never to `project_id`. Deleting a project never touches sessions. | Decouples the kid's record from the teacher's organisational hierarchy. |
| 8 | What happens to ordering on detach? | `position` is **unset** alongside `project_id`. If the mission re-joins a project later, it gets a fresh end-of-list position. | A `null` project_id with a stale `position` integer is meaningless and confusing. |
| 9 | Index on `(project_id, position)` — what about the standalone case (`null` project_id)? | Index covers `project_id: null` too, so listing standalone missions is also indexed. | Mongo treats `null` as a value in indexes; the query `{ teacher_id, $or: [{project_id: null}, {project_id: {$exists: false}}] }` is index-aided. |
| 10 | Can a teacher own only their own projects? | **Yes**. Every query filters by `teacher_id` at the Mongo layer. No leak path. | Same trust boundary as missions. |

---

## What shipped

### Schema

`lib/types.ts`:
- New `Project` type — `_id, teacher_id, name, description?, week_count?, created_at, archived_at?`
- `Mission` extended — added optional `project_id`, `position`, `week_number`

`lib/db.ts`:
- New `COLLECTIONS.projects`
- Indexes: `projects` on `(teacher_id, archived_at)`; `missions` on `(project_id, position)`

### APIs

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/projects` | POST | Create project (name + optional description + optional week_count) |
| `/api/projects` | GET | List teacher's projects; `?archived=1` includes archived. Returns `mission_count` per project. |
| `/api/projects/[id]` | GET | Project + its missions (sorted by `position`, then `created_at`) + per-mission session stats + project-level aggregate (joined / completed / active now / badges) |
| `/api/projects/[id]` | PATCH | Rename, edit description, set week_count, `{ archived: true }` to soft-delete, `{ archived: false }` to restore |
| `/api/projects/[id]` | DELETE | Hard-delete project + detach missions (sets `project_id`/`position`/`week_number` to null) |
| `/api/missions` | POST | Now accepts optional `project_id` + `week_number`. If `project_id` present, ownership is verified and `position` auto-assigned. |
| `/api/missions` | GET | Returns `project_id`, `position`, `week_number`. `?standalone=1` filters to no-project missions. |
| `/api/missions/[id]` | GET | Includes `project_id`, `position`, `week_number`, and a populated `project: { id, name } | null` for UI display. |
| `/api/missions/[id]` | PATCH | Reassign to / detach from a project; set `position` or `week_number`. Verifies project ownership. |

All endpoints enforce auth (`getCurrentTeacher()`) and teacher ownership at the Mongo query layer.

### UI

| Route | Change |
|---|---|
| `/teacher/dashboard` | Rebuilt. Two create buttons (New project / New mission). Two sections: **Your projects** (yellow post-it cards with thumbtacks) + **Standalone missions** (existing layout). "Show archived" toggle. Mission creation form now has a "Add to a project" dropdown. |
| `/teacher/projects/[id]` | **New page.** Header (Project tag, name, description, week-count). Edit / Archive / Delete actions. 4 stat cards (Missions / Kids joined / Completed / Active now). Add-mission inline form with week_number picker (bounded by the project's `week_count`). Missions grouped by `week_number` if any have one set, otherwise flat. Each mission card shows live stats (joined/done/active/badges) + Open + Remove-from-project actions. |
| `/teacher/missions/[id]` | "Part of: <Project> · Week N · #position" chip above the H1 (clickable, links to the project). Edit-project-membership action under the title — opens a panel with project dropdown + week-number input. Back-link target switches to the project when applicable, otherwise dashboard. |

---

## Verified end-to-end

Smoke test via curl:

| # | API call | Result |
|---|---|---|
| 1 | `GET /api/projects` (empty list initially) | ✅ `{ projects: [] }` |
| 2 | `POST /api/projects` with name + 6-week count | ✅ Returns `projectId` |
| 3 | `POST /api/missions` × 2 with `project_id` + `week_number: 1` and `week_number: 2` | ✅ Both succeed, `position` auto-assigned 1 and 2 |
| 4 | `GET /api/projects/[id]` | ✅ Returns project + 2 missions sorted by position + zero-session summary stats |
| 5 | `PATCH /api/missions/[id]` with `project_id: null` | ✅ Mission detached |
| 6 | `GET /api/projects/[id]` after detach | ✅ Project now shows 1 mission |
| 7 | `GET /api/missions?standalone=1` | ✅ Detached mission appears in standalone list |

UI verified via chrome-devtools MCP:

| Surface | Screenshot |
|---|---|
| Dashboard with both sections + project card | [design-audit/after/projects-dashboard.png](../../design-audit/after/projects-dashboard.png) |
| Project detail page (Year 6 Geography, 1 mission in Week 2) | [design-audit/after/project-detail.png](../../design-audit/after/project-detail.png) |

Hand-drawn aesthetic preserved everywhere: yellow post-it for project cards (with red thumbtack decoration), Kalam headings, hard offset shadows, wobbly borders. Project + mission card shapes alternate tilt by index.

---

## Other improvements bundled in

Per the brief "+ other relevant improvements":

1. **Soft-delete (archive) for projects.** Teachers want to keep old units around as templates / records without seeing them in their default list. PATCH `{ archived: true }` + dashboard "Show archived" toggle.
2. **Auto-position on create.** Teacher never has to think about ordering — the new mission lands at the end of the project. Manual ordering via PATCH is also available for when they care.
3. **Week-number grouping** on the project detail page. If any mission has `week_number` set, missions are auto-grouped by week with "Week N" headers. If none have weeks, flat list.
4. **Sticky-note visual treatment** for project cards — reinforces that a project is a *bundle of things you scribbled together*, not a corporate folder.
5. **"Part of: <Project>" chip** on mission detail — one-click navigation back to the project, with the week number + position inline so the teacher always knows where the mission lives.
6. **Project-level aggregate stats** on the detail page — same shape as the per-mission Students roster (joined / completed / active now), summed across all missions in the project. Lets the teacher answer "how is the whole unit going?" without opening each mission.
7. **Form constraints surfaced as input bounds.** Week-number input on the add-mission form is `max={project.week_count}` — teacher can't accidentally type week 14 in a 6-week project.

---

## Known limitations + suggested next moves

- **No reorder UI** — drag-and-drop or up/down arrows for the position field would be useful when a teacher inserts a new lesson between week 2 and week 3. The PATCH endpoint already supports `{ position: N }`; the UI just doesn't expose it yet.
- **No bulk-create** — a teacher building "6 weeks × 2 lessons" would create 12 missions one by one. A "bulk create N missions" action with sensible defaults (title template, week per N) is a strong follow-up.
- **No project-level share link** — kids still receive individual mission links. If teachers ask for "one link → see the whole unit", that's a new kid surface (project browser) and a different scope.
- **No mission templates / duplication** — copying a mission as a template for next week's variation is a clear teacher need. Future endpoint: `POST /api/missions/[id]/duplicate`.
- **`stage_distribution` from the per-mission StudentsSection isn't aggregated across the project.** If you want "at the project level, where are most kids?" that requires another pass.
- **No drag-and-drop to rearrange missions across projects.** PATCH supports reassignment; just no UI affordance yet.

---

## What stays unchanged

- All kid-facing surfaces (`/m/[shareToken]/*`). Projects are a teacher-side organizational concept. Kids continue to join via per-mission share links.
- Auth model, session shape, badge logic, all stage APIs.
- Existing missions: anyone created before this commit shows up unchanged as a "Standalone mission" in the new dashboard layout.
- Per-mission "Your class" analytics ([2026-05-24-teacher-students-analytics.md](2026-05-24-teacher-students-analytics.md)) continues to work on every mission, whether standalone or in a project.
