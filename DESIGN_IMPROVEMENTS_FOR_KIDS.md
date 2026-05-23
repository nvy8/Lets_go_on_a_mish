# Sleuth — Design improvements for primary-school learners (ages 6-15)

Source guidelines: [design-audit/kids-app-design-guidelines.md](design-audit/kids-app-design-guidelines.md)
Cross-referenced against: [DESIGN_REVIEW.md](DESIGN_REVIEW.md) (rendered audit at 5 viewports) and the current code on `dev-tudor`.
Status: **proposal only — no code changes pending an explicit go-ahead per file.**

---

## 0. How I read the guidelines against Sleuth

Two scoping decisions before any specific proposal:

1. **Kid surfaces vs. teacher surfaces.** The guidelines target children. They should **not** drive teacher-facing screens (`/teacher/*`), which are a tool for an adult professional and benefit from density. So the proposals below apply to the kid flow (`/m/[shareToken]/*`) and to mixed surfaces (landing page, complete page). Teacher surfaces get one note about consistency and that's it.

2. **Age band 6-15 is wide.** A 6-year-old and a 15-year-old want very different interfaces. The guidelines themselves draw the firmest line at "under 9" (2cm tap targets). Sleuth's README pitches 9-14, which is the realistic sweet spot. My recommendation: **design for ages 9-12 as the center, with affordances that don't penalize 6-8 year-olds** (bigger targets, plainer labels, supportive tone) **and don't infantilize 13-15 year-olds** (no cartoon mascots, no baby animations, keep the detective/investigation metaphor that's already there). Where a guideline is age-stratified I'll note both.

3. **Critical-thinking constraint.** You explicitly asked for animation, but not so much that it distracts from thinking. I'm holding motion to *confirm action* and *celebrate completion* — never to fill silence, never autoplay, never on the reading surfaces (Stages 3–5 specifically). `framer-motion` is already a dependency; nothing new to install.

4. **Brand preservation.** Sleuth's identity is amber + zinc + Geist + the magnifying-glass mark + the "friction" promise. The guidelines suggest "teal/blue/green primary" — I'm **not** recommending a brand swap. Instead I propose making amber work properly (contrast) and introducing a *single* trust-blue as a secondary semantic color for "verified/triangulated" states, which leaves the brand intact while gaining the calm trust signal the guidelines describe.

5. **Don't break anything.** Every proposal below preserves: the 6-stage gating, all API contracts, every existing component name, the share-link kid-join model, the PDF export. The changes are CSS, copy, sizing, and a few accessibility props — no logic, routing, or data-shape changes.

---

## 1. At-a-glance: guideline → Sleuth → proposal

