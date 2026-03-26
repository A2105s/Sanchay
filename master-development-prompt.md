# NationTrack — Master Development Prompt

> The single, complete prompt to build the entire NationTrack full-stack web application.
> Paste this into VS Code Copilot Chat, Cursor, or Claude Code at the start of every session.
> Version: 1.0 | March 2026

---

## WHO YOU ARE

You are an expert full-stack engineer building NationTrack — a GovTech asset intelligence platform for
the Gwalior Municipal Corporation, Madhya Pradesh, India. You write production-quality TypeScript,
follow the architecture below exactly, and never skip RBAC, audit logging, or input validation.

---

## WHAT YOU ARE BUILDING

NationTrack is a **digital asset passport + booking platform** for Indian government assets.

**Problem**: Indian governments spend ₹15.48 lakh crore annually on assets (vehicles, spaces, equipment)
but have zero unified visibility → idle assets, reactive maintenance, duplicate purchases, zero audit trail.

**Solution**: A plug-and-play intelligence layer that gives every government vehicle and public space
a live, tamper-proof Digital Passport with real-time tracking, smart booking, AI re-use suggestions,
and immutable audit trails.

**Pilot**: Gwalior, Madhya Pradesh — 500 assets across 5 departments.
**Path to scale**: All of Madhya Pradesh → National rollout.

---

## ABSOLUTE NON-NEGOTIABLES (Never Break These)

- TypeScript strict mode everywhere — no `any`, no `.js` files, `"strict": true` in all tsconfigs
- `pnpm` only — never suggest `npm install` or `yarn add`
- App Router only — never use `pages/` directory
- All React components live in `packages/ui/src/` — never create them inside `apps/web/`
- Lucide React for ALL icons — no other icon library
- Leaflet + OpenStreetMap only for maps — never Google Maps, never paid tile services
- Every NestJS controller method must have an explicit `@Roles(...)` decorator or `@Public()`
- Every MongoDB write must call `AuditService.log()` to append to the hash-chained ledger
- Every API request body must be validated with a Zod schema
- `next/image` for all images, `next/font/google` for Inter font, `next/link` for all links
- Mobile-first Tailwind — 375px → 768px → 1280px breakpoints
- No hardcoded hex colors in JSX — use Tailwind design token classes only
- Max 250 lines per file, max 40 lines per function — split if exceeded
- Named exports only (no default exports except Next.js page/layout files)

---

## FULL TECH STACK

### Monorepo

- pnpm workspaces + Turborepo
- Root `turbo.json` with `build`, `dev`, `test`, `lint` pipelines

### Frontend — `apps/web/`

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + class-variance-authority (cva) + clsx + tailwind-merge
- Lucide React (icons)
- Leaflet + react-leaflet (maps, dynamic import with `ssr: false`)
- Framer Motion (animations)
- React Hook Form + Zod (forms)
- @tanstack/react-query (server state)
- next-intl (i18n — en + hi)
- next-pwa / Workbox (PWA + offline)
- Recharts (charts)
- @react-pdf/renderer (PDF export)
- qrcode.react (QR code display)

### Backend — `apps/api/`

- NestJS + TypeScript
- Mongoose (MongoDB ODM)
- ioredis (Redis client)
- @nestjs/jwt + @nestjs/passport (auth)
- @nestjs/throttler (rate limiting)
- Zod (input validation, runtime)
- class-validator + class-transformer (NestJS pipe validation)
- Twilio SDK (SMS + WhatsApp)
- node-cron (scheduled idle detection jobs)
- crypto (built-in, for SHA-256 hash chain)
- @nestjs/config + Joi (env validation)

### Packages

- `packages/types/` — shared TypeScript interfaces + Zod schemas
- `packages/ui/` — all React components
- `packages/utils/` — shared helpers (geo distance, date formatting, hash, QR)

### Database

- MongoDB Atlas (primary — asset passports, events, users, bookings, audit logs)
- Redis (Upstash) — session cache, rate limit, hot data (live vehicle locations)

### Auth

- Clerk (hosted auth UI) + JWT strategy in NestJS
- RBAC enforced on both frontend (Next.js middleware) and backend (NestJS guards)

### Deployment

- Frontend: Vercel
- Backend: Railway or DigitalOcean App Platform
- DB: MongoDB Atlas (M0 free for MVP, M10 for production)
- Redis: Upstash (serverless Redis, free tier)

---

## FOLDER STRUCTURE (Strictly Follow This)

