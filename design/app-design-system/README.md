# PoolOps Design System

The visual language and UI kit for **PoolOps** — a purpose-built operations platform for pool maintenance businesses in Australia and New Zealand. This repository is the authoritative design source for both product and marketing surfaces.

> **Tagline:** *Pool smarter. Always.*

---

## What PoolOps is

PoolOps replaces paper dockets, WhatsApp scheduling and spreadsheet records with a single platform that understands pool chemistry, service workflows and compliance requirements. It is aimed at small and large pool-service companies in ANZ.

### Three user types, two surfaces

| Surface | Primary users | Role |
|---|---|---|
| **Mobile (Technician)** | Pool technicians | Run sheet, chemical logging, job completion, photo capture |
| **Mobile (Pool Owner)** | Residential customers | View service history, reports, request visits |
| **Web dashboard** | Business owner, ops, admin | Scheduling, customers, records, team, settings |

The mobile app is a single build with role-based routing (role set by admin on account creation). The web dashboard runs in **dark mode by default** for sustained operational use.

### Screen inventory (MVP — 26 screens)

**Technician mobile** — M2 Login, M4 Run Sheet, M5 Pool Brief, M6 Active Job (with M7 Readings, M8 Treatment, M9 Photos, M10 Notes, M11 Complete), M13 Notifications, M14 Profile.

**Pool owner mobile** — M15 Home, M16 History, M17 Report Detail, M18 Request a Visit, M21 Notifications.

**Web dashboard** — W3 Dashboard, W4 Schedule, W6 Inbox, W7 Customers, W8 Customer Detail, W10 Add/Edit Customer, W12 Records, W13 Record Detail, W14 Team, W16 Add/Edit Technician, W26 Settings.

---

## Sources

This design system was built by reading the following uploaded materials:

- `PoolOps-Design-System.docx` — visual language v1.0 (created 31 Mar 2026, updated 15 Apr 2026). The authoritative colour / type / spacing spec. Includes Section 10 **"Web Dashboard Visual Direction"** which is the Velix-inspired near-white neomorphic aesthetic.
- `PoolOps-Master-UI-Spec.docx` — full 26-screen build reference v1.0, April 2026. Authoritative for component behaviour, navigation flows, interaction patterns, implementation rules. Extracted to `docs/_master-ui-spec.txt` for agent reference.
- 14 production-grade HTML mocks (M-series technician + owner, W-series dashboard) — the pixel-level source of truth. Preserved unmodified in `uploads/`.

Both docs and the HTML mocks agree on a few **non-obvious rules** codified here; see the *Implementation Rules* section below.

---

## Repository index

```
PoolOps-Design-System/
├── README.md                   ← you are here
├── SKILL.md                    ← agent skill manifest
├── colors_and_type.css         ← CSS variables: colors, type, spacing, radii, shadows, motion
├── assets/                     ← logos, app icons, brand marks
│   ├── logo-mark.svg           ← droplet-in-droplet mark, currentColor
│   ├── logo-wordmark.svg       ← dark mark + "PoolOps" on light
│   ├── logo-wordmark-inverse.svg
│   └── app-icon.svg            ← 44×44 app icon, dark tile + white mark
├── docs/                       ← extracted source-of-truth text
│   ├── _design-system.txt
│   └── _master-ui-spec.txt
├── preview/                    ← cards that populate the Design System tab
├── ui_kits/
│   ├── technician-mobile/      ← M2–M14 React recreation (click-thru)
│   ├── owner-mobile/           ← M15–M21 React recreation
│   ├── admin-web/              ← W3–W26 React recreation
│   └── marketing/              ← Visual identity for the conversion website
```

---

## Content Fundamentals

The copywriting vibe is **professional, trustworthy, outdoors** — a serious operational tool, not a startup toy. Clean and functional. Water and clarity as visual metaphors.

### Voice rules

- **Tone** — Calm, direct, operational. Reassuring to pool owners; crisp and efficient to technicians.
- **Perspective** — *"Your pool"* / *"Your technician"* / *"We"* when addressing owners. Second-person throughout. Technicians get imperative voice (*"Navigate to pool"*, *"Mark complete"*).
- **Casing** — Sentence case for all UI strings, button labels, and headings (*"Mark complete"*, not *"Mark Complete"*). UPPERCASE only for 11px section labels and 10px eyebrows, with letter-spacing ≥ 0.5px.
- **English** — **Australian / NZ spelling**. *Colour*, *organise*, *customer*, *technician*. Never *color*. The audience is ANZ.
- **Jargon rule** — The **Pool Owner app speaks plain English**. Never "ppm", "LSI", or raw chemistry codes on owner surfaces without translation. *"Your pool water is in excellent balance"* sits beside the +0.1 LSI score, never replaces it. The **Technician app uses operational terms**: pH, Free chlorine, Total alkalinity, Calcium hardness, Stabiliser/CYA.
- **Emoji** — **Not used.** The one existing case — emoji inside pool-spec chips (💧 55,000 L / 🏗 Concrete / ⚗ Chlorine / ☀ Outdoor on M5) — is the exception, not the rule. Treat it as a legacy placeholder. Prefer Heroicons-outline for all iconography.
- **Unicode as icon** — Avoided. Use Heroicons SVGs. The one legitimate unicode glyph is `›` as breadcrumb separator on web.

