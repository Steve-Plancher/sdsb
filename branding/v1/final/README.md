# SDSB Brand Identity — Final Handoff

## Approval
Selected direction: **Concept 1 — Growth Rings**.

## Core idea
Open growth rings gather around a seed, representing small daily actions accumulating into visible progress.

## Package
- `logos/` — primary symbol; horizontal and stacked lockups; dark, reversed and monochrome SVG variants; PNG masters.
- `app-icons/` — opaque 1024×1024 light, dark and grayscale-tinted icon masters; transparent monochrome tint foreground; SVG sources.
- `launch/` — light/dark splash screens, 1290×2796 App Store screenshot template and example, 1080×1080 social image.
- `brand-guide/` — one-page PNG/PDF guide plus detailed Markdown specification.
- `tokens/` — JSON design tokens, named Canva color CSV, Manrope variable font and SIL OFL license.
- `qa/` — icon stress test and visual contact sheet.
- `manifest.json` — file dimensions, modes and byte sizes.

## App icon implementation
- Use the supplied square artwork without adding rounded corners; iOS applies the mask.
- Light, dark and tinted masters are opaque RGB PNGs at 1024×1024.
- `sdsb-app-icon-tinted-foreground-1024.png` is a transparent monochrome foreground for Icon Composer/Xcode workflows.
- The symbol was visually stress-tested at 16, 20, 29 and 60 px. The documented app-icon minimum is 29 px.
- Native Xcode/Icon Composer packaging is not included and remains integration-unverified.

## Typeface
Manrope is recommended and supplied as a variable font. It is licensed under the SIL Open Font License 1.1. It was selected for its calm geometry, readable compact UI forms, and strong numerals for streak and insight statistics.

## Streak and statuses
Keep the streak indicator orange: `#C96F18` light / `#F1A24A` dark. Success is deliberately blue rather than green so it cannot blur into the brand color. Pair statuses with icons or labels rather than color alone.

## Canva
Uploaded and verified in `SDSB - Brand Identity`:
- `SDSB Brand Kit Assets` — 6 assets.
- `SDSB Launch Assets` — 8 assets.
- `SDSB Working Designs` — 1 remaining editable design.
- Reusable Brand Templates: `SDSB Brand Kit - Brand Guide` and `SDSB App Store Screenshot Template`.

Canva Connect API does not expose Brand Kit naming, palette slots, logo slots, or font slots. The actual UI Brand Kit still needs to be named **SDSB** and assigned the supplied logos, colors CSV and Manrope font through Canva’s Brand Kit interface.