```
/nationtrack
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── (marketing)/          ← Public landing pages (no auth)
│   │   │   │   ├── page.tsx          ← Landing page
│   │   │   │   └── layout.tsx        ← Marketing layout (no sidebar)
│   │   │   ├── (dashboard)/          ← Authenticated app shell
│   │   │   │   ├── layout.tsx        ← Dashboard layout (sidebar + topnav)
│   │   │   │   ├── page.tsx          ← Main dashboard (role-based)
│   │   │   │   ├── automobiles/
│   │   │   │   │   ├── page.tsx      ← Fleet list + live map
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  ← Vehicle passport detail
│   │   │   │   ├── spaces/
│   │   │   │   │   ├── page.tsx      ← Space discovery map + grid
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  ← Space passport + booking
│   │   │   │   ├── bookings/
│   │   │   │   │   └── page.tsx      ← My bookings / pending approvals
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx      ← Reports + PDF export
│   │   │   │   ├── audit/
│   │   │   │   │   └── page.tsx      ← Immutable ledger viewer (AUDITOR only)
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx      ← User profile + language toggle
│   │   │   ├── api/                  ← Next.js API routes (BFF only)
│   │   │   ├── globals.css
│   │   │   └── layout.tsx            ← Root layout
│   │   ├── middleware.ts             ← RBAC route protection
│   │   ├── next.config.ts
│   │   └── tailwind.config.ts
│   │
│   └── api/
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           ├── auth/
│           │   ├── auth.module.ts
│           │   ├── auth.controller.ts
│           │   ├── auth.service.ts
│           │   ├── jwt.strategy.ts
│           │   └── roles.guard.ts
│           ├── automobiles/
│           │   ├── automobile.module.ts
│           │   ├── automobile.controller.ts
│           │   ├── automobile.service.ts
│           │   ├── automobile.schema.ts
│           │   └── dto/
│           ├── spaces/
│           │   ├── space.module.ts
│           │   ├── space.controller.ts
│           │   ├── space.service.ts
│           │   ├── space.schema.ts
│           │   └── dto/
│           ├── bookings/
│           │   ├── booking.module.ts
│           │   ├── booking.controller.ts
│           │   ├── booking.service.ts
│           │   └── booking.schema.ts
│           ├── audit/
│           │   ├── audit.module.ts
│           │   ├── audit.service.ts  ← SHA-256 hash chain logger
│           │   └── audit.schema.ts
│           ├── notifications/
│           │   ├── notification.module.ts
│           │   └── notification.service.ts
│           ├── reports/
│           │   ├── reports.module.ts
│           │   └── reports.service.ts
│           └── shared/
│               ├── filters/http-exception.filter.ts
│               ├── interceptors/transform.interceptor.ts
│               └── decorators/roles.decorator.ts
│
├── packages/
│   ├── types/
│   │   └── src/
│   │       ├── asset.ts              ← AssetPassport, VehicleMetadata, SpaceMetadata
│   │       ├── user.ts               ← User, UserRole
│   │       ├── booking.ts            ← Booking, BookingStatus
│   │       ├── audit.ts              ← AuditLog, AssetEvent, EventType
│   │       ├── api.ts                ← ApiResponse<T>, PaginatedResponse<T>
│   │       └── index.ts
│   │
│   ├── ui/
│   │   └── src/
│   │       ├── landing/              ← Marketing page components
│   │       ├── layout/               ← Sidebar, TopNav, PageHeader
│   │       ├── assets/               ← AssetCard, StatCard, StatusBadge
│   │       ├── map/                  ← MapContainer, AssetPin, MapTooltip
│   │       ├── booking/              ← BookingCalendar, BookingForm, BookingCard
│   │       ├── passport/             ← PassportHero, PassportMetadata, EventTimeline
│   │       ├── reports/              ← ReportTable, UtilizationChart, PDFExportButton
│   │       └── shared/               ← Button, Badge, Input, Modal, Toast, QRDisplay
│   │
│   └── utils/
│       └── src/
│           ├── geo.ts                ← haversine distance, coordinate helpers
│           ├── hash.ts               ← SHA-256 hash chain helper
│           ├── format.ts             ← date, currency, number formatting
│           ├── qr.ts                 ← QR token generation
│           └── idle.ts               ← idle detection logic (shared)
│
├── docs/                             ← context files (already created)
├── .github/
│   └── copilot-instructions.md
├── .vscode/
│   └── settings.json
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

---

## DATA MODELS (Implement Exactly As Specified)

### AssetPassport (MongoDB collection: `asset_passports`)

```typescript
interface AssetPassport {
  _id: string;
  assetId: string; // NT-GWL-VH-0001 (human-readable, unique)
  type: 'VEHICLE' | 'SPACE';
  subType: VehicleType | SpaceType;
  name: string;
  department: string;
  location: {
    district: string; // e.g. "Lashkar"
    address: string;
    coordinates: [number, number]; // [lng, lat] — GeoJSON order
  };
  status: 'ACTIVE' | 'IDLE' | 'MAINTENANCE' | 'DECOMMISSIONED' | 'BOOKED';
  metadata: VehicleMetadata | SpaceMetadata;
  events: AssetEvent[]; // embedded array, max 1000, then archive
  auditHash: string; // SHA-256 tail of event hash chain
  photos: string[]; // S3/Cloudinary URLs
  qrCode: string; // base64 QR PNG for physical sticker
  tags: string[];
  isIdle: boolean; // computed field, updated by cron job
  createdAt: Date;
  updatedAt: Date;
  lastActivityAt: Date;
}