| Guideline area | Today in Sleuth | Proposal | Effort |
|---|---|---|---|
| **Calm neutral base, one primary accent, restrained palette** | ✅ zinc neutral + amber accent. Already aligned. | Keep palette, fix the contrast of amber (see §2). | Tiny |
| **Medium-to-high contrast for body text and buttons** | ⚠️ White-on-amber-500 = **2.13:1**, amber-600 text on white = **3.20:1** | Re-token amber CTA so it passes WCAG AA. | Small |
| **Status colors visually distinct + paired with icon + label, not color alone** | ⚠️ Stage 6 uses green/red borders only | Add icons + labels to status surfaces. | Small |
| **Sans-serif with open counters, clear letterforms** | ✅ Geist (matches the guideline exactly) | Keep Geist; bump kid-screen sizes. | None for font |
| **Body around 20px for primary-school screens** | ⚠️ Kid screens use 16-18px | Bump kid-flow body to 18-20px. | Small |
| **Sentence case, not all caps** | ⚠️ "STAGE 1 OF 6", "BADGES EARNED", "RESEARCH QUESTION" all uppercased | Convert to sentence case in kid surfaces. | Tiny |
| **Plain labels above fields, not placeholder-only** | ❌ Kid join + teacher dashboard rely on placeholder text | Add visible labels in kid flow. | Small |
| **Tap targets 64-80px on kid surfaces; min 44-48px for older kids** | ⚠️ Most kid buttons are ~44-48px; Stage 4 source toggles are 36px | Up-size kid CTAs to ~64px, Stage 4 toggles to ≥48px. | Small |
| **Rounded corners, consistent scale (small / medium / large)** | ✅ Already 8/12/16/24/pill — well-structured | Keep. | None |
| **Supportive tone in errors, not blame-based** | ⚠️ Stage 4 reject pulses red toast "Hmm — that fact isn't in this source. Look again." (already friendly), but the *pulsing red button* reads punitive | Soften the pulse, keep the copy. | Tiny |
| **Notices: short, point-of-use, with icon + clear action** | ⚠️ Stage 1 error is bare red text with no action | Standardize an inline notice component. | Small |
| **Icons pair with labels; rounded, simple, large in cards** | ✅ Mostly there (emoji magnifier, trophy, etc.) | Codify emoji-vs-icon convention; replace emoji with an SVG mark only at the brand level (kept consistent). | Small |
| **Microinteractions confirm action; restrained celebration** | ⚠️ `framer-motion` installed but unused; Stage 4 has `animate-pulse` (too constant) | Introduce 3 microinteractions: button-tap, badge-earned, progress-fill. Remove the constant pulse. | Small-Medium |
| **One main goal per screen; 3-5 choices max** | ✅ Stages enforce this naturally | Keep. | None |
| **Inclusive imagery, not decorative** | n/a (no people imagery yet) | Optional: add quiet line-art "evidence stamps" for badges. | Optional |
| **High-privacy defaults, point-of-use notices, monitoring transparency** | ⚠️ Kid join asks for display name with a hint, no other privacy comm | Add a one-line "your teacher can see your work" notice on kid join. | Tiny |
| **File interactions: friendly labels, not raw filenames** | ⚠️ PDF saves as `Sleuth-Research-Brief-MaxR.pdf` (acceptable), but the on-screen Copy button on mission detail exposes the URL token | Already fine; document that URLs are technical (for teacher only). | None |

The pattern: **Sleuth's bones already align with the guidelines** (palette discipline, font choice, radius scale, one-goal screens, restrained imagery). The gaps are mostly contrast, size, and a few patterns (labels-not-placeholders, no-color-alone) that need codifying.

---

## 2. Color & contrast

### 2.1 Amber CTA — the most important fix

**Today.** Every kid-facing primary CTA — "Start mission" on join, every "Continue / I'm done / See my brief" at stage end, and "Download Research Brief" on the complete page — is `bg-amber-500 text-white`. White on `#fe9a00` is **2.13:1**, which fails WCAG AA for normal text (4.5:1 required) by a wide margin. In a sunlit classroom on a glossy tablet, a 9-year-old may genuinely miss the button.

**Proposal.** Keep amber as the brand accent. Change kid CTAs to **`bg-amber-500 text-zinc-950`** instead of white text. That single change gives ~11:1 contrast — passes AAA — and is more visually distinctive because it inverts the convention (dark text on bright pill = "this is the action"), which actually *increases* the call-to-action signal.

```diff
- bg-amber-500 text-white
+ bg-amber-500 text-zinc-950 font-bold
```

**Why this is better.**
- Guideline: "medium-to-high contrast for text and buttons."
- Stays inside the brand. The button stays amber. The kid still sees orange = "go".
- Costs one Tailwind utility per kid-facing button (~12 spots).
- Doesn't touch teacher-side dark CTAs (which are already 17.7:1).

**Argument against the alternative (going to `bg-amber-700`):** would also fix contrast (~5:1 with white) but darkens the brand toward brown — the joyful "discovery" feel is in the brightness of the amber-500. Dark-on-bright preserves the vibrancy.

### 2.2 Amber-600 text on white card — stage labels and headings

**Today.** "Stage 1 / Stage 2 / ..." in landing cards and in the stage shell uses `text-amber-600` (`#e17100`) on white card or near-white bg — **3.20:1**, fails AA for normal text.

**Proposal.** Two options, pick one:

- **Option A (conservative):** keep amber-600 but use it *only* on amber-tinted surfaces (`bg-amber-50` / `bg-amber-100`) where the color reads as decorative. On white card surfaces, switch label color to `text-zinc-900` and put the *number* in amber inside a small chip: `Stage <span class="text-amber-600 font-mono">1</span>`. The eye still gets the amber accent on the number, and the label is readable.

