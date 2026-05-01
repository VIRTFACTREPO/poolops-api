# Admin / Operator Web Portal UI Kit

High-fidelity recreation of the PoolOps **web** admin portal (W-series screens). Dark-chrome sidebar on a light canvas; dashboard, scheduling, and team views.

## Screens included

- **W3 Dashboard** — stat cards, today's runs table, flagged pools list, technician load
- **W4 Schedule** — weekly grid view with drag-hint cards
- **W14 Team** — technician roster with avatar + load bars

## Key layout

- Sidebar: **240px wide, #0F172A background**, collapses at <1024px (not implemented here)
- Canvas: #F5F5F3 background
- Content max-width **1280px**, padded 32px
- Cards use `--po-card-shadow` soft neumorphic stack

## Components

- `Sidebar.jsx` — nav with active pill, logo, user card
- `TopBar.jsx` — search, date range, CTA
- `StatCard.jsx` — big number + trendline + delta pill
- `Table.jsx` — PoolOps table shell (sticky header, zebra rows, row hover)
- `FlaggedCard.jsx` — attention card for water issues
- `TechRow.jsx` — avatar + progress bar row
- `screens/W3Dashboard.jsx`
- `screens/W4Schedule.jsx`
- `screens/W14Team.jsx`

## Non-obvious rules

- Numbers are **tabular-nums everywhere** — `font-variant-numeric: tabular-nums` on any digit-heavy cell.
- Table rows have a **2px left border that appears red on flagged rows**, not an entire row tint.
- Technician avatar colours are deterministic: blue for James (JT), purple for Marama (MK), green for Sam (SL).