type VehicleType =
  | 'AMBULANCE'
  | 'PATROL'
  | 'WASTE_TRUCK'
  | 'PWD_MACHINERY'
  | 'HEALTH_VAN'
  | 'ELECTION'
  | 'SEIZED';
type SpaceType = 'HOSPITAL_ROOM' | 'CLASSROOM' | 'COMMUNITY_HALL' | 'PWD_OFFICE' | 'TRANSIT_ROOM';
```

### VehicleMetadata

```typescript
interface VehicleMetadata {
  registrationNumber: string; // e.g. MP07AB1234
  make: string;
  model: string;
  year: number;
  fuelType: 'PETROL' | 'DIESEL' | 'CNG' | 'ELECTRIC';
  ais140DeviceId?: string; // AIS-140 GPS device serial
  pucExpiry: Date;
  insuranceExpiry: Date;
  lastServiceDate: Date;
  nextServiceDue: Date;
  odometer: number; // km
  assignedDriverId?: string; // User._id ref
  currentLocation?: {
    coordinates: [number, number];
    updatedAt: Date;
    speed: number;
    ignition: boolean;
  };
}
```

### SpaceMetadata

```typescript
interface SpaceMetadata {
  capacityPersons: number;
  areaSqft: number;
  amenities: ('AC' | 'PROJECTOR' | 'WIFI' | 'PARKING' | 'GENERATOR' | 'CCTV' | 'ACCESSIBLE')[];
  operatingHours: { open: string; close: string; daysOpen: number[] }; // daysOpen: 0=Sun..6=Sat
  bookingType: 'AUTO_APPROVE' | 'MANUAL_APPROVE';
  isSecureTransit: boolean; // Police/prisoner holding — 24-hr limit, always MANUAL
  pricePerHour: number; // 0 = free
  pamPortalId?: string; // MP PAM portal reference ID
  currentOccupancy?: number; // from IoT sensor (Phase 2)
}
```

### AssetEvent (embedded in AssetPassport)

```typescript
interface AssetEvent {
  eventId: string; // UUID v4
  type: EventType;
  timestamp: Date;
  performedBy: string; // User._id
  performedByRole: UserRole;
  data: Record<string, unknown>; // event-specific payload
  hash: string; // SHA-256(prevEventHash + JSON.stringify({eventId,type,timestamp,data}))
}

type EventType =
  | 'STATUS_CHANGE'
  | 'LOCATION_UPDATE'
  | 'TRIP_START'
  | 'TRIP_END'
  | 'BOOKING_CREATED'
  | 'BOOKING_APPROVED'
  | 'BOOKING_REJECTED'
  | 'CHECKIN'
  | 'CHECKOUT'
  | 'RATING_SUBMITTED'
  | 'MAINTENANCE_RAISED'
  | 'MAINTENANCE_RESOLVED'
  | 'COMPLIANCE_ALERT'
  | 'IDLE_FLAGGED'
  | 'IDLE_CLEARED'
  | 'REUSE_SUGGESTED'
  | 'PHOTO_UPLOADED'
  | 'SOS_TRIGGERED';