- **Option B (semantic):** introduce a secondary "trust" color from the guidelines (a single teal — `bg-teal-700 text-white` or `text-teal-700`) used **only** for *verified/triangulated* states, while amber stays for *in-progress / discovery*. This colors the pedagogy: amber = friction, teal = trust earned. The guidelines explicitly recommend teal/blue/green for trust signals.

**Why this is better.**
- Guideline: status colors visually distinct, color not the only signal.
- Option A is one-line CSS, zero new tokens.
- Option B is more ambitious but bakes the *teaching point* of the app (verified vs. unverified) into the color system. Worth doing once across the app rather than ad-hoc.

### 2.3 Status colors paired with icon + label (Stage 6 pick states)

**Today.** Stage 6 cards turn `border-green-400 bg-green-50` (correct) or `border-red-400 bg-red-50` (wrong picked) on reveal. The "kind" badge is shown after pick, but the *border-color state* is the immediate signal.

**Proposal.** Add a visible icon + word inside the card on reveal, not only on the small "kind" chip below:
- Correct: green border + a check-mark badge with "Correct ✓" text overlay.
- Wrong: red border + a thoughtful "Not this one" pill (not "Wrong!" — supportive, not punitive).

**Why this is better.**
- Guideline: "never rely on color alone."
- A color-blind kid sees the same signal as anyone else.
- Supportive copy on the wrong-pick aligns with "not blame-based."

### 2.4 Stage 4 "rejected click" — kill the constant pulse

**Today.** When a kid taps a fact-in-source button and the AI says "no, the fact isn't in this source", the button goes `bg-red-500 animate-pulse text-white` for 1.5 seconds. Combined with the red toast at the top, this reads as "you broke something."

**Proposal.** Replace `animate-pulse` with a single 250ms shake (a one-time wobble), keep the red, and change the icon from ✗ to a thinking-emoji ❔ for 1.5s before resetting. Toast copy stays — it's already kind.

**Why this is better.**
- Guideline: "supportive tone, not blame-based" + "microinteractions confirm action, not distract."
- A single shake says "try again", continuous pulse says "danger."
- Keeps Stage 4 — the hardest stage — from feeling punishing.

---

## 3. Typography

### 3.1 Bigger body on kid screens

**Today.** Kid surfaces use `text-base` (16px) for the StageShell topic line, `text-sm` (14px) for the badge chips, and `text-lg` (18px) for some lead paragraphs. Guideline target for primary school is **~20px body**.

**Proposal.** Bump kid-flow surfaces to one step larger:

| Element | Today | Proposed (kid surfaces only) |
|---|---|---|
| Stage page intro paragraph | `text-base` (16px) | `text-lg` (18px) |
| Stage card body copy ("How to play", instructions) | `text-sm` / `text-base` | `text-base` / `text-lg` |
| Badge chip in StageShell | `text-xs` (12px) | `text-sm` (14px) |
| Stage shell topic line | `text-sm` | `text-base` |
| Stage shell mission title (top right) | `text-xs font-mono` | `text-sm` (and **drop mono** — see §3.2) |
| Kid join name input | `text-lg` (already) | Keep |

**Why this is better.**
- Guideline: ~20px body for primary school learners.
- A 16→18px bump on the topic line and a 12→14px on the badge chip is unobtrusive — neither breaks the StageShell layout because the container `max-w-5xl` has slack.
- Teacher surfaces untouched.

### 3.2 Drop mono on mission title in StageShell

**Today.** `<div className="font-mono">{missionTitle}</div>` in the top-right of every stage page. Reads as system output, not a human title. On iPad portrait it visually competes with the topic on the left.

**Proposal.** Change to `text-sm text-zinc-700` (no mono). Keep `font-mono` only where it genuinely conveys "structured/system" — e.g. the share URL on mission detail.

**Why this is better.**
- Guideline: "friendly but simple shapes, not decorative or highly stylized." Mono on running text qualifies as stylized in a way that hurts legibility.
- Removes one of the two visual personalities competing on every stage screen.

