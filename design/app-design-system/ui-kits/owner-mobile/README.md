# Owner Mobile UI Kit

High-fidelity recreation of the PoolOps **pool owner** mobile app (M15 / M-owner screens). Owners see status in plain English — "Your pool is balanced" — never raw numbers unless they tap through.

## Screens included

- **Home** — next visit card, water quality summary card, recent visits list
- **Pool Brief** — owner's view: pool specs, timeline of visits (no chemistry action items)

## Key rule for voice
Owner surfaces speak in plain English. No "pH 7.4" on the home screen — just "Your pool water is in good condition." Tap-through surfaces can show the number, always with what it means.

## Shares with technician kit
- `Phone.jsx` (copy of device frame)
- `Components.jsx` (Pill, TrafficDot, Button, Icon, LogoMark — same contract)

The shared module is copied, not imported, so each kit can evolve independently.