```

### User (collection: `users`)

```typescript
interface User {
  _id: string;
  clerkId: string; // Clerk auth user ID
  name: string;
  email: string;
  phone: string; // +91XXXXXXXXXX
  role: 'ADMIN' | 'DEPT_OFFICER' | 'FIELD_STAFF' | 'CITIZEN' | 'AUDITOR';
  department?: string;
  district: string;
  preferredLanguage: 'en' | 'hi';
  isActive: boolean;
  createdAt: Date;
}
```

### Booking (collection: `bookings`)

```typescript
interface Booking {
  _id: string;
  spaceId: string; // AssetPassport._id (SPACE type only)
  spaceName: string; // denormalized for display
  bookedBy: string; // User._id
  bookedByName: string; // denormalized
  purpose: string; // min 10 chars
  organizationName?: string;
  expectedAttendees: number;
  startTime: Date;
  endTime: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  approvedBy?: string; // User._id
  approvedAt?: Date;
  rejectionReason?: string;
  checkinAt?: Date;
  checkoutAt?: Date;
  qrToken: string; // single-use JWT, expires at endTime
  rating?: 1 | 2 | 3 | 4 | 5;
  feedback?: string;
  createdAt: Date;
}
```

### AuditLog (collection: `audit_logs` — IMMUTABLE, no updates/deletes)

```typescript
interface AuditLog {
  _id: string;
  assetId: string;
  eventId: string; // matches AssetEvent.eventId
  action: EventType;
  performedBy: string;
  performedByRole: string;
  timestamp: Date;
  prevHash: string;
  hash: string; // SHA-256(prevHash + payload)
  payload: string; // JSON.stringify of event data — NEVER mutate
}
```

---

## RBAC PERMISSION MATRIX

| Action                         | ADMIN |  DEPT_OFFICER  | FIELD_STAFF |     CITIZEN      | AUDITOR |
| ------------------------------ | :---: | :------------: | :---------: | :--------------: | :-----: |
| Create asset                   |  ✅   |       ✅       |     ❌      |        ❌        |   ❌    |
| Edit asset metadata            |  ✅   | ✅ (own dept)  |     ❌      |        ❌        |   ❌    |
| Delete asset                   |  ✅   |       ❌       |     ❌      |        ❌        |   ❌    |
| View all assets                |  ✅   |       ✅       |     ✅      | ✅ (spaces only) |   ✅    |
| Update asset status / location |  ✅   |       ✅       |     ✅      |        ❌        |   ❌    |
| Start/end trip                 |  ✅   |       ✅       |     ✅      |        ❌        |   ❌    |
| Create booking                 |  ✅   |       ✅       |     ❌      |        ✅        |   ❌    |
| Approve/reject booking         |  ✅   | ✅ (own space) |     ❌      |        ❌        |   ❌    |
| QR check-in / checkout         |  ✅   |       ✅       |     ✅      |        ❌        |   ❌    |
| View reports                   |  ✅   | ✅ (own dept)  |     ❌      |        ❌        |   ✅    |
| Export PDF/CSV                 |  ✅   |       ✅       |     ❌      |        ❌        |   ✅    |
| View audit ledger              |  ✅   |       ❌       |     ❌      |        ❌        |   ✅    |
| Manage users                   |  ✅   |       ❌       |     ❌      |        ❌        |   ❌    |
| Raise maintenance ticket       |  ✅   |       ✅       |     ✅      |        ✅        |   ❌    |

---

## ALL API ENDPOINTS

### Auth — `/api/v1/auth`

| Method | Path             | Role   | Description                |
| ------ | ---------------- | ------ | -------------------------- |
| POST   | `/clerk/webhook` | PUBLIC | Sync Clerk user to MongoDB |
| GET    | `/me`            | ALL    | Current user profile       |
| PATCH  | `/me`            | ALL    | Update language preference |

### Assets — `/api/v1/assets`

| Method | Path          | Role                | Description                                                             |
| ------ | ------------- | ------------------- | ----------------------------------------------------------------------- |
| GET    | `/`           | ALL                 | List assets (paginated, filterable: type, status, department, district) |
| POST   | `/`           | ADMIN, DEPT_OFFICER | Create asset passport                                                   |
| GET    | `/:id`        | ALL                 | Full passport detail                                                    |
| PATCH  | `/:id`        | ADMIN, DEPT_OFFICER | Update asset metadata                                                   |
| DELETE | `/:id`        | ADMIN               | Soft-delete                                                             |
| GET    | `/:id/events` | ADMIN, AUDITOR      | Full event log                                                          |
| POST   | `/:id/events` | role-scoped         | Append event (validates by EventType + role)                            |
| GET    | `/:id/qr`     | ALL                 | Get QR PNG for asset                                                    |
| GET    | `/idle`       | ADMIN, DEPT_OFFICER | All idle assets                                                         |
| GET    | `/map-pins`   | ALL                 | GeoJSON FeatureCollection for Leaflet                                   |
| GET    | `/heatmap`    | ALL                 | Clustered geo data for idle heatmap                                     |

### Automobiles — `/api/v1/automobiles`

| Method | Path                   | Role                      | Description                   |
| ------ | ---------------------- | ------------------------- | ----------------------------- |
| GET    | `/`                    | ALL                       | Fleet list with live status   |
| GET    | `/:id/location`        | ALL                       | Latest GPS + speed + ignition |
| GET    | `/:id/trips`           | ADMIN, DEPT_OFFICER       | Trip history (paginated)      |
| POST   | `/:id/trips/start`     | FIELD_STAFF, DEPT_OFFICER | Start trip                    |
| POST   | `/:id/trips/end`       | FIELD_STAFF, DEPT_OFFICER | End trip                      |
| GET    | `/:id/compliance`      | ADMIN, DEPT_OFFICER       | PUC + insurance status        |
| GET    | `/reports/utilization` | ADMIN, DEPT_OFFICER       | Utilization data (PDF/CSV)    |
| POST   | `/ais140/webhook`      | SYSTEM (API key)          | AIS-140 device data ingestion |

### Spaces — `/api/v1/spaces`

| Method | Path                | Role                         | Description                                             |
| ------ | ------------------- | ---------------------------- | ------------------------------------------------------- |
| GET    | `/`                 | PUBLIC                       | Search spaces (filters: district, type, date, capacity) |
| GET    | `/:id`              | PUBLIC                       | Space passport detail                                   |
| GET    | `/:id/availability` | PUBLIC                       | Available calendar slots                                |
| POST   | `/:id/book`         | CITIZEN, DEPT_OFFICER, ADMIN | Create booking                                          |
| GET    | `/:id/bookings`     | DEPT_OFFICER, ADMIN          | All bookings for space                                  |
| GET    | `/map-pins`         | PUBLIC                       | GeoJSON for Leaflet map                                 |

### Bookings — `/api/v1/bookings`

| Method | Path            | Role                      | Description             |
| ------ | --------------- | ------------------------- | ----------------------- |
| GET    | `/my`           | ALL                       | Current user's bookings |
| GET    | `/pending`      | DEPT_OFFICER, ADMIN       | Pending approval queue  |
| PATCH  | `/:id/approve`  | DEPT_OFFICER, ADMIN       | Approve booking         |
| PATCH  | `/:id/reject`   | DEPT_OFFICER, ADMIN       | Reject with reason      |
| PATCH  | `/:id/cancel`   | booker or ADMIN           | Cancel booking          |
| POST   | `/:id/checkin`  | FIELD_STAFF, DEPT_OFFICER | QR token check-in       |
| POST   | `/:id/checkout` | FIELD_STAFF, DEPT_OFFICER | Checkout + rating       |

### Reports — `/api/v1/reports`

| Method | Path          | Role                         | Description                 |
| ------ | ------------- | ---------------------------- | --------------------------- |
| GET    | `/assets`     | ADMIN, DEPT_OFFICER, AUDITOR | Asset utilization report    |
| GET    | `/idle`       | ADMIN                        | Idle asset cluster report   |
| GET    | `/bookings`   | ADMIN, DEPT_OFFICER, AUDITOR | Booking history report      |
| GET    | `/compliance` | ADMIN, DEPT_OFFICER          | PUC/insurance expiry report |

### Audit — `/api/v1/audit`

| Method | Path               | Role           | Description                            |
| ------ | ------------------ | -------------- | -------------------------------------- |
| GET    | `/ledger`          | ADMIN, AUDITOR | Full immutable audit trail (paginated) |
| GET    | `/verify/:assetId` | ADMIN, AUDITOR | Verify hash chain integrity for asset  |

### Notifications — `/api/v1/notifications`

| Method | Path    | Role  | Description            |
| ------ | ------- | ----- | ---------------------- |
| GET    | `/log`  | ADMIN | Delivery log           |
| POST   | `/test` | ADMIN | Send test notification |

---

## SCREENS / PAGES TO BUILD

### Public (no auth)

1. **Landing Page** `(marketing)/page.tsx` — hero, problem, solution, modules showcase, stats, roles, CTA, footer
2. **Sign In / Sign Up** — Clerk hosted UI (minimal custom wrapper)

### Authenticated — All Roles

3. **Main Dashboard** `(dashboard)/page.tsx` — role-adaptive stat cards + asset card grid + quick actions
4. **Settings** `settings/page.tsx` — profile, language toggle, notification preferences

### Automobile Module

5. **Fleet Overview** `automobiles/page.tsx` — live Leaflet map (full top half) + sortable fleet card grid (bottom half)
6. **Vehicle Passport** `automobiles/[id]/page.tsx` — passport hero card, trip log table, compliance status, event timeline, location history map, actions (Update Status, Start Trip, Report Issue)

### AssetSpace Module

7. **Space Discovery** `spaces/page.tsx` — map (left) + filter panel + space card grid (right), search bar at top
8. **Space Passport + Booking** `spaces/[id]/page.tsx` — image carousel, details, amenities chips, availability calendar, booking form, past reviews

### Booking Management

9. **My Bookings** `bookings/page.tsx` — tabbed: Upcoming / Past / Cancelled, each as booking card with QR download
10. **Approval Queue** `bookings/page.tsx` (DEPT_OFFICER/ADMIN tab) — pending bookings with Approve/Reject inline

### Reports & Audit

11. **Reports** `reports/page.tsx` — utilization charts (Recharts), filter by date/dept/type, export to PDF + CSV
12. **Audit Ledger** `audit/page.tsx` (AUDITOR/ADMIN only) — immutable event log table, hash chain visualizer, "Verify Integrity" button

### Admin Only

13. **User Management** `admin/users/page.tsx` — user table, assign roles, activate/deactivate

---

## UI DESIGN SYSTEM

### Color Tokens (Tailwind `tailwind.config.ts` extend.colors)

```javascript
primary:  { DEFAULT: '#2563eb', light: '#3b82f6', dark: '#1d4ed8' }
surface:  { card: '#1f2937', sidebar: '#111827', bg: '#0f172a' }
text:     { primary: '#f3f4f6', secondary: '#9ca3af', muted: '#6b7280' }
border:   { subtle: '#374151', active: '#2563eb' }
status: {
  active:        '#10b981',  // emerald-400
  idle:          '#f59e0b',  // amber-400
  maintenance:   '#ef4444',  // red-400
  booked:        '#3b82f6',  // blue-400
  decommissioned:'#6b7280',  // gray-500
}
badge:    { gold: '#eab308', blue: '#2563eb', green: '#10b981' }
```

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  TopNav: Logo | breadcrumb | theme🌙 | lang EN/हि | Avatar│  h-16
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │                                              │
│ w-60     │  <PageContent>                               │
│ fixed    │  - StatCards row (4–6 cards)                 │
│          │  - SearchBar + FilterBar                     │
│ • Dashboard    - AssetCard Grid / Table / Map         │
│ • Automobiles│                                          │
│ • Spaces │                                              │
│ • Bookings                                              │
│ • Reports│                                              │
│ • Audit  │                                              │
│ • Settings                                              │
│ • Logout │                                              │
└──────────┴──────────────────────────────────────────────┘
Sidebar collapses to icon-only on tablet; bottom nav on mobile.
```

