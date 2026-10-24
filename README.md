<p align="center">
	<img src="public/NationTrack.png" alt="NationTrack Logo" width="110" height="110" />
</p>

<h1 align="center">NationTrack</h1>

<p align="center"><strong>Public Asset Intelligence Platform for Operational Governance</strong></p>

<p align="center">
	Unified control layer for <strong>vehicles</strong>, <strong>medical operations</strong>, and <strong>civic spaces</strong> with digital passports, map workflows, governance controls, and audit visibility.
</p>

<p align="center">
	<img src="https://img.shields.io/badge/Framework-Next.js-111827?style=flat-square" alt="Next.js" />
	<img src="https://img.shields.io/badge/Language-TypeScript-2563EB?style=flat-square" alt="TypeScript" />
	<img src="https://img.shields.io/badge/UI-Tailwind%20%2B%20shadcn%2Fui-0F172A?style=flat-square" alt="Tailwind and shadcn" />
	<img src="https://img.shields.io/badge/Maps-Leaflet-16A34A?style=flat-square" alt="Leaflet" />
	<img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square" alt="Supabase" />
	<img src="https://img.shields.io/badge/Testing-Playwright-7C3AED?style=flat-square" alt="Playwright" />
</p>

---

## About NationTrack

NationTrack is designed for government and operations teams that need a single digital surface for tracking, allocating, and auditing public assets.

It connects:

- live operational maps
- role-based workflows
- booking and approval pipelines
- compliance and risk flags
- report and export surfaces

## Why NationTrack

- **Cross-domain visibility:** Vehicles, spaces, and medical assets in one platform
- **Operational control:** Structured approval paths and lifecycle state transitions
- **Audit readiness:** Event-oriented logs for governance and review
- **Field utility:** Map-first workflows with actionable context
- **Decision support:** Dashboard and report snapshots for administrators

## Core Modules

| Module      | Purpose                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| Dashboard   | Central overview, KPIs, quick operations actions                         |
| Automobiles | Fleet status, vehicle passports, compliance and idle workflows           |
| Medical     | Equipment exchange, medicine risk tracking, anomaly management           |
| Spaces      | Registry, booking lifecycle, idle-space activation, utilization insights |
| Bookings    | Approval, rejection, check-in/check-out, ratings                         |
| Audit       | Governance event history and verification surfaces                       |
| Reports     | CSV/PDF exports and analytics snapshots                                  |
| Admin       | Platform-level operational controls and settings                         |

## Primary Routes

- `/`
- `/dashboard`
- `/automobiles`
- `/automobiles/[id]`
- `/medical`
- `/spaces`
- `/spaces/[id]`
- `/bookings`
- `/audit`
- `/reports`
- `/settings`
- `/admin`

Legacy redirects maintained for compatibility:

- `/apps` -> `/dashboard`
- `/apps/[id]` -> `/dashboard`

---

## Technology

| Layer            | Stack                                 |
| ---------------- | ------------------------------------- |
| Frontend         | Next.js App Router, React, TypeScript |
| Styling          | Tailwind CSS                          |
| Component System | shadcn/ui, Radix UI, Lucide           |
| Mapping          | Leaflet, Marker Clustering            |
| Data and Auth    | Supabase Auth, Postgres, Storage      |
| Validation       | Zod                                   |
| Testing          | Playwright                            |

---

## Quick Start

### Prerequisites

- Node.js >= 20.11
- npm >= 10

### Run Locally

```bash
npm install
```

Create `.env.local` with the Supabase project credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Then apply the database schema once (Supabase Dashboard → SQL → New query) using
`supabase/schema.sql`, and start the app:

```bash
npm run dev
```

Open: http://localhost:3000

## Developer Scripts

```bash
npm run dev
npm run build
npm run start
npm run type-check
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run test
npm run test:ui
```

---

## Repository Layout

```text
src/
	app/          # App Router pages and API routes
	components/   # Reusable UI and domain components
	lib/          # Domain services and utilities
	types/        # Shared type contracts
docs/           # Project docs and module blueprints
tests/          # Playwright E2E suites
```

## Governance and Security Notes

- The database schema, RLS policies, realtime publication and transfer RPCs are
  versioned in `supabase/schema.sql`.
- API role checks are enforced for protected workflows.
- Run periodic dependency/security scans as part of release hygiene.

## Accessibility

The interface is built with accessibility in mind, including semantic structure and keyboard-friendly interactions. Accessibility issues may still exist, so manual verification is recommended with tools such as Accessibility Insights.

## Recent UX Highlights

- Symmetric tricolor-inspired landing ribbons
- Smooth hero text contrast adaptation over dynamic lighting
- Google Maps-style automobiles layout (left info panel, right controls)
- Improved map and panel fit with responsive viewport-aware sizing

---

## Contributing

1. Create a feature branch from `main`.
2. Keep changes scoped and traceable.
3. Run type-check and lint before PR.
4. Use clear, professional commit messages.

## License

This repository is currently maintained for project development use.
