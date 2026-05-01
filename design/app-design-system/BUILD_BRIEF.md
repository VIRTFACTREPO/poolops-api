# PoolOps App — Build Brief & Developer Handoff

This is the complete handoff package for building the **PoolOps mobile app** (technician + pool owner) and the **PoolOps web portal** (admin / operator). It does **not** cover the marketing website — that's a separate handoff.

Drop the entire `poolops-app/` folder into a fresh project. Read this brief first, then `README.md`, then `spec/_master-ui-spec.txt`. Everything else supports those three.

---

## What you are building

| Surface | Stack guidance | Audience |
|---|---|---|
| **Mobile app — Technician role** | React Native (recommended) or native iOS/Android. Single binary, role-routed at login. | Pool technicians in the field. |
| **Mobile app — Pool Owner role** | Same binary as technician — different home screen and navigation per role. | Residential customers. Owner role is invite-only from an operator account. |
| **Web portal — Admin / Operator** | React + Vite (recommended). SPA. Dark mode by default. Responsive down to 1024px; collapses sidebar below that. | Business owners, ops managers, schedulers, dispatchers. |

The mobile app is **one app** with two roles. Account creation always happens server-side — no self-signup. Role is set on the server when an operator invites a technician or a pool owner.

---

## Screen inventory (MVP — 26 screens)

**Technician mobile (M-series)** — see `original-mocks/` and `ui-kits/technician-mobile/` for the visual reference.

| ID | Screen | Original mock | UI-kit React |
|---|---|---|---|
| M2 | Login | `poolops_m2_login.html` | `screens/M2Login.jsx` |
| M4 | Run sheet | `poolops-m4-run-sheet.html` | `screens/M4RunSheet.jsx` |
| M5 | Pool brief | `poolops_m5_pool_brief_v3.html` | `screens/M5PoolBrief.jsx` |
| M6 | Active job | `poolops-m6-active-job.html` | `screens/M6ActiveJob.jsx` |
| M7–M11 | Active job sub-tabs (Readings, Treatment, Photos, Notes, Complete) | embedded in M6 mock | shown inside M6 React component |
| M13 | Notifications | `poolops-m13-m14.html` | — |
| M14 | Profile | `poolops-m13-m14.html` | — |

**Pool Owner mobile (M-series, owner)** — see `poolops-owner-screens.html` for the full set.

| ID | Screen | UI-kit React |
|---|---|---|
| M15 | Home | `screens/Owner.jsx` (OwnerHome) |
| M16 | History | from `original-mocks/poolops-owner-screens.html` |
| M17 | Report detail | `screens/Owner.jsx` (OwnerBrief) |
| M18 | Request a visit | from `original-mocks/poolops-owner-screens.html` |
| M21 | Notifications | from `original-mocks/poolops-owner-screens.html` |

**Web portal (W-series)** — see `original-mocks/poolops-w*.html` and `ui-kits/admin-web/`.

| ID | Screen | Original mock | UI-kit React |
|---|---|---|---|
| W3 | Dashboard | `poolops-w3-dashboard-dark.html` and `poolops_w3_dashboard_velix.html` | `screens/W3Dashboard.jsx` |
| W4 | Schedule (week grid) | `poolops-w4-schedule.html` | `screens/W4Schedule.jsx` |
| W6 | Inbox | `poolops-w6-w7-w8.html` | — |
| W7 | Customers list | `poolops-w6-w7-w8.html` | — |
| W8 | Customer detail | `poolops-w6-w7-w8.html` | — |
| W10 | Add/Edit customer | `poolops-w10-w16.html` | — |
| W12 | Records list | `poolops-w12-w13.html` | — |
| W13 | Record detail | `poolops-w12-w13.html` | — |
| W14 | Team | `poolops-w14-team.html` | `screens/W14Team.jsx` |
| W16 | Add/Edit technician | `poolops-w10-w16.html` | — |
| W26 | Settings | spec only | — |

The UI-kit React components are **visual references**, not production code. Use them to confirm pixel-level details (spacing, radius, shadow, type weight). Lift values and patterns into your real components.

The original HTML mocks (in `original-mocks/`) are the **pixel-level source of truth**. When the spec and a mock disagree, the mock wins.

---

## Read in this order

1. **`README.md`** — full design system: voice, palette, typography, spacing, components, content rules, implementation rules. **Read end to end.**
2. **`spec/_master-ui-spec.txt`** — the 1100-line build reference. Every screen specified by sections, components, behaviours, copy. This is your bible. (Source: `spec/PoolOps-Master-UI-Spec.docx`.)
3. **`spec/_design-system.txt`** — visual language reference. (Source: `spec/PoolOps-Design-System.docx`.)
4. **`SKILL.md`** — quick-reference cheat sheet of non-negotiables.
5. **`colors_and_type.css`** — all CSS variables. Convert to your platform's design-token format (e.g. React Native `StyleSheet`, `tokens.ts`, Tamagui theme, NativeWind config).