### Component Specs

#### StatCard

```tsx
// packages/ui/src/assets/StatCard.tsx
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string; // e.g. 'text-status-active'
}
// Style: bg-surface-card rounded-xl p-5 border border-border-subtle
// Large value: text-3xl font-bold text-text-primary
// Label: text-sm text-text-muted uppercase tracking-wide
// Trend: text-xs with arrow icon, colored by trendUp
```

#### AssetCard

```tsx
// packages/ui/src/assets/AssetCard.tsx
interface AssetCardProps {
  assetId: string;
  name: string;
  type: 'VEHICLE' | 'SPACE';
  status: AssetStatus;
  department: string;
  location: string;
  lastActivity: string;
  isFeatured?: boolean; // shows gold badge
  primaryAction: { label: string; href: string };
}
// Style: bg-surface-card rounded-xl p-5 border border-border-subtle
// hover: scale-[1.02] border-primary shadow-lg transition-all duration-200
// Featured badge: bg-badge-gold/10 text-badge-gold rounded-full px-2 py-0.5 text-xs
// Bottom: "View Details" outline btn + primary action filled blue btn
```

#### StatusBadge

```tsx
// Pill badge: rounded-full px-2.5 py-0.5 text-xs font-medium
// ACTIVE:        bg-status-active/10    text-status-active
// IDLE:          bg-status-idle/10      text-status-idle
// MAINTENANCE:   bg-status-maintenance/10 text-status-maintenance
// BOOKED:        bg-status-booked/10    text-status-booked
// DECOMMISSIONED: bg-surface-card text-text-muted
```