### 3.3 Sentence case the labels

**Today.** "STAGE 1 OF 6", "BADGES EARNED", "RESEARCH QUESTION", "0 VERIFIED FACTS", "SOURCES" — all `uppercase tracking-wide`.

**Proposal.** Convert to sentence case in kid-facing screens: "Stage 1 of 6", "Badges earned", "Research question", "Verified facts", "Sources". Keep the small-caps *visual rank* by using `text-xs font-semibold tracking-wide text-amber-700` instead of upper-casing.

**Why this is better.**
- Guideline: "Use sentence case rather than all caps because all-uppercase text reduces readability." That's the explicit recommendation from the file you shared.
- Sentence case is also more inviting — uppercase reads as "system label", sentence case as "your label".

### 3.4 Don't change the font

**Argument for keeping Geist:** The guideline asks for "Sans-serif, friendly but simple shapes, moderate stroke contrast, clear ascenders and descenders." Geist meets all four. Swapping to something more overtly "kiddie" (Nunito, Comic Neue, Atkinson Hyperlegible) would alienate the 13-15 segment and break the brand. Geist scales gracefully across ages.

The one exception worth considering: **embed Geist in the PDF export** so the kid's "Research Brief" deliverable looks like the on-screen experience instead of helvetica. Currently the deliverable handed to a parent is off-brand (see DESIGN_REVIEW.md §F5). Argument: a kid's name on a polished, branded artifact is part of the reward of the 6-stage journey.

---

## 4. Forms & inputs

### 4.1 Labels above fields, not placeholder-only

**Today.** Kid join uses a label *above* the field for "Pick a display name (no last names, no emails)" — already correct. But teacher dashboard, login, and the create-mission form use placeholder text only. Inside the kid flow itself, Stage 1 and Stage 5 use placeholders on the textarea.

**Proposal (kid surfaces).** Stage 1 draft textarea and Stage 5 explanation textarea both need a visible label above the field, kept on screen while typing. Placeholder text disappears the moment a kid starts typing — and a kid who hesitates is exactly who needs the prompt to stay.

```diff
- <textarea placeholder="Type your research question here..." />
+ <label className="text-base font-semibold text-zinc-700">
+   Your research question
+ </label>
+ <textarea placeholder="Type it here…" aria-label="Your research question" />
```

**Why this is better.**
- Guideline: "Use plain labels above fields rather than placeholder-only inputs so instructions remain visible."
- Hits accessibility (screen readers + autofill) and works in classroom-noisy / interrupted typing.
- Doesn't change the API or component contracts at all.

### 4.2 Tap target up-size for kids

**Today.** Stage 4 source-toggle buttons are `h-9 w-9` (36px). Stage 6 option cards are full-width and tall (fine). Stage 1 / 2 / 3 selection cards are roomy (fine). Primary CTAs are `py-3` (~48px tall).

**Proposal (kid surfaces).**
- Stage 4 fact-source toggle: `h-12 w-12` (48px) minimum. Add `gap-3` between buttons to avoid accidental taps.
- Primary CTAs across all kid stages: `py-4 text-lg` (~64px tall, larger text).
- "Lock in & reveal →" (Stage 6) is currently `bg-zinc-900 py-2.5 text-sm` — should match the kid CTA scale.

**Why this is better.**
- Guideline: under-9s need ~64-80px targets; older kids tolerate 44-48px. By centering on 48-64px we cover the 6-15 range without making the UI cartoonish for older students.
- Stage 4 is the highest-stakes tap surface (50+ taps per kid) — under-sized buttons there cause the highest accidental-tap rate.
- Teacher surfaces stay compact (`py-2.5`), preserving density.

### 4.3 Disabled CTA visibly disabled

**Today.** Disabled primary CTA is the amber pill at `opacity-50`. Reads as faded-enabled, not disabled (see DESIGN_REVIEW.md §C8 and the kid-join screenshot at [design-audit/05-kid-join-iphone14-390.png](design-audit/05-kid-join-iphone14-390.png)).

**Proposal.**
```diff
- disabled:opacity-50
+ disabled:bg-zinc-200 disabled:text-zinc-400 disabled:cursor-not-allowed
```

