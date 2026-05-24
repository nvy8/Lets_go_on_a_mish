# Sleuth — documentation

Index of all internal documentation. The project root keeps only entry-point files ([../README.md](../README.md), [../AGENTS.md](../AGENTS.md), [../CLAUDE.md](../CLAUDE.md)) — everything else lives here.

## Core

| Doc | Purpose |
|---|---|
| [AUTHENTICATION.md](AUTHENTICATION.md) | Auth model — teacher accounts, kid sessions, cookies, JWT, env vars, and how to enumerate live users. |
| [ATTRIBUTIONS.md](ATTRIBUTIONS.md) | Third-party assets (illustrations, fonts) with current license status. **Read before any public release.** |

## Reviews

Point-in-time audits of the codebase. Findings only — no fixes applied unless explicitly requested.

| Doc | Date | Scope |
|---|---|---|
| [reviews/CODE_REVIEW.md](reviews/CODE_REVIEW.md) | 2026-05-23 | Code & logic — badge-cheating leaks, security bugs, integrity issues, polish. |
| [reviews/DESIGN_REVIEW.md](reviews/DESIGN_REVIEW.md) | 2026-05-23 | Visual & responsive audit at 5 viewports. Contrast measurements, brand consistency. |

## Design

| Doc | Purpose |
|---|---|
| [design/SCIENTIFIC_FOUNDATIONS.md](design/SCIENTIFIC_FOUNDATIONS.md) | Research base — pedagogy, critical-thinking frameworks (SIFT, lateral reading), motivation theory, cognition, anti-patterns, child-safety regulation. Includes a Sleuth-surface application map to cite when changing copy or microinteractions. |
| [design/DESIGN_IMPROVEMENTS_FOR_KIDS.md](design/DESIGN_IMPROVEMENTS_FOR_KIDS.md) | Proposal for kid-flow improvements derived from the kids-app design guidelines. Cross-referenced against the visual audit. |

## Changelog

Chronological log of larger implementation passes. One file per pass — append, don't edit.

| Date | Doc | Summary |
|---|---|---|
| 2026-05-23 | [changelog/2026-05-23-kid-flow-design-pass.md](changelog/2026-05-23-kid-flow-design-pass.md) | Kid-flow accessibility + design pass (contrast, tap targets, labels, sentence case, KidNotice component, Stage 3 responsive break). |
| 2026-05-24 | [changelog/2026-05-24-iconography-pass.md](changelog/2026-05-24-iconography-pass.md) | Kid-join iconography — replaced emoji + Unicode arrow with Phosphor Icons (`MagnifyingGlass` / `Eye` / `ArrowRight`). Established the icon system convention. |
| 2026-05-24 | [changelog/2026-05-24-stage1-copy-research-aligned.md](changelog/2026-05-24-stage1-copy-research-aligned.md) | Stage 1 copy aligned to SCIENTIFIC_FOUNDATIONS — title `Query Design → Sharpen your question`, loading copy reframed around SIFT-Stop and Mayer signaling. |
| 2026-05-24 | [changelog/2026-05-24-kid-join-pii-validation.md](changelog/2026-05-24-kid-join-pii-validation.md) | Reverted the v3 hero brand-mark experiment back to the iconography-pass styling (user-rejected). Added client-side PII validation on the display-name input — `@` blocks as email, 7+ consecutive digits blocks as phone, both with friendly inline warnings and disabled submit. |
| 2026-05-24 | [changelog/2026-05-24-handdrawn-pilot-kid-join.md](changelog/2026-05-24-handdrawn-pilot-kid-join.md) | Pilot of a hand-drawn / sketchbook design system on kid-join only — wobbly borders, paper texture, hard offset shadows, Kalam headings + Geist body harmonization, Lucide icons, tape strip + post-it warning. Scoped to one page so the direction can be evaluated before propagation. |
| 2026-05-24 | [changelog/2026-05-24-handdrawn-propagation-full-app.md](changelog/2026-05-24-handdrawn-propagation-full-app.md) | Propagated the hand-drawn pilot to every Sleuth surface — landing, all 5 stages, complete page, all teacher screens, KidNotice + StageShell. Introduced shared `lib/design-tokens.ts` and `components/handdrawn/{HDCard,HDButton,HDInput}` primitives. 14 files migrated; 7 verification screenshots captured. |

## Conventions

- **File naming:** `SCREAMING_SNAKE.md` for top-level docs that are stable references (auth model, attributions, named reviews). `kebab-case-with-date.md` under `changelog/` for time-stamped logs.
- **Cross-references:** use relative markdown links so the docs render correctly on GitHub and in Markdown previews.
- **Code references:** prefer the `[path/to/file.ts:line](path/to/file.ts:line)` link form (renderers like the Claude Code CLI make these clickable).
- **Never put credentials in any `.md`.** Sensitive data stays in `.env.local` (which should be gitignored — see [AUTHENTICATION.md](AUTHENTICATION.md) §5).

## Where things are not

- Component-level JSDoc / inline code documentation lives next to the code, not here.
- The actual `git log` is the canonical history; the `changelog/` directory is for *narrative* logs of design or architecture passes, not commit-level changelogs.
- User-facing copy and tone references live in [../design-audit/kids-app-design-guidelines.md](../design-audit/kids-app-design-guidelines.md).