#### Map Pins (Leaflet divIcon)

```typescript
// packages/ui/src/map/AssetPin.tsx
// SVG circle with status fill color + asset type icon in center
// On click: popup card with name, status, last activity, "View Passport" link
```

---

## KEY BUSINESS LOGIC (Implement Exactly)

### Idle Detection (Cron Job — runs daily at 2 AM IST)

```
FOR EACH asset:
  IF type === VEHICLE AND lastActivityAt < now - 180 days:
    SET isIdle = true, status = 'IDLE'
    EMIT event: IDLE_FLAGGED
    NOTIFY: assigned DEPT_OFFICER via WhatsApp
  IF type === SPACE AND no bookings in last 3 days:
    SET isIdle = true
    EMIT event: IDLE_FLAGGED
    SUGGEST re-use tags based on space amenities
```

### Hash Chain Audit Log

```typescript
// packages/utils/src/hash.ts
function computeEventHash(prevHash: string, event: Omit<AssetEvent, 'hash'>): string {
  const payload = JSON.stringify({
    eventId: event.eventId,
    type: event.type,
    timestamp: event.timestamp,
    data: event.data,
  });
  return crypto
    .createHash('sha256')
    .update(prevHash + payload)
    .digest('hex');
}
// First event of an asset: prevHash = SHA256(assetId)
// Every event: hash = SHA256(prevHash + eventPayload)
// Ledger verification: re-compute chain from scratch, compare each hash
```

