# Sleuth — Design Review

Date: 2026-05-23
Methodology: live dev server (Next.js 16, port 3002, Mongo in Docker) driven through Chrome DevTools MCP at five viewport widths — 1280 (desktop), 1024 (iPad landscape), 768 (iPad portrait), 390 (iPhone 14), 375 (iPhone SE). Computed styles read from the rendered DOM, contrast ratios calculated against rendered backgrounds. Screenshots saved under [design-audit/](design-audit).

Scope was visual / brand consistency and responsive behavior on tablet + mobile, per your direction. Functional E2E and accessibility deep-dive are out of scope (a few accessibility points surfaced naturally during contrast checks and are flagged in section 7).

---

## 1. Design tokens — what's actually in the rendered CSS

Read off the landing page via `getComputedStyle` (Tailwind v4 emits OKLCH, values below are sRGB after canvas round-trip).

### Typography

| Token | Value | Source |
|---|---|---|
| Sans font | `Geist` (with `Geist Fallback, system-ui, -apple-system, "Segoe UI", sans-serif`) | `next/font/google` in [app/layout.tsx:5](../../app/layout.tsx:5) |
| Mono font | `Geist Mono` | [app/layout.tsx:10](../../app/layout.tsx:10) |
| Base size | 16px | body |
| Hero H1 (`text-6xl`) | 60px / line-height 60px / weight 600 / tracking -1.5px | `app/page.tsx:10` |
| Section H1 (`text-2xl`–`text-3xl`) | 24–30px / weight 600 | dashboard, login, stage shell |
| Lead paragraph (`text-lg`) | 18px / line-height 28px | landing copy |
| Body text (`text-base`) | 16px / 24px | most surfaces |
| Small label (`text-sm`) | 14px / 20px | metadata, captions |
| Stage number label (`text-sm font-mono`) | 14px Geist Mono | landing cards, stage shell |
| Mission title in stage shell | 12px Geist Mono | [components/StageShell.tsx:41](../../components/StageShell.tsx:41) |

### Colors

| Role | Hex | Tailwind class | Notes |
|---|---|---|---|
| Page background | `#fafafa` | zinc-50 / `--background` | Set on html + body in [app/globals.css:7](../../app/globals.css:7) |
| Foreground / H1 | `#18181b` | zinc-950 / `--foreground` | |
| Body paragraph | `#52525c` | zinc-600 | |
| Secondary text | `#3f3f46` | zinc-700 | |
| Card surface | `#ffffff` | white | |
| Card border | zinc-200 | | |
| Primary CTA (dark) | bg `#18181b`, text `#ffffff` | bg-zinc-900 | Landing "Teacher login", dashboard "Create" |
| Primary CTA (amber) | bg `#fe9a00`, text `#ffffff` | bg-amber-500 | Kid join "Start mission", stage advance buttons, Download Brief |
| Amber accent text | `#e17100` | amber-600 | "friction", stage labels, callout headings |
| Amber icon | `#fe9a00` | amber-500 | Magnifying-glass icon, decorative spans |
| Amber surface (soft) | amber-50 / amber-100 | | Callouts, badge pills, completion card |
| Amber border | amber-200 / amber-300 | | Used inconsistently — see §6 |
| Error red | bg-red-50 / text-red-700, bg-red-600 toast | | Stage 1 fallback message, Stage 4 reject toast |
| Success green | bg-green-500 / border-green-400 | | Stage 4 verified click, Stage 6 reveal |

### Shape & spacing

- **Buttons**: `rounded-full` everywhere (computed as `~2.68e+07px` — practical pill cap). Padding `px-6 py-3` for primary, `px-5 py-2` for secondary.
- **Cards**: `rounded-2xl` (16px) for content, `rounded-3xl` (24px) for marketing/empty-state, `rounded-xl` (12px) for inline list items, `rounded-lg` (8px) for inputs.
- **Container widths**: `max-w-2xl` (landing hero), `max-w-3xl` (complete page), `max-w-4xl` (dashboard, landing cards), `max-w-5xl` (stage shell), `max-w-sm` (login), `max-w-md` (kid join).
- **Page padding**: `px-6 py-8` to `py-20` depending on screen.

The palette is coherent: a dark zinc neutral foundation + a single amber accent (the "friction" of the brand promise). No off-palette colors snuck in.

---

## 2. Fonts — observations and issues

