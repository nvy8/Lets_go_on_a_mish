# Third-party asset attributions

This file lists third-party assets used in Sleuth, their original source, and the **current licensing status**.

---

## ⚠️ Blush illustrations — license currently NOT in place

**Where they live:** [public/svg/illustrations/](../public/svg/illustrations/)

**Files in active use:**

| File | Original collection | Used in |
|---|---|---|
| `kid-brainstorming.svg` | "Cool Kids" by [Vijay Verma](https://blush.design/artists/vijay-verma) on [blush.design](https://blush.design/) | Stage 1 loading state ([components/stages/Stage1.tsx](../components/stages/Stage1.tsx)) |
| `kid-study.svg` | "Cool Kids" by Vijay Verma on blush.design | Stage 2 and Stage 3 loading states ([components/stages/Stage2.tsx](../components/stages/Stage2.tsx), [Stage3.tsx](../components/stages/Stage3.tsx)) |
| `kid-high-tech.svg` | "Cool Kids" by Vijay Verma on blush.design | Stage 5 loading state ([components/stages/Stage5.tsx](../components/stages/Stage5.tsx)) |
| `kid-performing.svg` | "Cool Kids" by Vijay Verma on blush.design | Complete page hero ([app/m/[shareToken]/complete/page.tsx](../app/m/[shareToken]/complete/page.tsx)) |
| `kid-feedback.svg` | "Cool Kids" by Vijay Verma on blush.design | Not currently rendered. Kept for future use. |

The full "Cool Kids" set and 30+ other collections downloaded from blush.design are kept in subfolders of [public/svg/illustrations/](../public/svg/illustrations/) (e.g. `#12 Cool Kids/`). **These are not currently referenced by the app** but are checked in for future selection.

### License situation

These assets were originally downloaded by the Sleuth team **under a paid blush.design license that has since lapsed**. blush.design's commercial license requires an active subscription for any commercial deployment of the artwork; the license terms also vary per artist/collection.

**This means:**

- ✅ **Local development and hackathon-demo use** of these illustrations is acceptable while we evaluate whether to re-license or replace.
- ❌ **Production deployment, public marketing, or any commercial release of Sleuth must not happen with these assets in place** until one of the following is true:
  - The blush.design subscription is reactivated and the current license terms cover educational / commercial use of these collections, **or**
  - The illustrations are replaced with permissively-licensed equivalents (e.g. [unDraw](https://undraw.co/) — MIT-equivalent, [Open Doodles](https://www.opendoodles.com/) — CC0, [Open Peeps](https://www.openpeeps.com/) — CC0 [also already included in the illustrations folder]).

### Recommended path before launch

1. **Decide:** re-license vs. replace. If unsure, replace — it removes recurring cost and license-renewal admin.
2. **If replacing:** Open Doodles and Open Peeps (already in [public/svg/illustrations/](../public/svg/illustrations/) at `#28 Open Doodles/` and `#15 Open Peeps/`) are CC0 — public domain equivalent. Drop-in safe. The Cool Kids style is more polished, but Open Doodles/Open Peeps are functionally interchangeable for the loading + complete-page use cases here.
3. **If re-licensing:** verify the current blush.design Pro plan still includes these specific artist collections — blush's catalog has been re-organized over time and a few collections moved to per-artist licensing.
4. Either way, **come back to this file** and either (a) update the section above with the active license terms and date, or (b) remove the unused files from `public/svg/illustrations/` and update the table.

### Why we're documenting this so loudly

Shipping with a lapsed license is a real legal exposure — exactly the kind of thing an audit would flag. Calling it out here, in the repo, means whoever takes Sleuth toward release **sees the issue before users do**.

---

## Fonts

| Font | Source | License | Notes |
|---|---|---|---|
| Geist | `next/font/google` ([app/layout.tsx:5](../app/layout.tsx:5)) | SIL Open Font License 1.1 | ✅ Free for commercial use. |
| Geist Mono | `next/font/google` | SIL Open Font License 1.1 | ✅ Free for commercial use. |

---

## Code dependencies

See [package.json](../package.json) for the full list of npm dependencies. All current direct dependencies are MIT or similarly permissive; review on each major release.

---

## Inspiration assets in public/svg/inspiration/

These files are reference material for the kid-flow visual design. They are not rendered by the app — they exist purely so designers/engineers can compare our original mascots against established friendly-creature registers (ClassDojo-adjacent). Licenses:

- Microsoft Fluent Emoji — MIT License — © Microsoft Corporation — https://github.com/microsoft/fluentui-emoji
- Twemoji — CC BY 4.0 — © Twitter, Inc and contributors — https://github.com/twitter/twemoji
- OpenMoji — CC BY-SA 4.0 — © OpenMoji project — https://openmoji.org

| File | Source | Represents |
|---|---|---|
| `fluent-alien-monster.svg` | Microsoft Fluent Emoji | 👾 Alien monster |
| `fluent-ghost.svg` | Microsoft Fluent Emoji | 👻 Ghost |
| `fluent-robot.svg` | Microsoft Fluent Emoji | 🤖 Robot |
| `fluent-smiling-face-smiling-eyes.svg` | Microsoft Fluent Emoji | 😊 Smiling face with smiling eyes |
| `fluent-star-struck.svg` | Microsoft Fluent Emoji | 🤩 Star-struck |
| `fluent-smiling-face-with-hearts.svg` | Microsoft Fluent Emoji | 🥰 Smiling face with hearts |
| `fluent-face-with-monocle.svg` | Microsoft Fluent Emoji | 🧐 Face with monocle (detective vibe) |
| `fluent-owl.svg` | Microsoft Fluent Emoji | 🦉 Owl |
| `fluent-t-rex.svg` | Microsoft Fluent Emoji | 🦖 T-Rex |
| `fluent-unicorn.svg` | Microsoft Fluent Emoji | 🦄 Unicorn |

---

*Last reviewed: 2026-05-24.*
