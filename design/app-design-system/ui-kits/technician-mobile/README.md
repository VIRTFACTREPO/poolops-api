# Technician Mobile UI Kit

High-fidelity React recreation of the PoolOps technician mobile app (M-series screens). Interactive click-through from login through to active job completion.

## Screens included

- **M2 Login** — email / password entry, logo block, footer prevent-self-signup note
- **M4 Today Run Sheet** — progress strip, next-up card, pending cards, completed cards
- **M5 Pool Brief** — navigate CTA, access notes, pool specs, equipment, last 3 visits, trend chart
- **M6 Active Job** — tab container with live timer; M7 Readings tab shown

## Components

- `Phone.jsx` — device frame (iOS-style, 375×812, with dynamic island + home pill)
- `StatusBar.jsx` — 9:41 + wifi/cell/battery SVG cluster
- `Card.jsx` — neomorphic white card primitive
- `Pill.jsx` — status badge, colour variants
- `TrafficDot.jsx` — 7/10px coloured dot
- `Button.jsx` — primary (ink) / secondary / destructive
- `Icon.jsx` — outline Heroicons wrapper, 1.5px stroke
- `screens/M2Login.jsx`
- `screens/M4RunSheet.jsx`
- `screens/M5PoolBrief.jsx`
- `screens/M6ActiveJob.jsx` — includes M7 Readings tab content

## Non-obvious rules

- All CTA background-color and color set **inline**, never via class. See `Button.jsx`.
- Phone frame is `border-radius: 50px` with `overflow: hidden`.
- Bottom nav never coexists with a sticky CTA — drill-down screens use a back arrow in the header instead.
- Traffic dots always pair with a text label.

## Running

Open `index.html` directly. It loads React + Babel from CDN and renders the click-through prototype inline.