**Why this is better.**
- Guideline: "obvious selected states" and "instant feedback."
- The current pastel-orange state silently invites taps that do nothing — a confusing feedback loop for a 9-year-old.
- Bonus: shifts color (orange→grey) signals "not your turn yet" without text.

---

## 5. Notices & feedback

### 5.1 Standardize a "kid notice" component

**Today.** Different kinds of inline messages each look different:
- Stage 1 error: bare red text "Failed to load examples. Refresh the page." (no icon, no card)
- Stage 4 toast: red bg, white text, top-center, auto-dismissing
- Stage 3 / 5 feedback: framed amber/green card
- "How to play" instruction: amber-50 callout

**Proposal.** Define one `<KidNotice tone="info|success|warning|error|guidance">` component, used everywhere:

```
[icon]  Short, specific sentence.
        [Optional action button]
```

- **Tone → color + icon mapping:**
  - info → blue/teal + 💡
  - success → green + ✓
  - warning → amber + ⚠ (also the "needs an adult" cases)
  - error → red + 🤔 (use a *thinking* face for kid errors, not ✗)
  - guidance → amber + 🔍

**Why this is better.**
- Guideline: "Keep notices bite-sized and attached to the moment they matter" + "Pair notice text with icon, color, and simple action buttons."
- Replaces 4+ ad-hoc patterns with one. Stage 1's bare-red-text becomes a friendly error notice with a "Try again" button.
- Maps naturally to the guideline's "Good notice categories" list (success / guidance / warning / privacy).

### 5.2 Privacy notice on kid join

**Today.** Kid join asks for a display name and warns "(no last names, no emails)" — already good. But nowhere does it say what the teacher will see.

**Proposal.** Add one line under the input:
> 👀 Your teacher will see your name and your work on this mission.

**Why this is better.**
- Guideline: "Age-appropriate explanations when parental or teacher monitoring exists" + "Pair notice with icon."
- Transparency is required by the child-rights-by-design guidance, and saying it plainly is also reassuring rather than scary.
- One line. Zero functional change.

### 5.3 Supportive copy review

**Today.** Most micro-copy is already kid-friendly ("Your coach is reading…", "Nice eye!", "Almost — look again"). A few outliers:
- Stage 1 error: "Failed to load examples. Refresh the page." → too clinical.
- Stage 6 "Spot the FAKE!" → fine in tone, but the all-caps "FAKE" + "🤖❌ Both" chip might read mocking. Soften to "Spot the fake".

**Proposal.** Pass over the strings. No logic touched.

---

## 6. Icons & visual language

### 6.1 Codify emoji-vs-icon convention

**Today.** Sleuth uses emoji extensively (🔍, 🏅, 🎯, 📌, 📖, ✨, 🕵️, 🏆) — they're warm and brand-aligned. But emoji rendering varies across platforms (Windows = Segoe UI Emoji, iPad = Apple Color Emoji, etc.), so the brand "feel" shifts between devices.

**Proposal.** Pick **one** primary brand mark (the magnifying glass) and ship it as an inline SVG with the project's amber-500 / zinc-950 colors baked in. Use SVG for: the logo mark, badge stamps (🏅 → custom badge SVG), the progress check (🎯). Keep emoji for *expressive* moments only: "Nice eye!", "Hmm…", "Trophy on the complete page" — the moments where the kid's emotional reaction is the point.

**Why this is better.**
- Guideline: "Use simple, rounded icon shapes with consistent stroke width."
- Consistent brand mark across devices/exports — the PDF brief currently can't even render emoji.
- Keeps the warmth (emoji on emotional beats) without the inconsistency (emoji on structural marks).

### 6.2 Badge stamps — small interactive detail

**Today.** Earned badges render as `🏅 Badge Name` pills. Functional, but underwhelming for a 6-stage achievement system.

**Proposal.** Five custom flat SVG "evidence stamps" (one per badge) in a single consistent illustration style — outlined, two-color (zinc-950 + amber-500), 48px on the StageShell, 96px on the complete page. Treat them like the actual badges from a passport/scout book.

