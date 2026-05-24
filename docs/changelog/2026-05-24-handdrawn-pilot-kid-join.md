# Implementation log — hand-drawn design pilot on kid-join

Date: 2026-05-24 (fifth pass of the day on the kid-join card)
Scope: full hand-drawn aesthetic system applied to [app/m/[shareToken]/page.tsx](../../app/m/%5BshareToken%5D/page.tsx) only — kid-join page and its "Mission not found" empty state. No other surface touched.
Status: shipped to working tree, not committed. Live at `http://localhost:3000/m/<shareToken>`.

This is a **pilot** of a sketchbook / hand-drawn design philosophy explicitly chosen against the option of a full-app rebrand. The intent is to see the new aesthetic landed on one surface and decide whether to propagate.

---

## What the design system asks for, and how the pilot delivers

| Principle from the spec | How it landed on kid-join |
|---|---|
| **No straight lines** — wobbly border-radius everywhere | Each container ships a custom multi-value `border-radius` (e.g. `30px 60px 25px 70px / 60px 25px 70px 30px` for the card, `62% 38% 50% 50% / 45% 55% 45% 55%` for the brand-mark oval). Six reusable values stored in a local `RADIUS` map at the top of the file so they're inspectable and tweakable. No standard `rounded-*` classes on visible chrome. |
| **Paper texture** — radial-gradient dot pattern | Body uses `radial-gradient(#e5e0d8 1px, transparent 1px)` at `24px 24px` over `#fdfbf7` warm paper. Visible behind and around the card. |
| **Playful rotation** — small tilt transforms | Brand-mark oval rotates `-3deg`, the red "Sleuth mission" tag rotates `+1deg`, the tape strip at the top of the card rotates `-3deg`. Asymmetric tilt creates the "pinned to a corkboard" feel. |
| **Hard offset shadows — no blur** | Every elevated element uses solid offset box-shadow: card `6px 6px 0px 0px #2d2d2d`, brand mark `4px 4px`, button `4px 4px`, input `2px 2px`. Hover reduces to `2px 2px` with a small translate. Active eliminates the shadow entirely so the button "presses flat". |
| **Handwritten typography** — Kalam (heading), Patrick Hand (body) | **Harmonized:** Kalam loaded via `next/font/google` and applied to H1, the "Sleuth mission" tag, the "Pick a display name" label, the CTA, and the empty-state title. Body, hint, topic, input value, and notices stay on Geist sans for legibility (per [SCIENTIFIC_FOUNDATIONS.md §5.2 Mayer Modality](../design/SCIENTIFIC_FOUNDATIONS.md)). Patrick Hand was **not added** in this pilot — see "Conscious deviation" below. |
| **Scribbled decoration** — tape, thumbtacks, dashed lines | Translucent tape strip at top of card (`rgba(45, 45, 45, 0.12)` with dashed edge hint). Privacy notice rendered with `border-2 border-dashed` matching the "secondary elements" pattern. Brand-mark sits on a post-it yellow disc. |
| **Limited palette** — paper white, pencil black, correction red, post-it yellow, ballpoint blue | Stored in a `COLOR` map at the top of the file: `paper #fdfbf7`, `pencil #2d2d2d`, `muted #e5e0d8`, `red #ff4d4d`, `blue #2d5da1`, `postIt #fff9c4`. Amber **dropped** from this page only (the rest of Sleuth's amber palette is untouched). |
| **Intentional messiness** — asymmetry, overlap | Brand mark and "Sleuth mission" tag intentionally sit on the same row with different rotations and slight overlap. H1 wraps freely — no manual width balancing. |
| **Lucide icons** with `strokeWidth={2.5}` | Installed `lucide-react`. Replaced Phosphor `MagnifyingGlass / Eye / ArrowRight / WarningCircle` with Lucide `Search / Eye / ArrowRight / AlertCircle`. All at `strokeWidth={2.5}`. Phosphor stays in the project as a dependency — other pages still use it. |

### Components, per element

- **Page wrapper.** `bg #fdfbf7` + radial-gradient dot pattern. Full bleed.
- **Card.** White, `border-[3px] #2d2d2d`, very wobbly radius, `6px 6px 0px #2d2d2d` shadow. Width capped at 28rem.
- **Tape strip.** `position: absolute`, translucent grey rectangle straddling the top edge, `-rotate-3`.
- **Brand mark.** 80×80 wobbly oval, post-it yellow (`#fff9c4`), `border-[3px] #2d2d2d`, `-rotate-3`, hard offset shadow, Lucide `Search` size 38 stroke 2.5 inside.
- **"Sleuth mission" tag.** Red marker (`#ff4d4d`), white Kalam text, `border-2`, slight `+1deg` tilt, mini hard shadow. Sits to the right of the brand mark.
- **H1.** Kalam 700, `text-3xl`, `#2d2d2d`.
- **Mission topic.** Geist body, neutral grey (`#2d2d2d / 80% opacity` via hex `cc`).
- **Label.** Kalam 700, `text-lg`.
- **Hint.** Geist body, faded grey.
- **Input.** `border-[3px] #2d2d2d`, wobbly radius, `2px 2px 0px #2d2d2d` shadow. Border + shadow flip to red on warning. Focus ring blue ballpoint (`#2d5da1`). Geist input value.
- **Privacy notice.** Dashed `border-2 #2d2d2d4d` over warm paper bg, wobbly radius, Lucide `Eye` icon.
- **Warning notice (PII).** Post-it yellow bg, thick black border, hard offset shadow, Lucide `AlertCircle` in correction red.
- **CTA button.** White → red on hover, Kalam text, thick black border, wobbly oval. Three-state shadow (4px enabled → 2px hover → 0 active) gives the "press flat" effect. Disabled uses `muted #e5e0d8` background with no shadow.
- **Loading state.** Kalam "Loading…" over the paper bg, no card. Quiet.
- **Empty state ("Mission not found").** Same brand-mark + card pattern, smaller. Same paper bg.

---

## Before / after

### Before (the iconography-pass / Phosphor state)

See the screenshots from the user's prior turns in this conversation:
- Pastel amber-100 pill with duotone amber-600 magnifier
- Geist sans throughout
- Standard `rounded-3xl` card with subtle soft shadow
- Eye + ArrowRight in Phosphor bold
- No paper texture, no tape, no decorations

### After (hand-drawn pilot — this commit)

Three captured states, live from `http://localhost:3000/m/yUtB160NlxBG3tSF`:

| State | Screenshot | Observation |
|---|---|---|
| **Clean** (input empty) | [design-audit/after/kid-join-handdrawn-clean.png](../../design-audit/after/kid-join-handdrawn-clean.png) | Card pinned to dotted paper with tape strip. Yellow post-it brand mark + red "Sleuth mission" tag. Kalam H1 wraps freely. Wobbly input + button. Button in muted "pressed flat" disabled state. |
| **Email blocked** (`john.doe@gmail.com`) | [design-audit/after/kid-join-handdrawn-email-blocked.png](../../design-audit/after/kid-join-handdrawn-email-blocked.png) | Input border + shadow flip to correction red. Post-it yellow warning notice with thick black border, hard offset shadow, red AlertCircle, friendly copy. Button stays disabled. |
| **Valid nickname** (`DragonHunter42`) | [design-audit/after/kid-join-handdrawn-valid.png](../../design-audit/after/kid-join-handdrawn-valid.png) | Warning gone. Input returns to pencil-black. CTA enables: white bg, thick black border, hard offset shadow, Kalam "Start mission" + Lucide arrow. Ready to click. |

Phone-blocked state follows the exact same pattern as email-blocked (same warning notice, different copy). The earlier pass's phone screenshot is still valid as a reference for that state's *visual logic*, only the styling layer changes here.

---

## Conscious deviations from the spec — and why

### 1. Geist sans body, not Patrick Hand

**Spec.** *"Body: Patrick Hand (wght 400) — Legible but distinctly handwritten."*
**Pilot.** Body, hint, topic, input value, and notices stay on Geist.
**Why.** [SCIENTIFIC_FOUNDATIONS.md §5.2 (Mayer Modality)](../design/SCIENTIFIC_FOUNDATIONS.md): "Sans-serif with open counters, clear letterforms" for primary-school learners. Patrick Hand body text in a reading-heavy stage (Stage 3 source previews, Stage 4 fact extraction) is a real legibility hit. Kid-join is *not* reading-heavy, so Patrick Hand body would probably be fine here — but the pilot is meant to model what the propagation would look like, and propagation hits the reading-heavy stages. So the harmonization is "Kalam headings + Geist body" project-wide.
**What you'd see by overriding.** Body text in handwriting feel, ~25% lower reading speed in classroom-tablet conditions (estimate; not measured). If the user wants to see this, swap is two lines: add Patrick Hand to `layout.tsx` and replace `font-sans` with `var(--font-patrick-hand)` in the relevant elements.

### 2. Kept Phosphor as a project dependency

**Spec.** *"Icons: lucide-react icons with stroke-width={2.5} or 3."*
**Pilot.** Lucide installed and used for kid-join. Phosphor not removed.
**Why.** The other surfaces (StageShell, Stages 1-5, complete page) still reference Phosphor from the [iconography pass](2026-05-24-iconography-pass.md). Removing Phosphor in this pilot would break them. If the pilot is approved and propagated, Phosphor can be dropped in the same commit that removes its last import.

### 3. Did not introduce a hover "jiggle"

**Spec.** *"Hover: 'Jiggle' effect. `hover:rotate-1` or `hover:-rotate-2`."*
**Pilot.** Card and button do not rotate on hover. Hover changes color + reduces shadow + translates 1-2px.
**Why.** Rotation on hover for a *card the kid is about to interact with* moves the interaction target unpredictably — bad for younger users with developing motor control. Spec calls for this on marketing cards (testimonials, feature blocks); a join CTA is a different surface. If the user wants it, one Tailwind class added.

### 4. No squiggly arrow next to the CTA

**Spec.** *"Hand-drawn arrow pointing to hero CTA with dashed path."*
**Pilot.** Skipped.
**Why.** The button is already the focal element on a small card (~28rem wide). Adding an arrow pointing at it would clutter the small-screen layout and only render on desktop per the spec's `hidden md:block` rule — pilot single-screen affordances should work consistently across breakpoints. Worth revisiting if/when we move to a wider hero surface like the landing page.

---

## What stays from prior passes

- **PII validation logic** ([previous pass](2026-05-24-kid-join-pii-validation.md)) — unchanged. `validateDisplayName()` still gates submit on `@` and `/\d{7,}/`. Visual treatment now matches hand-drawn style (post-it yellow warning, red border on input) but the logic is identical.
- **Stage 1 copy changes** ([research-aligned pass](2026-05-24-stage1-copy-research-aligned.md)) — unaffected. Stage shell + Stage 1 component not touched. So clicking the CTA still lands the kid on "Sharpen your question" with the SIFT-Stop loading copy.
- **Auth model + session shape** — unchanged.
- **SCIENTIFIC_FOUNDATIONS as the rubric** — unchanged; the harmonization choices above explicitly cite it.

---

## What needs deciding before propagating

The pilot intentionally scoped one screen so each of these is a separate decision, not a fait accompli:

1. **Typography commitment.** Stick with "Kalam headings + Geist body" everywhere, or push to full Patrick Hand body? The reading-heavy Stage 3 + Stage 4 are the deciding surfaces — kids spend the most time reading there.
2. **Color palette swap.** This pilot replaced amber → red on kid-join. If we propagate, every existing amber surface flips. That includes the StageShell progress bar, the badge chips, the Stage 1 CTAs from the research-aligned pass, the complete-page hero. Substantial commit.
3. **Brand mark coherence.** The yellow-post-it Search icon is the new mark *only on kid-join*. Stages still inherit the amber circle. If propagated, the StageShell needs a parallel hand-drawn mark.
4. **Teacher dashboard.** Out of pilot scope by design. The hand-drawn aesthetic on a dense professional dashboard (tables, metadata, action lists) would hurt usability for adult teachers. Recommendation regardless of pilot outcome: keep teacher screens on the existing amber + zinc + Geist system.
5. **Decorative density.** The pilot adds one tape strip + one post-it tag. Spec suggests thumbtacks, hand-drawn arrows, squiggly connectors, drop-caps. More decoration is more "spec-compliant" but also more cognitive load — kids will spend time looking at decoration instead of the task. Hold or add per surface.

---

## Verification

- **Compile.** `✓ Compiled in ~250ms` after each edit. `GET /m/yUtB160NlxBG3tSF → 200`.
- **Visual.** Captured three live states via `chrome-devtools-mcp`. Files linked above.
- **A11y snapshot.** The accessibility tree on the "Email blocked" state confirms `invalid="true"` on the input, `role="alert"` + `aria-live="assertive"` on the warning, button stays `disabled`. The hand-drawn styling did not break any of the a11y wiring from the previous pass.
- **Bundle impact.** Added `lucide-react` (~3-4 KB gzipped per used icon, tree-shaken) and Kalam (`next/font` self-hosts the woff2 from Google Fonts — one extra font file). Acceptable.

---

## Suggested next moves

1. **Look at the three screenshots side-by-side**, compare them to the [iconography-pass state](../changelog/2026-05-24-iconography-pass.md) (the pastel amber pill version), and decide:
   - "Keep this pilot, propagate to all kid surfaces" → I'll spec the next 4-5 commits (StageShell, each Stage, complete page).
   - "Keep this pilot, do *not* propagate yet" → ship it as a standalone "the join page is the entry" treatment and re-evaluate after a real kid sees it.
   - "Revert the pilot" → 1 commit, deletes `lucide-react` + Kalam + the new page version, restores the Phosphor / amber version.
   - "Try a variant" → tell me which axis to flex (more handwritten body, no tape, different mark, etc.) and I'll iterate.
2. **If propagating**, the order of operations that minimizes regression: StageShell (most-seen) → Stage 1 (next-most-seen) → Complete page (final delight) → Stages 2-5 (reading-heavy, do last so the typography decision is firm).
3. **Independent of pilot outcome**, port `validateDisplayName` to the server route per [prior pass §3](../changelog/2026-05-24-kid-join-pii-validation.md) — still recommended for the privacy promise to be enforced.