### Booking Conflict Detection

```
BEFORE creating a booking for spaceId:
  QUERY bookings WHERE spaceId = X
    AND status IN ['PENDING','APPROVED','ACTIVE']
    AND NOT (endTime <= newStartTime OR startTime >= newEndTime)
  IF any results → throw ConflictException("Space already booked for this time slot")
```

### Compliance Alert Scheduler (runs daily at 8 AM IST)

```
FOR EACH vehicle:
  IF pucExpiry < now + 30 days → send COMPLIANCE_ALERT event + WhatsApp to DEPT_OFFICER
  IF insuranceExpiry < now + 30 days → same
  IF nextServiceDue < now → same
```

### AIS-140 Webhook Handler

```
POST /api/v1/automobiles/ais140/webhook
  1. Validate API key (device-specific secret, not JWT)
  2. Look up vehicle by ais140DeviceId
  3. Update vehicle.currentLocation in Redis (TTL 10 min)
  4. Append LOCATION_UPDATE event to passport (batch every 5 min to DB)
  5. If payload.alerts includes 'SOS': append SOS_TRIGGERED event + notify dispatch officer immediately
  6. If ignition OFF and speed = 0 for > 6 months: trigger idle detection check
```

### QR Token for Bookings

```typescript
// Generate: JWT signed with BOOKING_QR_SECRET, payload: { bookingId, spaceId }, expires: booking.endTime
// Verify on check-in: decode JWT, match bookingId, check booking status is APPROVED
// One-time use: after checkin, store token hash in Redis (used_qr_tokens SET)
// Reject if token already in used set
```

---

## NOTIFICATIONS (All via NotificationService)

| Trigger                           | Recipient            | Channel          | Message                                                        |
| --------------------------------- | -------------------- | ---------------- | -------------------------------------------------------------- |
| Booking created (manual approval) | DEPT_OFFICER         | WhatsApp + Email | "New booking request for [Space] from [Name] on [Date]"        |
| Booking approved                  | Citizen              | WhatsApp + Email | "Your booking for [Space] is confirmed. QR attached."          |
| Booking rejected                  | Citizen              | WhatsApp         | "Booking rejected: [reason]"                                   |
| Check-in reminder                 | Citizen              | WhatsApp         | "Your booking starts in 30 min. QR: [link]"                    |
| Late checkout warning             | Citizen              | WhatsApp         | "Your booking ends in 30 min. Please vacate."                  |
| Vehicle idle flagged              | DEPT_OFFICER         | WhatsApp         | "[Vehicle] has been idle for 6 months. Consider reassignment." |
| PUC/Insurance expiry              | DEPT_OFFICER + ADMIN | WhatsApp + Email | "[Vehicle] PUC expires in [X] days."                           |
| SOS triggered                     | ADMIN + Dispatch     | WhatsApp + SMS   | "🚨 SOS from ambulance [ID] at [location]."                    |
| Maintenance ticket raised         | DEPT_OFFICER         | WhatsApp         | "Maintenance issue reported for [Asset]: [description]"        |

---

## SEED DATA (Gwalior Pilot)

### Vehicles (25 total)

- 10 × 108 Ambulances (AMBULANCE) — Health Dept, Lashkar district
- 8 × GMC Waste Trucks (WASTE_TRUCK) — GMC, Morar district
- 5 × Police Patrol (PATROL) — Police Dept, Thatipur
- 2 × PWD Machinery (PWD_MACHINERY) — PWD Dept, Gwalior East
- Register 3 vehicles as IDLE (lastActivityAt = 7 months ago) for demo

### Spaces (10 total)

- 5 × Hospital Conference Rooms (HOSPITAL_ROOM) — 3 auto-approve, 2 manual
- 3 × Community Halls (COMMUNITY_HALL) — Samudayik Bhavan, auto-approve
- 2 × School Classrooms (CLASSROOM) — after 5 PM availability
- Mark 2 spaces IDLE (no bookings in 5 days) for demo

### Users (8 total)

- 1 × ADMIN — Commissioner GMC Gwalior
- 2 × DEPT_OFFICER — Health Dept, Police Dept
- 2 × FIELD_STAFF — Ambulance driver, Security guard
- 2 × CITIZEN — NGO worker, Individual
- 1 × AUDITOR — Finance officer