---

## Folder reference

```
poolops-app/
├── BUILD_BRIEF.md                  ← you are here
├── README.md                       ← full design system docs
├── SKILL.md                        ← cheat sheet
├── colors_and_type.css             ← all design tokens (CSS vars)
│
├── assets/                         ← brand
│   ├── logo-mark.svg
│   ├── logo-wordmark.svg           ← for light surfaces
│   ├── logo-wordmark-inverse.svg   ← for dark surfaces (sidebar, dark mode)
│   └── app-icon.svg                ← 44×44 launcher tile
│
├── spec/                           ← AUTHORITATIVE SPECS
│   ├── _design-system.txt          ← extracted from .docx (read this)
│   ├── _master-ui-spec.txt         ← extracted from .docx (read this)
│   ├── PoolOps-Design-System.docx  ← original Word doc (for reference)
│   └── PoolOps-Master-UI-Spec.docx ← original Word doc (for reference)
│
├── ui-kits/                        ← React reference implementations
│   ├── technician-mobile/          ← M-series tech screens (open index.html)
│   │   ├── index.html
│   │   ├── Components.jsx
│   │   └── screens/M2Login, M4RunSheet, M5PoolBrief, M6ActiveJob
│   ├── owner-mobile/               ← M-series owner screens
│   │   ├── index.html
│   │   ├── Components.jsx
│   │   └── screens/Owner.jsx
│   └── admin-web/                  ← W-series web portal
│       ├── index.html
│       ├── Components.jsx
│       └── screens/W3Dashboard, W4Schedule, W14Team
│
├── original-mocks/                 ← PIXEL SOURCE OF TRUTH (raw HTML mocks)
│   ├── poolops_m2_login.html
│   ├── poolops-m4-run-sheet.html
│   ├── poolops_m5_pool_brief_v3.html
│   ├── poolops-m6-active-job.html
│   ├── poolops-m13-m14.html
│   ├── poolops_m15_owner_home_v2.html
│   ├── poolops-owner-screens.html      ← M15–M21 owner stack
│   ├── poolops-w3-dashboard-dark.html
│   ├── poolops_w3_dashboard_velix.html
│   ├── poolops-w4-schedule.html
│   ├── poolops-w6-w7-w8.html           ← Inbox, Customers, Customer detail
│   ├── poolops-w10-w16.html            ← Add/Edit customer + technician
│   ├── poolops-w12-w13.html            ← Records, Record detail
│   └── poolops-w14-team.html
│
└── preview/                        ← design-system specimens (visual calibration)
    ├── colors-primary.html
    ├── colors-status.html
    ├── colors-neutral.html
    ├── colors-dark-mode.html       ← web portal default mode
    ├── type-mobile-scale.html
    ├── type-web-scale.html
    ├── spacing-scale.html
    ├── radii.html
    ├── shadows.html
    ├── components-buttons.html
    ├── components-inputs.html
    ├── components-cards.html
    ├── components-badges.html
    ├── components-traffic-progress.html
    ├── components-navigation.html  ← bottom nav, sidebar, top bar
    ├── components-tech-row.html
    ├── components-lsi.html         ← Langelier index display (chemistry)
    ├── brand-logo.html
    ├── brand-iconography.html
    └── brand-voice.html
```

---

## Non-negotiables (the rules that catch people out)

These are lifted from the spec and have caused real bugs. Internalise them before you start.