### Example copy snippets

| Context | Copy | What to notice |
|---|---|---|
| Owner greeting | *"Good morning,"* + *"Sarah Williams"* | Two-line greeting, first name bold |
| Owner status | *"Pool is healthy"* (uppercase label) / *"Your pool looks great"* (H2) | Plain-English reassurance |
| Owner report explanation | *"No corrosion or scaling risk. Your pool water is in excellent balance."* | Full sentence. No codes. |
| Owner treatment | *"No chemicals needed this visit"* or *"Added 400ml liquid chlorine"* | Never an empty section |
| Owner notifications | *"Your technician noted pH was slightly high and treated it. No action needed from you."* | Always reassuring |
| Tech run sheet | *"6 of 14 complete"* / *"NEXT UP"* / *"On schedule"* | Short, operational |
| Tech access-note warning | *"Dog in yard on Tuesdays"* | Specific, literal, protective |
| Tech empty state | *"All photos optional but recommended"* | Gives permission + guidance |
| Login footer | *"Wait for an invite from your pool company. Your account will be set up automatically."* | Prevents self-registration confusion |
| Admin breadcrumb | *"Customers › Smith, David"* | Last-name-first in customer contexts |
| CTA style | *"Log in"*, *"Mark complete"*, *"Save & invite owner"*, *"Send request"*, *"Confirm visit"* | Verb-led, specific, sentence case |

### Things to avoid

- Marketing-speak or hype. *"Revolutionary"*, *"magical"*, *"seamless"* — no.
- Exclamation marks except in celebration states (*"Your pool looks great"*).
- Abbreviations the field wouldn't say aloud.
- Calling owners "users" or "customers" in their own UI. To the owner, they are *you*.

---

## Visual Foundations

### Aesthetic direction

**Refined operational minimalism.** The product should feel like a precision instrument — calm, uncluttered and immediate. Every element earns its place. Density is managed through spacing and hierarchy, not visual noise. The reference aesthetic is the **Velix AI Agent dashboard** — a near-white neomorphic card language with muted accent states.

### Colour

See `colors_and_type.css` for the complete token set. High-level:

- **Primary action colour is `#111827` (near-black)**, NOT Pool Blue. This is the single most important rule in the system. Pool Blue (`#0EA5E9`) is **only** used for: links, active tab underlines, selected states, and connection status pills. Never as a button background.
- **App background `#F5F5F3`** (warm near-white) — Velix base. Differentiated from the Velix-ported web-light `#F5F7FA`.
- **Dark mode palette** — `#0F172A` page, `#111827` chrome, `#1E293B` cards, `#334155` borders. This is the default web dashboard appearance.
- **Status colours** pair traffic-light hue (`#22C55E` / `#F59E0B` / `#EF4444`) with a soft tint bg and a mid-saturation text colour. Never colour alone — always paired with a text label.
- **Never gradients on primary buttons or backgrounds** in-product. Gradients are permitted only in marketing surfaces, and only as atmospheric page backgrounds — never on controls.

### Typography

**Inter** is the only typeface. Loaded from Google Fonts. iOS fallback is SF Pro. No display face, no secondary family — its neutrality is a feature, not a limitation.

Three scales: **Mobile** (H1 24/700, body 14/400), **Web** (H1 28/700, body 14/400), **Marketing** (display up to 72/700 for hero, body 16/400). Letter-spacing is negative on large sizes (-0.3 to -0.5px) and positive on uppercase labels (+0.5 to +1px).

### Spacing

**4px base unit.** Scale: 4, 8, 16, 24, 32, 48. Card padding is 16px on mobile, 20px on web. Screen padding is 16px mobile, 24–28px web. Marketing sections extend the scale to 64 and 96.

### Backgrounds

- **No hand-drawn illustrations.** No repeating patterns or textures.
- **Imagery is photographic** when used — cool blue water, clean Australian/NZ residential pools, technician hands-on-equipment. No stock-photo smiling-family tropes. Prefer wide-aspect hero shots cropped to surface detail.
- **No full-bleed backgrounds on product UI.** Product screens are flat surfaces — `#F5F5F3` on mobile, `#0F172A` on web dark.
- **Marketing hero may use a single subtle gradient**: `var(--po-marketing-gradient)` (near-white → pool-blue mist at 6%), or a single blurred water image at < 20% opacity. Never more than one atmospheric element per section.

