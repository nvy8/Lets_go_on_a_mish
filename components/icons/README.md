# Inline SVG icon components

Use this folder when an SVG needs to **take color from its surrounding text** (Tailwind `text-amber-500`, `text-zinc-950`, etc.) or change between two states (locked vs earned badge).

## Convention

One file per icon, named `PascalCase.tsx`, exporting a single named component:

```tsx
// components/icons/MagnifyingGlass.tsx
type Props = React.SVGProps<SVGSVGElement>;

export function MagnifyingGlass(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
```

Then use it anywhere:

```tsx
import { MagnifyingGlass } from "@/components/icons/MagnifyingGlass";

<MagnifyingGlass className="h-6 w-6 text-amber-500" />
```

The `text-amber-500` flows into `stroke="currentColor"` / `fill="currentColor"` and re-colors the icon. Same component, any color, any size — driven by Tailwind.

## How to convert a designer SVG into a component

1. Open the `.svg` in a text editor.
2. Copy the contents of the `<svg>...</svg>` element.
3. Paste into a new `Foo.tsx` here, wrap as a React component (see template above).
4. Replace any hardcoded color values (`fill="#000"`, `stroke="#fea500"`) with `currentColor` for parts that should be theme-driven. Leave the brand-colored parts of badges alone — they're meant to stay amber/zinc.
5. Replace any `class=` with `className=`, lowercase the SVG attribute names that React requires camelCase (`stroke-width` → `strokeWidth`, `stroke-linecap` → `strokeLinecap`, etc.). React will warn about any you miss.
6. Add `aria-hidden="true"` if the icon is decorative (next to a text label), or an `aria-label` if the icon is the only label.
7. Spread `{...props}` last so callers can add `className`, `onClick`, `width`, etc.

## When NOT to inline

- The SVG is large (>3 KB) and used only once → keep it in `/public/svg/illustrations/` and `<img>` it. Bloating the HTML payload costs more than the extra network request.
- The SVG is a complex multi-layer illustration that won't recolor (e.g., the trophy emoji replacement) → keep in `/public/svg/` and `<img>` it.

## Naming

`PascalCase.tsx` with the exported component matching the filename. Examples: `MagnifyingGlass.tsx`, `BadgeUrlDetective.tsx`, `ChevronRight.tsx`.
