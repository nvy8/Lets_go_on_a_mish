# Third-party asset attributions

This file lists third-party assets used by the app and their licensing status.

---

## Illustrations under [public/svg/illustrations/](../public/svg/illustrations/)

**Status:** Some files in this folder originated from third-party collections whose license has not been verified as currently covering production use. They are retained for local development only and **must be reviewed and either replaced or re-licensed before any public release**.

**Action items before release:**

1. Audit every file referenced from app code (currently the `kid-*.svg` set used by the stage loading states and the completion page).
2. Replace any file whose license cannot be confirmed for the intended deployment with a permissively-licensed equivalent. Suggested permissive sources:
   - [unDraw](https://undraw.co/) — MIT-equivalent
   - [Open Doodles](https://www.opendoodles.com/) — CC0
   - [Open Peeps](https://www.openpeeps.com/) — CC0
3. Remove any unreferenced legacy files from `public/svg/illustrations/` once the audit is complete.

The remaining `public/svg/brand/` mascots are original to this project.

---

## Fonts

| Font | Source | License | Notes |
|---|---|---|---|
| Geist | `next/font/google` ([app/layout.tsx:5](../app/layout.tsx:5)) | SIL Open Font License 1.1 | ✅ Free for commercial use. |
| Geist Mono | `next/font/google` | SIL Open Font License 1.1 | ✅ Free for commercial use. |
| Kalam | `next/font/google` | SIL Open Font License 1.1 | ✅ Free for commercial use. |

---

## Code dependencies

See [package.json](../package.json) for the full list of npm dependencies. All current direct dependencies are MIT or similarly permissive; review on each major release.

---

## Inspiration assets in public/svg/inspiration/

These files are reference material for the visual design. They are not rendered by the app — they exist purely as a friendly-creature visual reference for designers/engineers. Licenses:

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
| `fluent-face-with-monocle.svg` | Microsoft Fluent Emoji | 🧐 Face with monocle |
| `fluent-owl.svg` | Microsoft Fluent Emoji | 🦉 Owl |
| `fluent-t-rex.svg` | Microsoft Fluent Emoji | 🦖 T-Rex |
| `fluent-unicorn.svg` | Microsoft Fluent Emoji | 🦄 Unicorn |

---

*Last reviewed: 2026-05-24.*
