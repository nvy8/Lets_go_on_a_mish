# Implementation log — kid-join: hero-mark revert + display-name PII validation

Date: 2026-05-24 (fourth pass of the day on the kid-join card)
Scope: two narrow changes to [app/m/[shareToken]/page.tsx](../../app/m/%5BshareToken%5D/page.tsx) only.
Status: shipped to working tree, not committed.

---

## 1. Revert: hero brand mark back to the iconography-pass styling

### Why

The v3 hero refinement (solid amber-gradient disc + zinc-950 bold icon + colored shadow + amber-100 halo) was rejected on visual review — judged "of poor quality". User instruction: *"revin-o doar pentru acest pas la versiunea anterioară a fișierului și stilului"*. So this pass undoes only the v3 hero change. The Phosphor icon system itself (introduced in the [iconography pass](2026-05-24-iconography-pass.md)) stays — that change was accepted.

### What was reverted

Both the hero mark on the join card and the parallel mark in the "Mission not found" empty state are now back to the iconography-pass treatment:

```tsx
// Hero (join card)
<div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 ring-1 ring-amber-200">
  <MagnifyingGlass size={32} weight="duotone" aria-hidden="true" />
</div>

// Mission-not-found (empty state)
<MagnifyingGlass size={40} weight="duotone" className="mx-auto text-amber-500" aria-hidden="true" />
```

### What was *not* reverted

- The Phosphor library (`@phosphor-icons/react`) stays as a project dependency.
- The `Eye` icon in the privacy notice and the `ArrowRight` in the CTA — both from the iconography pass — stay.
- The Stage 1 copy changes from the [research-aligned pass](2026-05-24-stage1-copy-research-aligned.md) — separate file, unaffected.

### Doc / asset cleanup

The v3 hero changelog file (`2026-05-24-kid-join-hero-mark-refinement.md`) and the v3 screenshot (`design-audit/after/kid-join-hero-2026-05-24-v3.png`) were deleted because they documented a state that no longer exists in the tree. The conversation history preserves the rationale that was attempted, in case a different direction wants to retry later.

---

## 2. New feature: PII validation on the display-name input

### Why

The privacy promise ("no last names, no emails") was a hint only — the form would happily accept `john.doe@gmail.com` and POST it straight to MongoDB. Per [docs/design/SCIENTIFIC_FOUNDATIONS.md §9 (Ethics, GDPR-K & child safety)](../design/SCIENTIFIC_FOUNDATIONS.md) and [docs/AUTHENTICATION.md §2](../AUTHENTICATION.md) ("No PII collected"), the system needs to enforce its own privacy promise, not just print it. The user's explicit ask was to block emails specifically: *"in caz ca pune emailul sa nu treaca la pasul următor"*.

### What was added

A pure function `validateDisplayName(value)` defined above the component:

```tsx
function validateDisplayName(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    return "That looks like an email. Pick a fun nickname — no real names, emails, or contact info.";
  }
  if (/\d{7,}/.test(trimmed)) {
    return "That looks like a phone number. Pick a fun nickname instead — no real contact info.";
  }
  return null;
}
```

Then in the component, derived state (no extra `useState`):

```tsx
const trimmedName = displayName.trim();
const nameWarning = validateDisplayName(displayName);
const canSubmit = !joining && trimmedName.length > 0 && !nameWarning;
```

Wiring on the form:

- **Input gets visual + a11y warning state:** `border-amber-400`, `aria-invalid="true"`, `aria-describedby="kid-display-name-warning"` when the warning is present (otherwise points to the privacy notice for context).
- **Inline notice appears between the input and the privacy notice:** amber-50 box with `border-amber-200`, `WarningCircle weight="bold"` icon in amber-600, `role="alert"` so screen readers announce it as the kid types.
- **Submit button is disabled** while `nameWarning` is non-null.
- **`join()` short-circuits early** with `if (!canSubmit) return` so even a programmatic POST (e.g. Enter key bypassing the disabled state) can't escape the check.
- **Trimmed name is sent to the API** — strips accidental leading/trailing whitespace.

### Detection rules — why these specific patterns

