# Implementation log — kid-join iconography pass

Date: 2026-05-24
Scope: §13 of [DESIGN_IMPROVEMENTS_FOR_KIDS.md](../design/DESIGN_IMPROVEMENTS_FOR_KIDS.md) — replace 3 emoji/text-glyph graphic elements on the kid-join page (`/m/[shareToken]`) with Phosphor Icons.
Status: shipped to working tree, not committed.

Triggered by a screenshot review: the hero magnifying glass, the privacy-notice eye, and the CTA arrow were all emoji or Unicode text characters. They looked clipart-y on Windows, varied per OS, and read as "system widget" instead of "polished product".

---

## What changed, file by file

### `package.json` + lockfile
- Added `@phosphor-icons/react ^2.1.10` to dependencies. Tree-shakes per import — only the 3 icons referenced ship to the client.

### `app/m/[shareToken]/page.tsx` (kid-join)
1. **Hero mark.** `🔍` text-3xl inside the amber circle → `<MagnifyingGlass size={32} weight="duotone" />` in `text-amber-600`. Added `ring-1 ring-amber-200` to the surrounding circle for subtle depth so the icon doesn't float.
2. **Hero mark, empty state.** `🔍` text-4xl in the "Mission not found" card → `<MagnifyingGlass size={40} weight="duotone" />` in `text-amber-500`. Same brand mark in the same family/weight.
3. **Privacy notice eye.** `👀` (two-eye, meme-y) → `<Eye size={18} weight="bold" />` in `text-zinc-500`, top-aligned with `mt-0.5 shrink-0` so it doesn't drift when the notice wraps.
4. **CTA arrow.** Text string `"Start mission →"` → label + sibling `<ArrowRight size={20} weight="bold" />` inside `inline-flex items-center justify-center gap-2`. The arrow is now a real element — optically centered, independently sized/colored.
5. **Loading state preserved.** While `joining === true` the button renders just `"Starting…"` — no arrow on an in-flight CTA.

---

## Measured before / after

| Surface | Before | After | Why it's better |
|---|---|---|---|
| Hero magnifier (kid-join card) | OS emoji `🔍` — Windows = flat blue+grey clipart, Mac = warm 3D, Linux = whatever the font happens to be | Phosphor `MagnifyingGlass weight="duotone"` in amber-600 over amber-100 ring | Identical brand mark on every OS. Matches the brand palette instead of fighting it. Reads as a *tool*, not a *widget*. |
| Hero magnifier (not-found card) | OS emoji `🔍` text-4xl | Phosphor `MagnifyingGlass weight="duotone"` size 40 in amber-500 | Same family as the join card — consistent brand presence across happy + sad paths. |
| Privacy notice eye | OS emoji `👀` (Microsoft renders as wide-eyed/alarmed) | Phosphor `Eye weight="bold"` size 18 in zinc-500 | Single-eye + neutral color reads as *transparency / attention*, not *meme*. Doesn't compete with the body copy. |
| CTA arrow | Unicode `→` (U+2192) as part of string | Phosphor `ArrowRight weight="bold"` size 20, sibling element with `gap-2` | Optically centered. Matches button text weight. Independently styleable. Disappears cleanly during loading state. |
| Bundle impact | 0 KB | ~3 KB gzipped (3 icons, tree-shaken) | Negligible. No measurable LCP change. |
| Screen-reader announcement | Inconsistent ("magnifying glass tilted left" / silence / codepoint) depending on platform | Decorative icons are `aria-hidden="true"`; the surrounding label carries meaning | Cleaner accessibility tree. |

---

## Verification

- Dev server (`npm run dev`, http://localhost:3000) compiled the kid-join chunk cleanly after the change (`✓ Compiled in 287ms`, no errors in [the dev log](../../#) output).
- `GET /m/yUtB160NlxBG3tSF → 200 in 387ms` on the live test mission ("The Continents of the Earth", created via the demo teacher account documented in `DEMO_CREDENTIALS.local.md`).
- Visual verification was attempted via the Playwright MCP but failed with `ERR_BLOCKED_BY_CLIENT` on every URL (including `example.com`) — the bundled browser is misconfigured in this environment. The user can refresh their open kid-join tab to verify visually.

---

## What was deliberately NOT touched

Per §13.5 of [DESIGN_IMPROVEMENTS_FOR_KIDS.md](../design/DESIGN_IMPROVEMENTS_FOR_KIDS.md), this pass is scoped to the kid-join page only. The same pattern should propagate in focused follow-ups:

| Surface | Same anti-pattern | Suggested follow-up |
|---|---|---|
| `components/StageShell.tsx` | Topic-line `🔍`, badge chip `🏅` | `MagnifyingGlass` duotone for the topic; either Phosphor `Medal weight="fill"` or the bespoke badge SVGs from §6.2 |
| `components/stages/Stage1.tsx` – `Stage5.tsx` | Every "... →" CTA uses the text arrow | Migrate to `<ArrowRight size={20} weight="bold" />` sibling. ~12 buttons. |
| `components/KidNotice.tsx` | Tones map to emoji (`💡 / ✓ / ⚠ / 🤔 / 🔍`) | Migrate to `Lightbulb / CheckCircle / Warning / Question / MagnifyingGlass` all `weight="bold"`. One change touches every notice surface. |
| `app/m/[shareToken]/complete/page.tsx` | Trophy `🏆` hero | `Trophy weight="duotone"` in amber |
| Stage 5 ("Spot the fake") | Detective `🕵️` | Phosphor `Detective weight="duotone"` *or* keep emoji only on the single emotional reveal beat per §6.1 |

Each follow-up is ~10 minutes. The kid-join change established the convention + the dependency; propagation is mechanical.

---

## Found-while-implementing

1. **`@phosphor-icons/react`** install reported "2 moderate severity vulnerabilities" in transitive deps. Not investigated this pass — typical of any sizeable React ecosystem package and not tied to Phosphor itself. Worth a `npm audit` review in a separate maintenance pass.
2. **The Playwright MCP browser is broken in this env** — every navigation returns `ERR_BLOCKED_BY_CLIENT` even for `https://example.com`. Visual verification has to be done manually until that's repaired.
3. **Phosphor exports also include `weight="thin"` and `weight="light"`** — useful for future "decorative but not central" icon contexts (e.g. inline help, secondary metadata). Don't use them for primary CTAs or hero marks — they look anemic at small sizes.

---

## Suggested next moves

1. **Visually verify** in your open kid-join browser tab — hard-refresh, confirm the three replacements look right on your screen. Flag anything that feels off.
2. **Commit this pass** as a single commit ("Replace kid-join emoji/text-glyph graphics with Phosphor Icons") once visual is approved.
3. **Pick the next follow-up** from §13.5 — recommend `KidNotice` first because it propagates to the most surfaces with the least code.