### Cards

- **Light-mode card:** `#FFFFFF` bg, `1px solid rgba(0,0,0,0.07)` border, **14–18px radius** (larger = more prominent), shadow `0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`.
- **Dark-mode card:** `#1E293B` bg, `1px solid #334155` border, 14px radius, no shadow (shadows don't read on dark).
- **Hover (tappable cards only):** border transitions to `rgba(0,0,0,0.12)` over 150ms.
- **Active/selected card:** adds a subtle Pool-Blue border at 30% opacity. Never a filled tint.
- **Never** a bright-coloured left-border-only accent. That motif is banned.

### Shadows

Soft neomorphic only. Cards sit on the page, they don't float. Max depth: phone frame (`0 32px 80px rgba(0,0,0,0.22)`) — this is the only heavy shadow anywhere.

### Borders

1px is the default card border; 1.5px for the "Next up" run-sheet card to give it weight; 4px left border for the amber **Access Notes** card (and nothing else uses a 4px border).

### Corner radii

- Inputs **8px**.
- Secondary buttons **10px**.
- Primary buttons & standard cards **12–14px**.
- Prominent cards **16–18px**.
- Pills / progress tracks / avatars **999px**.
- Phone frame **50px**.

### Animation & motion

- **Easing:** `cubic-bezier(0.2, 0.8, 0.2, 1)` by default. `cubic-bezier(0.16, 1, 0.3, 1)` for out-of-screen reveals.
- **Duration:** 150ms (fast — hover), 200ms (mid — pill state), 300ms (slow — sheet/drawer reveal).
- **No bounces.** No theatrical animations.
- **Card hover:** border-colour transition only.
- **Page transitions:** instant.
- **Loading:** subtle pulse on skeleton, never spinners.
- **One exception:** the active-job timer dot pulses (`@keyframes pulse` 1.5s infinite) to signal a live timer.

### Hover / press states

- **Hover** on cards: border darkens from `rgba(0,0,0,0.07)` → `rgba(0,0,0,0.12)`.
- **Hover** on dark CTAs: bg lightens from `#111827` → `#1F2937`.
- **Hover** on nav items: bg fills with `#F3F4F6` (light) or `#1F2937` (dark sidebar).
- **Press** uses no transform — no shrink, no scale. Just a momentary deeper-tone bg.
- Touch feedback on mobile is haptic (native), not visual.

### Transparency and blur

**Minimal.** The app is opaque. The one use of transparency is `rgba(0,0,0,0.07)` on card borders — so the border hue picks up the underlying background. Never `backdrop-filter: blur()`. Never frosted-glass panels.

### Layout rules (fixed elements)

- **Sticky CTA and bottom nav never coexist.** CTA owns the bottom on drill-down screens.
- **Web sidebar** is `position: fixed`; main content has `margin-left: 220px`.
- **Web topbar** is `position: sticky; top: 0; z-index: 10`.
- **Mobile status bar + dynamic island + home pill** are always rendered (they live inside the frame, not CSS safe-area).

### Imagery colour vibe

When product or marketing uses photography: **cool, clean, blue-green**. Clear water. Midday Australian sun. No warm-orange sunsets. No moody night shots. No black-and-white. **No grain.** Shot clean and held true to colour.

---

## Iconography

**Library: Heroicons** — outline variant, MIT licence, React-compatible. Loaded from CDN in UI kits.

- **Navigation icons:** 18–20px, stroke 1.5px.
- **Inline icons:** 14–16px, stroke 1.5–2px.
- **Colour:** inherits from parent text colour. Always set explicitly via `stroke="currentColor"` — never rely on class inheritance.
- **Style:** outline only. Solid/mini variants not used.
- **No hand-drawn SVGs** for anything Heroicons ships. If an icon is missing, substitute the closest Heroicons glyph rather than inventing one.

### Key icons and where they appear

| Icon | Heroicons name | Used for |
|---|---|---|
| Map pin | `map-pin` | Navigate to pool (M5) |
| Triangle + bang | `exclamation-triangle` | Access notes warning (M5), flagged readings |
| Clock | `clock` | Job timer, history timestamps |
| Droplet | `beaker` / custom | Pool specs, chemical readings |
| Camera | `camera` | Photo capture tab (M9) |
| Pencil | `pencil-square` | Notes tab (M10), edit actions |
| Check circle | `check-circle` | Completion, "All readings good" |
| Bell | `bell` | Notifications |
| Chevron right | `chevron-right` | Drill-in, breadcrumb, nav arrow |
| House | `home` | Owner home tab |
| Plus circle | `plus-circle` | Request a visit, add actions |
| Document text | `document-text` | Service report, service records |
| Users | `users` | Team, customers |
| Calendar | `calendar` | Schedule |
| Cog | `cog-6-tooth` | Settings |

### Logos and brand marks

See `assets/`:
- `logo-mark.svg` — the droplet-in-droplet glyph, drawn with `currentColor` so it can be restyled per context.
- `logo-wordmark.svg` — dark tile + "PoolOps" on light surfaces.
- `logo-wordmark-inverse.svg` — light tile + "PoolOps" on dark surfaces (sidebar / dark mode / footer).
- `app-icon.svg` — 44×44 app icon for device frames.

### Emoji / unicode

**Not used** (see Content Fundamentals). If you see emoji in legacy mocks (M5 pool-spec chips), they should be replaced with Heroicons on next pass.

---

## Implementation Rules (non-obvious)

Lifted verbatim from the Master UI Spec — these are the rules that catch people out.

1. **Buttons must use inline styles** for `background-color` and `color`. Class inheritance has been observed to be suppressed in the rendering environment. Always set colours directly on the element. Use `<div>` for sticky CTAs, not `<button>`.
2. **Sticky footers have an explicit `background-color`.** Never transparent, never inherited.
3. **Icon SVGs inside primary CTAs must set `stroke="#ffffff"`** directly on the element.
4. **Bottom nav hidden on drill-down screens.** Back arrow in the header handles return.
5. **Service records are locked after submission.** Only office notes can be added post-lock.
6. **Owner never sees office notes.** Enforced at the API, not just UI.
7. **Stock deduction happens on Mark Complete**, not when treatment amounts are entered.
8. **Traffic light indicators always pair colour with text.** Never colour alone.

---

## Visual identity for marketing (what the user asked for)

The product system is opinionated, but it was built for product surfaces — field tools and operational dashboards. For the **marketing / conversion website**, the same visual DNA extends with three additions that are *not* used in-product:

1. A larger **display type scale** (`--po-mk-display` through `--po-mk-body`) for hero moments.
2. Permission to use a single **atmospheric gradient** per section (`--po-marketing-gradient`) — a near-white to pool-blue-mist fade, evoking clear water.
3. A deeper-than-ink **hero/footer colour** (`--po-marketing-deep` = `#081321`) for full-bleed brand moments. In-product the darkest surface is `#0F172A`; marketing can go one shade darker for drama without breaking tonal continuity.

Everything else — Inter, near-black CTAs, soft neomorphic cards, Heroicons-outline, ANZ English, plain-English reassurance — carries over unchanged. The marketing site looks and sounds like PoolOps because **the voice is the product's voice, amplified**.

See `ui_kits/marketing/index.html` for the applied visual identity.

---

## Caveats & open questions

**Caveats you should know about:**

1. **Icon library is Heroicons, loaded inline via SVG paths** rather than pulled from a CDN. If you'd prefer a different library (Lucide, Feather, a custom set) say the word — the swap is one component.
2. **Inter substituted for the specified typeface**. The source docs specify “Inter” directly, so this is right — but if you have a custom licensed typeface in the pipeline (e.g. a bespoke wordmark type), I need the files.
3. **Logo is a placeholder** — a droplet-in-droplet glyph I drew to stand in. It is not a finished logo. If you have a designed logo or a sketch, please attach it and I'll rebuild the brand marks and app icon.
4. **Marketing copy is placeholder** — headlines and body text in `ui_kits/marketing/` are written in-voice but are not committed copy. Iterate before shipping.
5. **No photography** — the marketing hero uses a ripple SVG motif and a product-dashboard preview instead of real photography. Real pool photography (cool blue, midday, ANZ residential) will significantly lift the landing page.
6. **UI kits are recreations, not production**. Components are styled for pixel fidelity, not engineered for reuse. They're accurate enough to design against; port them to your real codebase before shipping.
7. **Marketing dark band uses `#0F172A`** rather than the proposed `#081321` — I kept continuity with the product dark surface for this first pass. Happy to go one shade deeper if you want more drama.

---

## 🚨 Bold ask — help me make this perfect

**Please walk through the Design System tab and let me know, specifically:**

1. **Is the palette right?** Particularly: ink-primary instead of blue-primary. This is the most opinionated call in the system and worth confirming.
2. **Is Pool Blue saturated enough for your brand?** `#0EA5E9` is accessible and product-friendly; if you want something more vivid for marketing we can split the token.
3. **Marketing tone** — does *“Pool smarter. Always.”* feel right, or too flip? I can pull back toward something more sober (“Operations software for pool-service businesses”) or lean further into personality.
4. **Do you have a logo?** If yes, attach it — I'll redo the app icon, sidebar mark, and marketing header.
5. **Any photography direction?** Even a mood-board of two or three reference shots would unlock the marketing hero.
6. **Anything missing from the screen set?** I built kits for the three products you have but may have over/under-indexed on particular views.

Reply with anything from a single nitpick to a whole new direction and I'll iterate.
