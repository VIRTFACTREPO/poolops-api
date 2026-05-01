---
name: poolops-design
description: Use this skill to generate well-branded interfaces and assets for PoolOps, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Fast tour

- `README.md` — brand overview, content fundamentals, visual foundations, iconography
- `colors_and_type.css` — all tokens (load with `<link>`; use `var(--po-*)`)
- `preview/` — 21 design-system specimen cards (colors, type, spacing, components, brand)
- `assets/` — logo marks, brand illustrations
- `ui_kits/technician-mobile/` — click-thru M2 → M4 → M5 → M6
- `ui_kits/owner-mobile/` — owner home + visit brief
- `ui_kits/admin-web/` — W3 dashboard, W4 schedule, W14 team
- `ui_kits/marketing/` — landing: hero, features, how-it-works, testimonial, CTA

## Non-negotiables

1. **ANZ spelling** (colour, organise, centre). Never US spelling.
2. **No emoji** in product UI. Marketing may use rarely, only if it replaces a word.
3. **Traffic-light colour always pairs with text** — never a lone coloured dot.
4. **Owner-facing copy is plain English** — "Your pool water is in excellent balance," never "pH 7.4."
5. **Numbers are tabular-nums** — `font-variant-numeric: tabular-nums` on any digit cell.
6. **Primary CTAs are ink (#111827)**, not blue. Pool Blue (#0EA5E9) is accent + highlights only.
7. **Icons are Heroicons outline, 1.5px stroke, currentColor.** Never hand-roll SVG icons unless adding a new glyph to the set.

## Palette (quick reference)

- Ink `#111827` — primary CTA, body text
- Warm white `#F5F5F3` — mobile canvas background
- Pool Blue `#0EA5E9` — accent, hero gradients, sparklines
- Slate `#0F172A` — dark web nav + marketing dark sections
- Status: `#22C55E` green · `#F59E0B` amber · `#EF4444` red

## Audience voice

| Audience | Register | Example |
|---|---|---|
| Owner | Plain English, reassuring | "Your pool water is in excellent balance." |
| Technician | Operational, imperative | "pH high — add 250ml hydrochloric acid." |
| Admin | Direct, scannable | "3 flagged · 47 runs today." |