| Rule | Why |
|---|---|
| `value.includes("@")` | Bypasses the brittle "what is a valid email" regex problem entirely. `@` has **no legitimate use** in a display name — even false-positive cases (`BTSarmy@1`) are still names containing a non-conventional character that's worth deflecting. Catches `john@gmail.com`, `j@anything`, `@user`, every variation. |
| `/\d{7,}/` | Seven or more consecutive digits is the floor for any phone-number format (mobile, landline, with-without country code, with-without separators when the kid types them as a single block). A nickname like "Cool2014" passes (4 digits); a nickname like "Max123" passes (3 digits); a phone like `0721234567` or `15551234567` is caught. |

Both detections happen **client-side only.** This is a UX guard rail, not a security boundary — the route at [app/api/m/[shareToken]/join/route.ts](../../app/api/m/%5BshareToken%5D/join/route.ts) still accepts any string. A motivated kid (or a teacher testing) could bypass with `curl`. For a *server-side* hardening pass, the same `validateDisplayName` function should be ported to the route and rejected with 400. Worth a follow-up commit — flagged below.

### What this does *not* try to detect

Deliberately scoped to high-signal, low-false-positive patterns:

- ❌ Full names (capitalized word + capitalized word) — too many false positives ("Dragon Hunter" reads as Firstname Lastname).
- ❌ URLs — kids don't typically type `http://` into a name field; would add noise.
- ❌ Multi-language profanity — out of scope for this pass; word-list moderation is a different problem.
- ❌ Address-like patterns (street + number) — too brittle.

---

## Verification — captured screenshots

All three states captured live from `http://localhost:3000/m/yUtB160NlxBG3tSF` via `chrome-devtools-mcp`:

| State | Screenshot | Observed result |
|---|---|---|
| **Clean (input empty)** | [design-audit/after/kid-join-clean-2026-05-24.png](../../design-audit/after/kid-join-clean-2026-05-24.png) | Hero mark back to pastel-amber pill (v2 style). No warning. CTA disabled grey because input is empty. |
| **Email typed** (`john.doe@gmail.com`) | [design-audit/after/kid-join-email-blocked-2026-05-24.png](../../design-audit/after/kid-join-email-blocked-2026-05-24.png) | Input border turns amber. Amber warning notice appears: "That looks like an email. Pick a fun nickname — no real names, emails, or contact info." CTA stays disabled grey. A11y snapshot confirms `invalid="true"` + alert role. |
| **Phone typed** (`Max0721234567`) | [design-audit/after/kid-join-phone-blocked-2026-05-24.png](../../design-audit/after/kid-join-phone-blocked-2026-05-24.png) | Same amber border + warning treatment: "That looks like a phone number. Pick a fun nickname instead — no real contact info." CTA stays disabled. |
| **Valid nickname** (`DragonHunter42`) | [design-audit/after/kid-join-valid-nickname-2026-05-24.png](../../design-audit/after/kid-join-valid-nickname-2026-05-24.png) | Border returns to zinc. No warning. CTA enabled in amber-500. A11y snapshot confirms `invalid` attribute is gone. |

The accessibility tree confirms the warning is announced through `aria-live="assertive"` — important for screen-reader users who otherwise wouldn't know why the button stayed disabled.

---

## Suggested next moves

1. **Visually confirm** that the reverted hero mark is the styling you want (it should match exactly what shipped after the iconography pass — same softer pastel pill, smaller magnifier).
2. **Commit this pass** as a single commit (`Revert v3 hero refinement + add display-name PII validation`).
3. **Port `validateDisplayName` to the server route** ([app/api/m/[shareToken]/join/route.ts](../../app/api/m/%5BshareToken%5D/join/route.ts)) so the privacy guarantee is enforced regardless of client behavior. ~5-line change, same regex, return `400 { error: "Display name can't contain emails or phone numbers." }`. Worth doing before any release.
4. **Reconsider the hero mark direction.** The visual gap that motivated the v3 attempt (the pastel mark reading as weak) is still there. If you want a stronger mark, the options are: (a) keep the pastel pill but make the icon size 36-40 in the 64-px disc (just fill more space, no color change); (b) try a single-shade-darker pill (`bg-amber-200` with `text-amber-700`) for slightly more presence; (c) a custom SVG brand mark (separate effort). Happy to try any of these as a one-shot if you want.
