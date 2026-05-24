# SVG assets

> **⚠️ Read [ATTRIBUTIONS.md](../../docs/ATTRIBUTIONS.md) before shipping.** Some files under [`illustrations/`](illustrations/) originated from third-party sources whose license has not been verified for production use. They are retained for local development only and must be reviewed (replaced or re-licensed) before any public release.

Static SVGs served from `/svg/...`. Reference them from any component or page:

```tsx
<img src="/svg/brand/magnifier.svg" alt="" className="h-10 w-10" />
```

Or with `next/image` (needs `dangerouslyAllowSVG: true` in `next.config.ts` — only enable if all SVGs in `/public/` are trusted; we author ours, so it's fine):

```tsx
import Image from "next/image";
<Image src="/svg/brand/magnifier.svg" alt="" width={40} height={40} />
```

## Folder roles (what goes where)

| Folder | Role | Examples |
|---|---|---|
| `brand/` | Logo, primary brand mark, app icon. **One per surface, used everywhere.** | `magnifier.svg`, mascot files |
| `badges/` | The achievement stamps shown in the StageShell + complete page. Two-color: zinc-950 + amber-500. | `query-designer.svg`, `url-detective.svg`, `triangulator.svg`, `wordsmith.svg`, `hallucination-hunter.svg` |
| `icons/` | Functional pictograms for buttons, status chips, KidNotice tones. Should usually have no baked-in fill (uses `currentColor`) so they can take any text color. | `check.svg`, `cross.svg`, `info.svg`, `eye.svg`, `chevron-right.svg` |
| `illustrations/` | Larger decorative scenes — empty states, loading placeholders, complete-page hero. **Use sparingly per the kid-app guidelines** (illustrations should support comprehension, not distract). See [ATTRIBUTIONS.md](../../docs/ATTRIBUTIONS.md) for sourcing + license status of every file here. | `kid-brainstorming.svg`, `kid-study.svg`, `kid-performing.svg` |

## Choosing a slot for a new SVG

- One symbol, used as a button glyph or inline with text → **`icons/`**, and strip fixed `fill` attributes so it can inherit color.
- A unique stamp that represents an earned achievement → **`badges/`**, keep the colors baked in (matches the brand).
- The product identity itself → **`brand/`**.
- Anything else that's mostly decorative → **`illustrations/`**.

## When to convert to an inline React component instead

If you need dynamic color (e.g., the badge has to be greyscale when locked and amber when earned), put the SVG in [`components/icons/`](../../components/icons/) as a `.tsx` component instead of a static file. See `components/icons/README.md` for the convention.

## Naming conventions

- `kebab-case.svg` — never spaces, never CamelCase.
- Describe what it is, not how it's used: `magnifier.svg`, not `header-logo.svg`.
- Add a size suffix only when multiple sizes exist as separate files: `badge-small.svg`, `badge-large.svg`. Otherwise rely on CSS `width`/`height` to scale.
- Prefer SVGs without a fixed `width`/`height` on the root `<svg>` — set the `viewBox` and let CSS size it.

## Optimisation

Before committing, run any new SVG through [SVGOMG](https://jakearchibald.github.io/svgomg/) or `npx svgo path/to/file.svg`. Targets:

- Remove editor metadata (Sketch, Figma, Illustrator tags)
- Collapse groups when possible
- Round numeric precision to 2 decimals
- Keep `viewBox`, drop hard-coded `width`/`height`
- Strip `fill="#xxxxxx"` from icons that should inherit text color, OR change to `fill="currentColor"`

A clean icon is typically 200–600 bytes after optimization.