1. **Primary action colour is `#111827` (near-black)**, NOT Pool Blue. Pool Blue (`#0EA5E9`) is **only** for: links, active tab underlines, selected states, sparklines, hero gradients, and connection-status pills. **Never as a button background.**
2. **ANZ spelling.** Colour. Organise. Centre. Customer. Technician. Stabiliser. Never US.
3. **No emoji** in product UI. Heroicons-outline only. The legacy emoji on M5 pool-spec chips (💧 🏗 ⚗ ☀) must be replaced with Heroicons.
4. **Owner-facing copy is plain English.** *"Your pool water is in excellent balance."* — never *"pH 7.4"* on its own. Numbers may appear next to plain-English labels, never alone.
5. **Technician copy is operational.** Imperative voice. *"pH high — add 250ml hydrochloric acid."*
6. **Inter is the only typeface.** Loaded from Google Fonts on web. SF Pro fallback on iOS. Inter is bundled on Android via `react-native-vector-icons` patterns or expo-google-fonts.
7. **Numbers are tabular-nums everywhere.** `font-variant-numeric: tabular-nums` on web; `fontVariant: ['tabular-nums']` on React Native. Any digit-heavy cell.
8. **Traffic-light colour always pairs with text.** Never a lone coloured dot. Accessibility requirement.
9. **Buttons must use inline styles** for `background-color` and `color`. Class inheritance has been observed to be suppressed in WebView contexts; set colours directly on the element. Use `<div role="button">` for sticky CTAs, not `<button>`. *(This is from the spec — likely a workaround for the original mock environment, but document the pattern in your component lib so future devs don't reintroduce the bug.)*
10. **Sticky footers have an explicit `background-color`.** Never transparent, never inherited.
11. **Icon SVGs inside primary CTAs must set `stroke="#ffffff"`** directly on the element.
12. **Bottom nav hidden on drill-down screens.** Back arrow in the header handles return. Sticky CTA owns the bottom on those screens.
13. **Service records are locked after submission.** Only office-side notes can be added post-lock.
14. **Owner never sees office notes.** Enforced at the API, not just the UI.
15. **Stock deduction happens on Mark Complete**, not when treatment amounts are entered.
16. **`box-sizing: border-box`** on all buttons and inputs. (We hit a bug where `width: 100%` + horizontal padding caused overflow. Set this in your global reset.)
17. **Web sidebar `position: fixed`**, main content has `margin-left: 220px`. Web topbar is `position: sticky; top: 0; z-index: 10`.

---

## Palette (quick reference — full set in `colors_and_type.css`)

```
INK            #111827   ← primary CTA, body text
WARM WHITE     #F5F5F3   ← mobile canvas
SLATE-900      #0F172A   ← web dark page bg
SLATE-800      #111827   ← web dark chrome
SLATE-700      #1E293B   ← web dark cards
SLATE-600      #334155   ← web dark borders

POOL BLUE      #0EA5E9   ← accent — links, active states, sparklines
POOL BLUE 700  #0369A1   ← accent dark variant
POOL BLUE 100  #E0F2FE   ← accent tint background

GREEN          #22C55E   ← traffic-light good
AMBER          #F59E0B   ← traffic-light caution
RED            #EF4444   ← traffic-light alert
GREEN BG       #F0FDF4
AMBER BG       #FFFBEB
RED BG         #FEF2F2

GREY-50        #F9FAFB
GREY-100       #F3F4F6
GREY-200       #E5E7EB   ← input borders
GREY-300       #D1D5DB
GREY-500       #6B7280   ← secondary text
GREY-700       #374151   ← form labels
```

---

## Typography scale

| Use | Mobile | Web | Weight | Letter-spacing |
|---|---|---|---|---|
| H1 / page title | 24 | 28 | 700 | -0.3 |
| H2 / section | 18 | 20 | 700 | -0.2 |
| H3 / card | 15 | 16 | 600 | -0.1 |
| Body | 14 | 14 | 400 | 0 |
| Small / meta | 12 | 12 | 400 | 0 |
| Eyebrow / uppercase label | 11 | 11 | 600 | 0.5–1.0 |

All numerics: **`font-variant-numeric: tabular-nums`**.

---

## Spacing & radii

- **Spacing scale**: 4, 8, 12, 16, 20, 24, 32, 48 (px). 4px is the base unit.
- **Card padding**: 16 mobile / 20 web.
- **Screen padding**: 16 mobile / 24–28 web.
- **Card radius**: 14–18 (larger = more prominent).
- **Input radius**: 8.
- **Secondary button radius**: 10.
- **Primary button radius**: 12.
- **Pill / progress / avatar**: 999 (full).
- **Phone frame**: 50 (only relevant in mocks).

---

## Iconography

**Heroicons outline**, 1.5px stroke, `currentColor`. Never invent SVG icons; substitute the closest Heroicon glyph.

Library: <https://heroicons.com/> · MIT licence · `@heroicons/react/24/outline` for React, `react-native-heroicons` for RN.

Per-screen icon mapping is in `README.md` → Iconography → "Key icons and where they appear".

---

## Forms (web portal)

- Input bg `#fff`, border `1px solid #E5E7EB`, radius 8px, padding `10px 12px`, font 14px/400.
- Focus state: border `#0EA5E9`, ring `0 0 0 3px rgba(14,165,233,0.15)`.
- Error: border `#EF4444`, helper text `#DC2626 / 12px / 500`.
- Labels above inputs, `13px / 500 / #374151`, `margin-bottom: 6px`.
- Required marker: red asterisk, no helper text needed.
- Disabled: bg `#F9FAFB`, text `#9CA3AF`, cursor `not-allowed`.

---

## Voice (per audience)

| Audience | Register | Example |
|---|---|---|
| **Pool owner** | Plain English, reassuring, second-person *you* | *"Your pool water is in excellent balance."* |
| **Technician** | Operational, imperative | *"pH high — add 250ml hydrochloric acid."* *"Mark complete."* |
| **Operator / admin** | Direct, scannable, dense | *"3 flagged · 47 runs today."* |

Avoid: hype, exclamation marks (except on completion celebration states), abbreviations the field wouldn't say aloud, calling owners "users" or "customers" in their own UI.

---

## Backend / data notes (carried from the spec)

1. **Records are immutable after submission.** Append-only office-notes thereafter. UI must lock the record once Mark Complete is tapped.
2. **Stock deduction** happens server-side on Mark Complete — not on treatment entry. Treatment entry is a draft.
3. **Owners never see office notes.** Filter at the API layer.
4. **Photos** are linked to the visit, the customer, and the pool. No filename input from the tech.
5. **Offline mode** for the technician app: queue reading entries, photo metadata, and complete actions. Sync when online. Owner-update push fires only after sync confirms.
6. **Owner accounts are invite-only** — no self-signup endpoint should exist.
7. **Role is set server-side on invite acceptance.** Client requests role on every session start.
8. **LSI (Langelier Saturation Index)** is computed server-side from the readings and shown to the technician (with target band) and to the owner (translated to plain English). See `preview/components-lsi.html` for the display pattern.

---

## Suggested project structure

### Mobile (React Native)

```
mobile/
├── app/
│   ├── (auth)/login.tsx
│   ├── (tech)/_layout.tsx          ← bottom nav
│   ├── (tech)/index.tsx            ← M4 run sheet
│   ├── (tech)/pool/[id]/brief.tsx  ← M5
│   ├── (tech)/pool/[id]/job.tsx    ← M6 (with sub-tabs M7–M11)
│   ├── (tech)/notifications.tsx    ← M13
│   ├── (tech)/profile.tsx          ← M14
│   ├── (owner)/_layout.tsx
│   ├── (owner)/index.tsx           ← M15 home
│   ├── (owner)/history.tsx         ← M16
│   ├── (owner)/visit/[id].tsx      ← M17
│   ├── (owner)/request.tsx         ← M18
│   └── (owner)/notifications.tsx   ← M21
├── components/
│   ├── Button.tsx
│   ├── Pill.tsx
│   ├── TrafficDot.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── ReadingsTable.tsx
│   ├── LSIDisplay.tsx
│   └── BottomNav.tsx
└── theme/tokens.ts                 ← from colors_and_type.css
```

### Web portal (React + Vite)

```
web/
├── src/
│   ├── routes/
│   │   ├── dashboard.tsx           ← W3
│   │   ├── schedule.tsx            ← W4
│   │   ├── inbox.tsx               ← W6
│   │   ├── customers/index.tsx     ← W7
│   │   ├── customers/[id].tsx      ← W8
│   │   ├── customers/new.tsx       ← W10
│   │   ├── records/index.tsx       ← W12
│   │   ├── records/[id].tsx        ← W13
│   │   ├── team/index.tsx          ← W14
│   │   ├── team/new.tsx            ← W16
│   │   └── settings.tsx            ← W26
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── TopBar.tsx
│   │   ├── StatCard.tsx
│   │   ├── DataTable.tsx
│   │   └── …
│   └── theme/tokens.ts
└── index.html
```

---

## What's still required from the user (open questions for the dev team to flag)

1. **Logo is a placeholder** I drew (droplet-in-droplet glyph). If a real logo exists, replace `assets/logo-mark.svg`, `logo-wordmark.svg`, `logo-wordmark-inverse.svg`, and `app-icon.svg` before shipping.
2. **Heroicons substitution** — the spec doesn't specify an icon set; I chose Heroicons. If the user has a preferred library (Lucide, Phosphor, custom), swap before component implementation.
3. **Real LSI formula** — the spec says LSI is computed; confirm the chemistry team's exact formula before implementing the calculation server-side.
4. **Photo storage** — the spec doesn't specify backend (S3? Cloudflare R2? Supabase?). Confirm with infra.
5. **Push notification provider** — owner updates fire after a tech marks complete. Confirm provider (Expo? FCM + APNs direct?).
6. **Stripe integration scope for billing** is referenced in the spec but not detailed in the W26 settings screen. Confirm scope before building billing.

---

## First message to your dev agent in the new project

> "Build the PoolOps app per `BUILD_BRIEF.md`. Read README.md, spec/\_master-ui-spec.txt, and SKILL.md before writing any code. Use the original-mocks/ HTML files as the pixel source of truth and ui-kits/ for the React reference implementation. Start with the design tokens (theme/tokens.ts from colors\_and\_type.css), then the shared component primitives (Button, Pill, Card, TrafficDot, Input), then build screen by screen in order: M2 Login, M4 Run sheet, M5 Pool brief, M6 Active job, M15 Owner home, then the W-series web portal starting with W3 Dashboard."