**Why this is better.**
- Guideline: "Reward learning progress with restrained celebration such as stars, stamps, or short success bursts."
- Stamps map exactly to the detective/investigation metaphor the README leans on.
- One artifact a kid would actually want to screenshot and show their parent.

**Argument against more decoration:** the guidelines warn that "playful typography often harms legibility" and that recurring mascots can become distractions. Hard "no" to a Sleuth mascot. The detective theme works because it's *about* the work, not a character commenting on the work.

---

## 7. Motion & feedback (your "some but not excessive" line)

**Today.** `framer-motion` is in `package.json` but unused. The only motion is `animate-pulse` on Stage 4 rejected clicks (already flagged as too constant) and CSS `transition-all` on hover states.

**Proposal.** Add exactly **four** microinteractions, no more. Each is short (<400ms), single-shot (no loops), and respects `prefers-reduced-motion`.

| # | Where | Animation | Duration | Why |
|---|---|---|---|---|
| M1 | Primary CTA on tap | Quick scale 1.0 → 0.96 → 1.0 | 150ms | Confirms tap before the network round-trip starts. Guideline: "show instant feedback after each action." |
| M2 | Progress bar in StageShell on stage advance | Width animates from old % to new % | 350ms ease-out | Reinforces "you finished one, you're closer." Guideline: "visible progress cues." |
| M3 | Badge earned (Stage 3/4/5/6) | Stamp drops in with a small bounce + a single ✨ burst (3 particles, fade in 250ms, out 400ms) | 650ms total, one-shot | Guideline: "restrained celebration such as stars, stamps, or short success bursts." Critical: **no looping, no autoplay, no second-time-replay**. |
| M4 | Stage 4 rejected fact-click | Single horizontal shake | 250ms | Replaces the current 1500ms `animate-pulse`. Guideline: "microinteractions confirm action, not distract." |

**What I'm explicitly NOT recommending:**
- ❌ Page-load fades, route transitions, hero scroll effects — all distract from the reading.
- ❌ Animated background gradients or particles outside the badge moment.
- ❌ A talking/blinking mascot.
- ❌ Stage 6 reveal flash. The reveal is a thinking moment; a celebration there short-circuits the "actually, look at why the fakes are wrong" reading.
- ❌ Autoplay anything. Guideline explicitly warns about autoplay + reward loops as dark patterns.

**Why this restraint is better than more.**
- The product's pedagogical claim is "research with friction" — kids who associate the screen with quick dopamine instead of careful thinking are not going to learn the thing the app teaches.
- Four moments of motion is enough to make the app feel alive without competing with the stage content.
- Respects `prefers-reduced-motion` is one CSS query — costs nothing, helps kids with vestibular sensitivity (more common than usually assumed).

---

## 8. Navigation & screen structure

### 8.1 One main goal per screen — already aligned

The 6-stage gating naturally enforces "one main goal per screen." Don't add more. Don't introduce a hub view that shows all 6 stages at once — it would invite skipping (also discussed in CODE_REVIEW.md §8).

### 8.2 Visible progress

**Today.** Progress bar in StageShell + "Stage X of 6" label. Already aligned.

**Proposal.** Show the **5 earned badges so far** as faint stamps even before they're earned — greyscale, low-opacity outlines — so kids see what's coming. Earning a badge flips it to color. Guideline: "Clear progress indicators."

**Why this is better.**
- Anticipation is a quiet motivator without being a dark pattern.
- Avoids the "wait, are there more?" surprise at the end.

### 8.3 Reusable controls

