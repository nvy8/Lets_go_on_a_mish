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
| [design/DESIGN_IMPROVEMENTS_FOR_KIDS.md](design/DESIGN_IMPROVEMENTS_FOR_KIDS.md) | Proposal for kid-flow improvements derived from the kids-app design guidelines. Cross-referenced against the visual audit. |

## Changelog

Chronological log of larger implementation passes. One file per pass — append, don't edit.

| Date | Doc | Summary |
|---|---|---|
| 2026-05-23 | [changelog/2026-05-23-kid-flow-design-pass.md](changelog/2026-05-23-kid-flow-design-pass.md) | Kid-flow accessibility + design pass (contrast, tap targets, labels, sentence case, KidNotice component, Stage 3 responsive break). |

## Conventions

- **File naming:** `SCREAMING_SNAKE.md` for top-level docs that are stable references (auth model, attributions, named reviews). `kebab-case-with-date.md` under `changelog/` for time-stamped logs.
- **Cross-references:** use relative markdown links so the docs render correctly on GitHub and in Markdown previews.
- **Code references:** prefer the `[path/to/file.ts:line](path/to/file.ts:line)` link form (renderers like the Claude Code CLI make these clickable).
- **Never put credentials in any `.md`.** Sensitive data stays in `.env.local` (which should be gitignored — see [AUTHENTICATION.md](AUTHENTICATION.md) §5).

## Where things are not

- Component-level JSDoc / inline code documentation lives next to the code, not here.
- The actual `git log` is the canonical history; the `changelog/` directory is for *narrative* logs of design or architecture passes, not commit-level changelogs.
- User-facing copy and tone references live in [../design-audit/kids-app-design-guidelines.md](../design-audit/kids-app-design-guidelines.md).