**What works.** Geist + Geist Mono is a clean, modern pairing. The mono is used sparingly and intentionally — stage numbers, system metadata. Letter spacing on the hero H1 (`tracking-tight` = -0.025em, rendered -1.5px at 60px) gives "Sleuth" a confident, brand-feeling presence.

**What to look at:**

| # | Issue | Where | Severity |
|---|---|---|---|
| F1 | Mono used for the **mission title** in the stage shell header reads like log output, not a human title. At 768px the title wraps to a second mono line in the top-right and feels brittle. | [components/StageShell.tsx:41](../../components/StageShell.tsx:41) | Medium |
| F2 | "Stage 1 of 6" uppercase + `tracking-wide` chip uses a sans face but in the landing cards the same metaphor uses **mono** — `text-sm font-mono text-amber-600`. The two treatments don't match across surfaces. | [app/page.tsx:50](../../app/page.tsx:50) vs [components/StageShell.tsx:34](../../components/StageShell.tsx:34) | Low |
| F3 | Section-callout labels alternate between `font-mono uppercase` (complete page "BADGES EARNED", "RESEARCH QUESTION") and plain `uppercase tracking-wide` (mission detail "Class link", "Drop this in Google Classroom" — though that one's not even uppercase). Inconsistent metadata typography. | [app/m/[shareToken]/complete/page.tsx:56](../../app/m/[shareToken]/complete/page.tsx:56), [app/teacher/missions/[id]/page.tsx](../../app/teacher/missions/[id]/page.tsx) | Low |
| F4 | The hero `text-6xl` (60px) is set globally — at iPad portrait (768px) it dominates ~30% of the viewport height before any content. Consider `text-5xl sm:text-6xl` for marketing screens specifically (landing has `text-5xl sm:text-6xl` already; mission detail H1 jumps straight to `text-3xl` with no responsive step). | [app/teacher/missions/[id]/page.tsx](../../app/teacher/missions/[id]/page.tsx), [app/m/[shareToken]/complete/page.tsx:49](../../app/m/[shareToken]/complete/page.tsx:49) (`text-4xl` on a one-word "Mission complete") | Low |
| F5 | No explicit font weight on the kid join page heading — uses `font-semibold` everywhere which is the de facto brand weight. The PDF uses `helvetica` (jsPDF default), so the exported brief won't look like the on-screen brand at all. | [lib/pdf.ts:22](../../lib/pdf.ts:22) | Medium |

---

## 3. Colors — observations and issues

**What works.** Two-color system (zinc + amber) is disciplined. White cards on a zinc-50 ground give the surfaces enough lift without shadows everywhere. Status colors (red / green) only appear when actually communicating status.

**What to look at — contrast (WCAG AA = 4.5:1 for normal text, 3:1 for large text or graphical objects):**

| # | Surface | Measured contrast | WCAG verdict | Where |
|---|---|---|---|---|
| C1 | **White text on amber-500 button (`#fe9a00`)** | **2.13:1** | ❌ Fails AA (and AAA) for normal-text buttons | Kid join "Start mission", every stage advance, Download Brief — used as the *primary CTA color for the kid* |
| C2 | **Amber-600 text (`#e17100`) on white card** | **3.20:1** | ❌ Fails AA for 14px stage labels, callout headings | Landing card stage labels, mission detail "Class link" heading, complete page "BADGES EARNED" etc. |
| C3 | **Amber-600 on body bg-#fafafa** | **3.07:1** | ❌ Fails AA | "friction" word in landing tagline; pill chip "For teachers of 9-14 year olds" |
| C4 | **Amber-500 icon on body bg** | 2.05:1 | ✅ Passes 3:1 for graphical objects only — fine for the 🔍 emoji-style icon, not for any text drawn in this color | Logo icon, decorative spans |
| C5 | H1 zinc-950 on bg-zinc-50 | 16.97:1 | ✅ AAA | All headings |
| C6 | Lead paragraph zinc-600 on bg | 7.40:1 | ✅ AAA | All body copy |
| C7 | Primary dark button (white on zinc-950) | 17.72:1 | ✅ AAA | Teacher-facing primary CTA |

**Implication.** The brand identity rests on amber, but the amber CTA is **the lowest-contrast meaningful surface on the site**. White-on-amber-500 at 2.13:1 means a 9-year-old in classroom lighting on a glossy tablet may genuinely miss the button. Worth either:

- Darkening the CTA to `bg-amber-600` (which would push contrast for white text to ~3.7:1, still under AA but better) and using `bg-amber-700` (~5:1) for ✓ AA, **or**
- Switching CTA text to zinc-950 on amber-500 (yields ~11:1 — passes AAA), keeping the saturation that brands the app.

Either fix is one Tailwind class change per button and would propagate across all 6 stages plus the join screen.

**Other color issues:**

| # | Issue | Where |
|---|---|---|
| C8 | Disabled primary CTA is `opacity-50` on the same amber — looks like a faded enabled button rather than a "you can't click this yet" affordance. See the kid-join screenshot — the button reads as already-clickable. | [app/m/[shareToken]/page.tsx:93](../../app/m/[shareToken]/page.tsx:93), every stage submit button |
| C9 | Stage 4 "rejected" verify button uses `bg-red-500 animate-pulse text-white` — kids will read a pulsing red as "danger, undo!" rather than "that fact isn't in this source". Tone is too punitive for a learning moment. | [components/stages/Stage4.tsx:302](../../components/stages/Stage4.tsx:302) |
| C10 | Mission detail "Class link" callout uses bg-amber-50 + border-amber-200, but other amber callouts (Stage 4 instructions, kid-join lead) use bg-amber-100 / border-amber-200 / border-amber-300 inconsistently. Three amber-surface treatments visible across the app. | [app/teacher/missions/[id]/page.tsx](../../app/teacher/missions/[id]/page.tsx), [components/stages/Stage4.tsx:175](../../components/stages/Stage4.tsx:175), [components/stages/Stage6.tsx:111](../../components/stages/Stage6.tsx:111) |

---

## 4. Style & components — per page

### Landing — `/`

- 1280 / 1024 (desktop, iPad landscape): centered hero, 3-column stage grid below. Whitespace is generous and the page feels intentional. Stage cards are equal-height and tidy.
- 768 (iPad portrait): 3 columns survive (good — uses `sm:grid-cols-3` which kicks in at 640px), hero text dominates upper third of screen.
- 390 / 375 (mobile): hero text resizes (`text-5xl`), CTAs stack via `sm:flex-row`, stage cards collapse to a single column. Holds together well.
- Issue: the gap between hero and "How it works" section is `mt-32` (128px), which on iPad portrait leaves a noticeable blank band before the user discovers the cards. Consider `mt-20 sm:mt-32`.

### Teacher login — `/teacher/login`

- Single card, `max-w-sm`. Identical look across all viewports.
- Issue: no visible focus ring on inputs beyond `focus:border-zinc-900` (the border darkens by ~5%, easy to miss for keyboard nav). Add `focus:ring-2 focus:ring-zinc-900/20` or similar.
- Issue: error states only render after an API error returns — there's no client-side `aria-invalid` or inline validation. Low effort to add.

### Teacher dashboard — `/teacher/dashboard`

- Form, when open, spans the full `max-w-4xl` container. Mission title and topic inputs stretch to ~1100px on a 1280 viewport — that's wider than necessary for readability and looks like a config form, not a brand surface. Consider a `max-w-2xl` inner constraint on the form.
- The "No missions yet" empty-state card stays visible **below** the create form while the form is open (see [03-teacher-dashboard-form-desktop.png](../../design-audit/03-teacher-dashboard-form-desktop.png)). Either hide the empty state while `showForm`, or only show it when `missions.length === 0 && !showForm`.
- Card hover state: only `hover:border-zinc-400` — quiet but works. No keyboard focus indicator on the card link.

### Mission detail — `/teacher/missions/[id]`

- Desktop: huge whitespace below the share-link callout (see [04-mission-detail-desktop.png](../../design-audit/04-mission-detail-desktop.png)). The page does one job (show the share link) so density feels off. Consider adding "missions you've created earlier" context, recent-joins, or just trimming the empty space with a tighter container.
- Mobile: share URL truncates with ellipsis inside the input — fine, the Copy button does the work. The "Drop this in Google Classroom" hint wraps to two lines naturally.

### Kid join — `/m/[shareToken]`

- All viewports: clean centered card with magnifying-glass mark, title, topic, name field, CTA. The visual rhythm is good and warmer than the teacher pages.
- The "Start mission →" button at full opacity-50 disabled looks pastel — see C8 above. A child may try to tap it.

### Stage shell — `/m/[shareToken]/stage/[n]`

- The shell is consistent: stage label / title / topic on the left, display-name + mission title (mono) on the right, progress bar across.
- Mobile (390): the right-aligned `text-right` block (display name + mono mission title) crowds against the topic subtitle if the mission title is long. The `flex items-start justify-between` doesn't wrap. With "Year 6 — Transylvanian Churches" mono-rendered in the top-right corner, mobile width is tight.
- The progress bar is amber-500 on zinc-200, height `h-2`. Fine.
- **Error state at Stage 1** (when LLM init fails — which it did in my run, see §8): bare red text "Failed to load examples. Refresh the page." No icon, no card, no retry button. See [06-stage1-shell-ipad-768.png](../../design-audit/06-stage1-shell-ipad-768.png). Kids will sit on this.

### Complete page — `/m/[shareToken]/complete`

- Loads even without a fully completed run (showing 0 verified facts, no badges) — graceful empty handling.
- Trophy emoji + "Mission complete" reads well. Two CTAs side-by-side on desktop, stacked on mobile via `sm:flex-row`.
- The "Download Research Brief (PDF)" button is `bg-amber-500 text-white` — C1 applies here, this is *the* button the experience is built around.
- PDF font is helvetica (jsPDF default) — totally off-brand vs. the Geist on-screen experience. See F5.

---

## 5. Responsive behavior summary (tablet + mobile focus)

| Page | iPad portrait (768) | iPhone 14 (390) | iPhone SE (375) | Notes |
|---|---|---|---|---|
| Landing | ✅ 3-col cards survive | ✅ Cards stack, CTAs stack | ✅ Same as 390 | Hero text/spacing dominates iPad portrait |
| Teacher login | ✅ | ✅ | ✅ | Card constrains tightly; no responsive issues |
| Teacher dashboard | ✅ but form too wide | ✅ form readable | ✅ | See §4 |
| Mission detail | ✅ | ⚠️ heading wraps to 2 lines, share URL ellipsises | ⚠️ as 390 | Acceptable |
| Kid join | ✅ | ✅ | ✅ | Best mobile screen in the app |
| Stage shell | ⚠️ mono mission title in top-right feels off | ⚠️ top-right block crowds | ⚠️ as 390 | F1 + layout |
| Stage 4 (split-screen) | Should be tested with real LLM data — `lg:grid-cols-3` kicks in at 1024px, so at iPad portrait (768) the source text and facts sidebar **stack vertically**. The "tap the #N when you spot a fact" UX relies on side-by-side. On phones it's effectively a different UX. | ⚠️ stacked | ⚠️ as 390 | Worth a deliberate mobile UX pass for Stage 4 — the current design assumes desktop |
| Stage 6 | ⚠️ button row aligns right via `justify-end` — fine | ⚠️ same | ⚠️ same | OK |
| Complete | ✅ | ✅ stacked CTAs | ✅ | Good |

**Single biggest responsive concern:** Stage 4's split-screen *is* the pedagogy. On iPad portrait and phones it collapses into a vertically stacked "read text, scroll to facts, scroll back to text" flow that destroys the side-by-side affordance. If kids will use tablets in landscape (standard classroom posture for an iPad), the breakpoint `lg:` (1024px) excludes iPad portrait (768) and iPad mini. Consider `md:grid-cols-3` (768px) or a dedicated mobile layout.

---

## 6. Brand consistency findings (cross-cutting)

| # | Finding | Severity |
|---|---|---|
| B1 | The amber CTA fails contrast (C1). Either re-token the button or change text color. This is the single highest-leverage brand+a11y fix. | High |
| B2 | Amber surface treatments use 3 different combos (bg-amber-50/100, border-amber-200/300, border-2 sometimes). Pick one "soft callout" recipe and one "highlighted callout" recipe, document, and apply. | Medium |
| B3 | Mono font is the metadata convention — but only sometimes (F2, F3). Either commit to "all stage/section metadata is mono" or remove it for surfaces that don't feel system-like. | Medium |
| B4 | Page max-widths vary (sm / md / 2xl / 3xl / 4xl / 5xl). The visual width hierarchy isn't intentional — the kid-join (max-w-md) is narrower than the teacher login (max-w-sm), the mission detail uses max-w-4xl with very little content. A 3-tier system would help: marketing wide, form narrow, app medium. | Low |
| B5 | PDF brand drift (F5). The deliverable a teacher/parent sees is helvetica; the on-screen brand is Geist. Either embed Geist in the PDF (jsPDF supports custom fonts) or accept the divergence and color-match more aggressively. | Medium |
| B6 | Border radius scale is intentional and used consistently (8 / 12 / 16 / 24 / pill). ✅ |
| B7 | No design tokens layer — colors are inlined as Tailwind classes everywhere. If the amber gets re-decided, every `bg-amber-500` / `text-amber-600` / `border-amber-200` has to be hand-edited. Consider declaring `--color-primary-500` etc. in `@theme inline` in [globals.css](../../app/globals.css). | Low |

---

## 7. Accessibility notes that fell out of the visual pass

Not a full WCAG audit — but observed while measuring:

- **A1.** Amber CTA contrast (C1) is the dominant a11y blocker. Kids on tablets in sunlit classrooms are exactly the worst case.
- **A2.** Focus rings are subtle (border-color change only) on inputs and links. Add `focus-visible:ring-2 focus-visible:ring-amber-500/40` (or zinc-900/20 on teacher-facing surfaces).
- **A3.** Touch target size: pill buttons at `py-2.5` to `py-3` are ~44px tall which hits the 44×44px iOS guideline. The Stage 4 source-toggle buttons at `h-9 w-9` (36×36) are below it.
- **A4.** Stage shell badges use `🏅 {b}` emoji + text — fine, but the emoji itself isn't announced consistently across screen readers and the badge has no `aria-label`. Add `aria-label={`Badge: ${b}`}`.
- **A5.** Color is the only signal for some states: Stage 6 picks use color alone (green/red borders) to indicate correct/wrong. Add an icon or text label inside the card.
- **A6.** `color-scheme: only light` is set in [globals.css:5](../../app/globals.css:5) — explicit choice to disable dark mode. Fine, but worth noting that this is opinionated. Kids on parent devices with dark mode forced will still see the light UI.

---

## 8. Runtime issue observed during the audit (not visual, but caught the audit)

Stage 1 init returned **500 in 326ms** both times I tried it — far faster than the 60s LLM timeout, so the Claude CLI exited non-zero on the spawn. Likely a Windows-specific OAuth / stdio path issue with `claude --print` invoked from `child_process.spawn` in [lib/llm.ts:19](../../lib/llm.ts:19). The error message isn't echoed in the server log (because [llm.ts:39](../../lib/llm.ts:39) only includes stderr in the rejected Promise, which the route then JSON-serializes back to the client as `error` — same pattern flagged as #11 in [CODE_REVIEW.md]([CODE_REVIEW.md](CODE_REVIEW.md))). All 6 stages depend on this; **without it the app can't be demoed**. Worth a separate investigation pass — happy to do that next if you want.

---

## 9. Suggested order of attack

When you're ready to act on this, this order maximizes ROI:

1. **C1 (amber CTA contrast)** — single change, propagates to every primary kid-facing button. Largest user-visible win.
2. **C8 (disabled state)** — change to `disabled:bg-zinc-300 disabled:text-zinc-500` (or similar) so the button visibly stops being a CTA.
3. **Stage 4 responsive break (`lg:` → `md:`)** — Stage 4 is the most distinctive screen of the app, and it currently breaks on iPad portrait.
4. **F1 / Stage shell mono mission title** — change to sans, drops the "log output" feeling.
5. **B2 (amber surface treatments)** — pick one soft, one highlighted, find/replace.
6. **A2 / A4 / A5 (focus rings, badge aria, color-alone signals)** — small fixes that materially improve classroom accessibility.
7. **B5 / F5 (PDF brand match)** — only when the rest is settled; this is polish.
8. **Runtime issue from §8** — separate from design but blocks demoing the full flow.

---

## 10. What I did not test (be aware)

- Real walkthrough of stages 2-6 with actual LLM data — Stage 1 init failed in my dev env (§8), so the stage-specific designs (Stage 2 source cards, Stage 3 previews, Stage 4 split-screen, Stage 5 grading, Stage 6 hallucination cards) were reviewed from JSX source only. I can re-run the audit with live data once the CLI issue is resolved.
- Print preview of the PDF (jsPDF generates client-side — would need to download the PDF and inspect).
- Reduced-motion respect on the framer-motion entries.
- Internationalization — copy length when translated would shift the responsive layout.

Screenshots referenced live in [design-audit/](design-audit). The dev server is still running on http://localhost:3002 if you want to poke around interactively.
