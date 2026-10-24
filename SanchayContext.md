**Sanchay WebApp Development Context File**  
**Version: 1.0 (March 2026)**  
**Purpose**: This file is the single source of truth for any AI coding assistant (Claude, GPT, Grok, Cursor, etc.) to build the full-stack Sanchay webapp.  
**Project Goal**: Build a plug-and-play **asset intelligence layer** that sits on top of existing government systems to track, optimise and re-use public assets (vehicles + public spaces) in Gwalior pilot, with clear path to state-wide scaling.

### 1. Project Vision & Problem Statement

Indian governments spend ~₹15.48 lakh crore annually on capital assets, but lack unified visibility → massive idle assets, reactive maintenance, duplicate purchases.  
Sanchay solves this by creating a **digital asset passport** for every asset with AI intelligence, real-time tracking, booking/re-use logic and immutable audit trails.

**Target Pilot**: Gwalior (Madhya Pradesh)  
**Initial Modules**:

1. Automobile Module
2. AssetSpace (Office/Public Spaces Module)  
   (Healthcare module will be added in Phase 2)

### 2. High-Level Architecture (to be followed strictly)

- **Frontend**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js + Express or NestJS (your choice)
- **Database**: MongoDB (for passports & events) + Redis (caching)
- **Time-series**: InfluxDB or TimescaleDB (telemetry)
- **Ledger**: Hyperledger Fabric (or simple MongoDB with tamper-proof timestamps for MVP)
- **Maps**: Leaflet + OpenStreetMap (free)
- **Auth**: JWT + Role-based (Clerk or Firebase Auth for speed)
- **Notifications**: WhatsApp Business API / Twilio + Email
- **Offline**: PWA (Workbox)
- **Deployment**: Vercel (frontend) + Railway/DigitalOcean (backend) or AWS for gov hosting later
- **API Style**: REST + GraphQL (for complex queries)

### 3. User Roles (RBAC)

- **Admin** – GMC Commissioner / Collector (full access, reports)
- **Department Officer** – Host (list spaces, approve bookings, view fleet)
- **Field Staff / Driver** – Update status, scan QR, report breakdown
- **Citizen / NGO** – Search & book spaces, report issues (read-only)
- **Auditor** – View immutable ledger & reports

### 4. Automobile Module – Complete Feature List

**Sectors**: GMC waste trucks, 108 ambulances, Police patrol + seized vehicles, PWD machinery, Health vans, Election vehicles.

**Features**:

- Real-time GPS map (color-coded pins)
- Trip logs + utilization charts + PDF export
- Compliance alerts (PUC, insurance)
- Idle detection (>6 months) + re-use suggestions
- Hybrid tracking: AIS-140 API + QR + PWA offline
- Predictive maintenance alerts
- Citizen/field photo reporting (PWA)
- SOS integration (forward from 108)
- Heatmap of idle clusters
- Immutable audit trail

**Integrations (Plug & Play)**:

- AIS-140 devices (Watsoo, trackNOW, GeoSafe) – TCP/IP or HTTP API
- VAHAN / NIC VLTD
- GeM Auction export link
- GMC Smart City ITMS (if available)

### 5. AssetSpace (Office/Public Spaces) Module – Complete Feature List

**Sectors**: Hospital rooms, school classrooms, community halls, PWD offices, secure transit rooms.

**Features** (Airbnb + Oyo style for public good):

- Interactive map + filters
- Digital Space Passport (photos, capacity, amenities, rules)
- Auto-listing suggestion for idle spaces (>3 days)
- Calendar booking system (day/hour slots)
- Approval workflow (auto for low-risk, manual for secure transit)
- Secure Transit Mode (police/prisoner holding – 24-hr limit)
- Maintenance ticket with photo upload
- Idle alerts + AI re-use suggestions (health camp, training, election, disaster)
- Emergency Pool filter
- Post-use rating & feedback
- PDF utilization reports + MP PAM portal sync
- QR check-in for entry

**Integrations (Plug & Play)**:

- MP PAM Portal (pam.mp.gov.in) – CSV import + future API
- Local municipal booking portals (GMC, DDA-style)
- Smart City IoT for occupancy (IUDX)
- Open Government Data (data.gov.in) for base list

### 6. Common Features Across All Modules

- Digital Asset Passport (core entity)
- AI Agents (idle detection, predictive risk, re-use matching)
- Role-based dashboards (Next.js)
- Offline-first PWA
- Notifications (SMS/WhatsApp/Email)
- PDF/CSV exports for audits
- Immutable ledger logging
- Citizen reporting module
- Heatmaps & analytics
- Multi-language support (Hindi + English – i18n)

### 7. Non-Functional Requirements

- **Performance**: Map loads < 2s, 1000+ assets on one view
- **Security**: JWT, HTTPS, data encryption, DPDP Act compliant, role-based strict access
- **Scalability**: Start with 500 assets in Gwalior, design for 50,000+ later
- **Offline Support**: 100% PWA (location cache + sync)
- **Accessibility**: WCAG 2.1 AA
- **Audit**: Every status change logged with timestamp + user

### 8. MVP Scope (Gwalior Pilot – First 3 Months)

**Phase 1 (MVP)**:

- User auth + roles
- Automobile: GPS map + trip logs + idle alerts (start with 108 + GMC trucks)
- AssetSpace: Map + passport + basic booking (start with 5 hospitals + 5 community halls)
- PDF reports + notifications
- PWA + offline

**Phase 2**:

- Hybrid tracking (QR + AIS-140)
- AI suggestions + secure transit mode
- PAM integration + maintenance tickets

### 9. Tech Stack Final Recommendation (for AI to follow)

```yaml
Frontend: Next.js 15 + TypeScript + Tailwind + shadcn/ui + Leaflet
Backend: NestJS (preferred) or Express
Database: MongoDB + Redis
Maps: Leaflet + OSM
Auth: Clerk / NextAuth
Notifications: Twilio + WhatsApp Business API
Charts: Recharts or Chart.js
PDF: pdf-lib or react-pdf
PWA: Next-PWA
Ledger: Hyperledger Fabric (or Mongo with hash for MVP)
```

### 10. Folder Structure (strictly follow)

```
/sanchay
├── apps/
│   ├── web/               ← Next.js frontend
│   └── api/               ← NestJS/Express backend
├── packages/
│   ├── types/             ← shared TypeScript types
│   ├── ui/                ← shadcn components
│   └── utils/             ← common functions
├── docs/
│   └── this-context.md    ← this file
```

**AI Coding Instructions**:

- Always refer to this file as the single source of truth.
- Use TypeScript everywhere.
- Make every screen mobile-first (PWA).
- Keep UI clean, government-friendly (blue-green color scheme).
- All features listed above must be implemented exactly as described.

This file is now ready.  
You can copy-paste it directly as context for any AI coding session.

Would you like me to also generate:

1. The exact Prisma/Mongoose schema?
2. API endpoint list?
3. Figma-style UI component list?
4. Or start writing the actual code for the first screen (e.g., Automobile Dashboard)?

Just say the word and we begin development. 🚀