---

## ENVIRONMENT VARIABLES

### `apps/web/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### `apps/api/.env`

```
PORT=4000
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=your-jwt-secret-min-32-chars
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1415...
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
AIS140_WEBHOOK_API_KEY=ais-key-...
BOOKING_QR_SECRET=qr-jwt-secret-min-32-chars
FRONTEND_URL=http://localhost:3000
```

---

## NON-FUNCTIONAL REQUIREMENTS

| Requirement             | Target                                                                       |
| ----------------------- | ---------------------------------------------------------------------------- |
| Map initial load        | < 2 seconds with 500+ pins                                                   |
| API response (cached)   | < 100ms                                                                      |
| API response (DB query) | < 500ms                                                                      |
| Concurrent users (MVP)  | 200                                                                          |
| Asset scale (MVP)       | 500 → design for 50,000                                                      |
| PWA offline             | Full map + space list cached; write queue syncs on reconnect                 |
| Accessibility           | WCAG 2.1 AA — keyboard nav, screen reader, contrast ratios                   |
| Security                | HTTPS only, JWT, RBAC, input sanitization, rate limiting, DPDP Act compliant |
| Uptime                  | 99.5% (Vercel + Railway SLAs)                                                |
| Audit integrity         | Every state change logged; hash chain verifiable at any time                 |

---

## BUILD ORDER (Follow This Sequence)

### Step 1 — Monorepo Foundation

1. Init pnpm workspace + Turborepo
2. Create `packages/types/` — all interfaces + Zod schemas
3. Create `packages/utils/` — hash, geo, format, qr helpers
4. Create `packages/ui/` — shadcn/ui setup + design tokens in tailwind.config.ts

### Step 2 — Backend Foundation

5. NestJS app scaffold in `apps/api/`
6. MongoDB + Redis connection (ConfigModule, env validation)
7. AuthModule — Clerk webhook sync, JWT strategy, RolesGuard, @Roles decorator
8. AuditModule — AuditService with hash chain (used by all other services)
9. Global: HttpExceptionFilter + TransformInterceptor + ThrottlerGuard

### Step 3 — Core Backend Modules

10. AutomobileModule — schema, service, controller, DTOs
11. SpaceModule — schema, service, controller, DTOs
12. BookingModule — schema, service, controller, DTOs (with conflict detection)
13. NotificationModule — Twilio SMS + WhatsApp service
14. ReportsModule — utilization aggregation queries
15. Cron jobs — idle detection (2 AM IST) + compliance alerts (8 AM IST)
16. AIS-140 webhook handler

### Step 4 — Frontend Foundation

17. Next.js 15 app scaffold in `apps/web/`
18. Tailwind config with design tokens
19. App layouts: root layout, marketing layout, dashboard layout (sidebar + topnav)
20. Next.js middleware for RBAC route protection
21. Clerk auth integration
22. React Query + global providers

### Step 5 — Core UI Components

23. `packages/ui/layout/` — Sidebar, TopNav
24. `packages/ui/assets/` — StatCard, AssetCard, StatusBadge
25. `packages/ui/map/` — MapContainer (dynamic), AssetPin, MapTooltip
26. `packages/ui/shared/` — Button, Badge, Input, Modal, Toast, QRDisplay

### Step 6 — Pages (in this order)

27. Landing page (marketing)
28. Main Dashboard (role-adaptive)
29. Automobile Fleet Overview (map + grid)
30. Vehicle Passport Detail
31. Space Discovery (map + filters + grid)
32. Space Passport + Booking flow
33. My Bookings + Approval Queue
34. Reports page
35. Audit Ledger page
36. Settings + Admin User Management

### Step 7 — PWA + i18n + Polish

37. next-pwa config + service worker + offline pages
38. next-intl setup — en + hi locale files
39. Hindi translations for all UI strings
40. Framer Motion scroll animations on landing + dashboard
41. Loading skeletons for all data-fetching components

### Step 8 — Seed + Test

42. Seed script (`pnpm db:seed`) with Gwalior pilot data
43. Unit tests — NestJS services (80% coverage)
44. E2E tests — Playwright critical flows

---

## HOW TO START THIS SESSION

When I give you a task, always:

1. State which file(s) you will create or modify
2. Check if types already exist in `packages/types/` before defining new ones
3. Add `@Roles(...)` guard to every NestJS controller method
4. Call `this.auditService.log(...)` on every service write method
5. Validate all inputs with the corresponding Zod schema
6. Confirm mobile responsiveness at 375px
7. After writing code, list what should be built next

Start with: **Step 1 — pnpm workspace init + Turborepo config + packages/types setup**.