**Today.** Mostly consistent (back/next pattern, advance button at bottom-right). Stage 6's "Lock in & reveal → / Next fact → / See my final brief →" sequence is a small inconsistency in button copy that's actually a feature (each one names what's next).

**Proposal.** Keep. Guideline says "reusable patterns" — the *placement* and *role* are reusable, the *copy* changes per stage, which is correct.

---

## 9. Safety & privacy

These all fall out of the guideline file's child-rights section. Most are already partial:

| # | Today | Proposal |
|---|---|---|
| S1 | Kids identify with display name, no PII collected | ✅ Already aligned. Keep this guard rail in any future change. |
| S2 | Session cookie 1-day TTL | ✅ Aligned. |
| S3 | No third-party scripts or trackers visible | ✅ Aligned. |
| S4 | No notice that teacher can see kid's work | ❌ Add (see §5.2). |
| S5 | No "report a problem / ask for help" mechanism on kid screens | ⚠️ Add a small "Need help? Ask your teacher." link in StageShell footer. Guideline: "Prominent tools to report problems or ask for help." |
| S6 | No autoplay, no engagement notifications, no rewards-for-time-spent | ✅ Aligned and worth keeping a hard rule. |

---

## 10. What this does NOT change (deliberately)

Anchoring this so future edits don't drift:

1. **Brand identity.** Amber stays primary. Zinc stays neutral. Geist stays the font. Magnifying glass stays the mark.
2. **6-stage gated logic.** Untouched.
3. **API contracts.** Untouched.
4. **PDF export structure.** Only proposing a font embed for brand match (§3.4).
5. **Teacher dashboard density.** Teacher surfaces are tools for adults; the kid guidelines do not apply there.
6. **"Friction" pedagogy.** Every motion / celebration recommendation above is single-shot, post-action, and never trains the kid to expect reward for clicking quickly.
7. **No mascot, no avatar selection, no in-app currency, no streaks, no leaderboards.** Guideline explicitly warns against dark patterns and engagement-extending features; the README explicitly puts these out of scope.

---

## 11. Suggested implementation order

If/when you say go, this order minimizes regression risk and maximizes user-visible impact:

1. **§2.1 (amber CTA contrast).** One Tailwind change per kid CTA. Largest single accessibility + readability win. No layout impact.
2. **§4.3 (disabled state).** Same kind of change. Fixes the "looks tappable but isn't" confusion.
3. **§3.3 (sentence case) + §3.2 (drop mono on mission title).** Pure CSS / copy changes. No layout impact.
4. **§4.1 (labels above fields) + §5.2 (privacy notice on join).** Small JSX additions. No state changes.
5. **§4.2 (tap target up-size on kid surfaces).** CSS only, but check the Stage 4 sidebar layout doesn't overflow on 390px.
6. **§5.1 (standardize KidNotice component).** First real component refactor — touches Stage 1, Stage 4 toast, and a few inline messages.
7. **§3.1 (kid-screen body sizes).** CSS only, but check the StageShell header doesn't wrap awkwardly at 390px after the bump.
8. **§2.3 + §2.4 (status colors with icon/label + kill pulse).** Stage 6 and Stage 4 small JSX changes.
9. **§7 (four microinteractions).** Introduces `framer-motion` usage. Worth doing as one focused commit with the `prefers-reduced-motion` guard.
10. **§6.2 (badge SVG stamps).** Needs design work first — five SVGs. Highest-effort item; do last.
11. **§3.4 (Geist in PDF).** Optional polish; do only after the on-screen work lands.

---

## 12. Argument summary — why this is "better" rather than "different"

Each proposal earns its place by one of three tests:

- **WCAG / a11y test:** does it fix a measurable failure? (§2.1, §2.3, §4.3 — yes, with numbers from the rendered audit.)
- **Guideline test:** does the design-guidelines file explicitly recommend it? (§3.1, §3.3, §4.1, §4.2, §5.1, §6.1, §7 — yes, with citations.)
- **Pedagogy test:** does it support or *at minimum* not undermine the "research with friction" learning goal? (§7's restraint is the strongest example — refusing motion where it would teach the wrong lesson.)

Nothing above is proposed for novelty. Every change either fixes a measurable problem, follows an evidence-based guideline you shared, or aligns the design with the educational claim the README makes.

The combined effect: Sleuth becomes legitimately usable by a 9-year-old in a classroom — bigger touch targets, readable text, supportive feedback, transparent privacy — without losing the calm, considered design that distinguishes it from the over-stimulated edutainment apps the guidelines explicitly warn against.

---

## What I'd like from you before any code changes

Per the working agreement, I won't touch a single file until you give the explicit go-ahead. When you're ready, the simplest way to proceed is to pick a section number (e.g., "do §2.1 and §4.3") and I'll implement just those, in a single commit, with the dev server up so we can verify visually before committing.
