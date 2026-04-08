# WISE Mission Control

A TypeScript full-stack web application for exploring NASA's Wide-field Infrared Survey Explorer (WISE) mission data — including near-Earth object tracking, the NEOWISE catalog, comet discoveries, and the NASA image library.

![WISE Mission Control](https://images-assets.nasa.gov/image/PIA17254/PIA17254~thumb.jpg)

## Features

- **Dashboard** — Mission KPIs (747M+ surveyed objects, 43K NEOs, 39K NEOWISE discoveries), upcoming close-approach chart, and mission timeline
- **NEO Tracker** — Live scatter plot and sortable table of near-Earth object close approaches over the next 120 days, sourced from the JPL Small-Body Database
- **Object Catalog** — Search 41,000+ NEOs by designation, orbit class, H magnitude, and PHA status
- **Image Explorer** — NASA Image & Video Library gallery across 5 categories (WISE, NEOWISE, Comets, Asteroids, AllWISE) with lightbox viewer

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| Backend | Express, TypeScript, better-sqlite3 |
| Routing | Wouter (hash-based) |
| Data fetching | TanStack Query v5 |
| Fonts | Barlow Condensed, Barlow, Space Mono |

## APIs Used

All public, no API key required:

- [JPL Small-Body Database CAD API](https://ssd-api.jpl.nasa.gov/doc/cad.html) — close-approach data
- [JPL Small-Body Database Query API](https://ssd-api.jpl.nasa.gov/doc/sbdb_query.html) — NEO catalog
- [NASA Image and Video Library API](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf) — mission imagery

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (Express + Vite on port 5000)
npm run dev

# Build for production
npm run build

# Run production server
NODE_ENV=production node dist/index.cjs
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

## Project Structure

```
wise-app/
├── client/
│   └── src/
│       ├── components/     # AppSidebar and shadcn/ui components
│       ├── pages/          # Dashboard, NeoTracker, ObjectCatalog, ImageExplorer
│       ├── lib/            # queryClient, utils
│       └── index.css       # NASA mission-control design tokens
├── server/
│   ├── index.ts            # Express entry point
│   ├── routes.ts           # API route handlers
│   ├── nasa.ts             # NASA/JPL API client
│   └── storage.ts          # SQLite storage + camelCase mappers
├── shared/
│   └── schema.ts           # Drizzle schema + TypeScript types
├── tailwind.config.ts
└── vite.config.ts
```

## Design System

NASA mission-control aesthetic with a dark theme:

| Token | Value |
|---|---|
| Background | `#06090f` |
| Surface | `#0a0e18` |
| NASA Blue | `#1063c8` |
| NASA Red | `#e02a14` |
| Amber | `#e07014` |
| Green | `#1db87a` |

## License

MIT
