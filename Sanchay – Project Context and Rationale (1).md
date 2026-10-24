# Sanchay – Project Context and Rationale

## 1. Background

India is making record investments in public infrastructure and capital assets.  
Union Budget 2025–26 allocates around **₹11.21 lakh crore** for capital expenditure, continuing a strong infrastructure‑led growth strategy.[web:67][web:68][web:109]  
Government press releases further show that effective public capital expenditure for FY26 is projected at about **₹15.48 lakh crore**, and capital outlay has increased more than fourfold since FY18.[web:40]

However, multiple studies on public land and assets in India highlight that there is **no reliable, central, up‑to‑date inventory** of public assets, which makes it difficult to identify idle or surplus assets and redeploy or monetise them.[web:36][web:49] At the city and department level, this translates into scattered spreadsheets, legacy applications and paper registers for vehicles, equipment, buildings and other assets.

Sanchay is conceived as an **asset intelligence layer** that sits above existing systems and helps governments see, understand and optimise what they already own, instead of merely buying more.

---

## 2. Problem Context

### 2.1 Macro‑level issues

- Massive, rising capital expenditure on transport, urban infrastructure, health facilities and public buildings, but **weak visibility** into the utilisation and condition of the resulting assets.[web:40][web:67]
- Lack of a consolidated, regularly updated register of public assets and land across ministries, states and public sector undertakings.[web:36][web:49]
- Increasing pressure on public finances and climate commitments, which makes wasteful or duplicated asset creation unsustainable.[web:93][web:97]

### 2.2 Micro‑level pain points

Across departments (transport, health, urban local bodies, education), recurring problems appear:

- **Data silos and fragmentation** – separate tools or registers for fleets, buildings, equipment and IT, often based on Excel or paper.[web:43][web:44]
- **No real‑time view** – difficulty answering “Where is this asset now?”, “Is it working or idle?”, “Who is responsible?”.[web:41][web:44]
- **Reactive maintenance** – repairs occur after breakdowns or on rigid time schedules, leading to higher downtime and costs compared with predictive approaches.[web:38][web:78]
- **Weak audit trails** – incomplete histories of ownership, movement and maintenance, which complicate audits and reduce accountability.[web:41][web:48]
- **Duplicate procurement and under‑utilisation** – idle assets sit unused in one location while shortages are reported elsewhere, forcing new purchases.[web:36][web:49]

### 2.3 Formal problem statement

> Indian governments at union, state and local levels invest lakhs of crores of rupees annually in vehicles, medical equipment, buildings and other public assets, yet lack a unified, intelligent system to track, maintain and govern these assets across their lifecycle.  
> This results in idle or misallocated assets, reactive maintenance, incomplete audit trails and sub‑optimal service delivery.

---

## 3. Relevance to SDG 11 – Sustainable Cities and Communities

SDG 11 calls for cities that are **inclusive, safe, resilient and sustainable**, highlighting the need for reliable infrastructure, efficient public transport, resilient services and participatory governance.[web:89][web:91][web:97]  
Without strong asset intelligence, investments intended to support SDG 11 can instead create stranded, poorly used assets.

Sanchay contributes to SDG 11 by:

- Improving **reliability and utilisation** of public fleets, equipment and buildings, which underpins safe transport, health services and emergency response.[web:90][web:92]
- Enabling **resource efficiency and resilience**, by extending asset lifetimes and helping cities redeploy assets quickly in disasters.
- Supporting **participatory and data‑driven governance**, through citizen reporting, transparent dashboards and audit‑ready records.[web:91][web:96]

---

## 4. Opportunity and Impact Rationale

### 4.1 Economic opportunity

With annual capex of ~₹11.2 lakh crore at the Union level and even higher effective public capex, **even small percentage gains** in utilisation and maintenance efficiency translate into very large savings.[web:68][web:40][web:109]

Predictive‑maintenance case studies across fleets and logistics demonstrate:

- Up to **20% reduction in maintenance costs**.
- Up to **50% reduction in unplanned downtime**.
- Increases in vehicle availability of around 15–20%.[web:38][web:78][web:108]

If similar gains are applied to government fleets and equipment, and if just a few percent of duplicate or avoidable asset purchases can be prevented, the savings and service improvements are potentially worth **thousands of crores** annually.

### 4.2 Social and environmental impact

- More reliable ambulances, buses and emergency vehicles mean **faster response times** and better outcomes for vulnerable communities.[web:90][web:92]
- Better‑maintained and shared assets reduce the need for manufacturing new units, lowering lifecycle **material and carbon footprints**.[web:93][web:97]
- Unlocking surplus or under‑used public buildings supports more inclusive use of public space—e.g., shelters, training centres, community hubs.[web:36][web:88]

---

## 5. Existing Approaches and Gaps

### 5.1 Current asset‑management tools

Commercial and government‑oriented asset platforms (e.g. fixed‑asset suites, RFID/ITAM systems) typically provide:

- Centralised asset registers and depreciation tracking.
- Barcode/RFID tagging for audits.
- Scheduled maintenance reminders and work‑order workflows.
- Compliance and financial reporting dashboards.[web:41][web:43][web:48][web:44]

These tools solve important problems inside **single organisations** or for specific asset classes (IT, fleet, campus inventory).

### 5.2 What is missing

From a national, SDG‑aligned governance view, gaps include:

- **No cross‑department / cross‑city intelligence** – limited ability to see assets across ministries or states on one map or dashboard.[web:44][web:41]
- **Limited AI‑driven optimisation** – focus on record‑keeping over predictive maintenance, utilisation optimisation or fraud analytics.[web:38][web:78]
- **Little integration with open data or citizen inputs** – most tools are closed enterprise systems, not designed for participatory governance or open dashboards.[web:26][web:34][web:96]
- **Not built as reusable public digital infrastructure** – licensing and design often make it hard for NIC/state IT to adopt and extend them as shared platforms.

Sanchay is designed explicitly to fill **this governance‑intelligence gap**, not to duplicate basic inventory features.

---

## 6. Sanchay Concept

### 6.1 Core idea

Sanchay is a **plug‑and‑play asset intelligence layer** that:

- Ingests data from existing registers, ERPs, IoT/telematics, open data portals and citizen/field reports.
- Normalises it into a **digital asset passport** for every asset.
- Runs AI agents to detect idle assets, predict failures and flag anomalies.
- Provides role‑based dashboards, maps and reports for administrators, officers, field staff, auditors and citizens.
- Writes key events to a permissioned ledger for **immutable audit trails**.[web:30][web:41]

### 6.2 Target assets in initial scope

- Ambulances and other government vehicles.
- Critical medical equipment (ventilators, oxygen plants, imaging devices).
- Core infrastructure machinery (excavators, road equipment).
- Selected public buildings (schools, hospitals, community halls).

---

## 7. High‑Level Architecture

1. **Data Input Layer**
   - Bulk imports from CSV / databases.
   - APIs to existing departmental systems.
   - GPS/IoT or smartphone telemetry for mobile assets.[web:22]
   - Citizen and field‑officer reports via PWA or messaging.

2. **Core Platform Layer (APIs + Auth)**
   - REST/GraphQL APIs in Node.js/Express.
   - Role‑based access control and JWT‑based authentication.
   - Asset CRUD, event logging and workflow orchestration.[web:43][web:44]

3. **Analytics & AI Layer**
   - Monitoring agent: utilisation, idle time, coverage gaps.
   - Predictive‑maintenance agent: risk scoring using ML models informed by fleet literature.[web:38][web:78][web:108]
   - Optimisation agent: matching idle assets with demand.
   - Fraud/anomaly agent: detecting suspicious patterns.

4. **Storage & Ledger Layer**
   - Document database for passports and events.
   - Time‑series store for telemetry.
   - Hyperledger Fabric network for immutable records of critical events.[web:30]

5. **Presentation & Interaction Layer**
   - Web dashboard (Next.js) for administrators and department officers.
   - PWA interface for field staff (offline‑friendly).
   - Map and heatmap views using Leaflet + OpenStreetMap.[web:22][web:23]
   - Notification channels (email/SMS/WhatsApp) for alerts.

---

## 8. Functional Modules

- **Digital Asset Passport** – unique identity, specifications, location history, maintenance and utilisation details per asset.
- **Automobile Module** – tracks GPS, trips, utilisation, compliance (e.g., max idle thresholds), and maintenance planning for fleets.
- **MedCycle / SAFE** – manages sharing of under‑used medical equipment and monitors medicine batches for approaching expiry.[web:31]
- **AssetSpace** – identifies under‑used buildings for sharing or alternate use, based on inventory and utilisation data.[web:36][web:49]
- **AI Intelligence Module** – hosts monitoring, utilisation, predictive‑maintenance and fraud‑detection agents.
- **Security & Audit Module** – identity, access management, encryption and ledger logging.
- **Reporting & Exports** – PDF/CSV exports for audits, budget discussions and SDG reporting.

---

## 9. Stakeholders and Beneficiaries

- **Finance and planning departments** – better visibility into asset bases and capex outcomes, supporting more efficient budgeting.[web:40][web:109]
- **Line departments** – Health, Transport, Education, Urban Development, Disaster Management, etc., gain practical tools to run fleets, buildings and equipment more efficiently.[web:43][web:44]
- **Field officers and technicians** – simpler mobile workflows for inspections, maintenance and incident reporting.
- **Audit and oversight bodies** – clearer digital histories, faster audit preparation and better fraud‑detection capabilities.[web:41][web:48]
- **Citizens and communities** – indirect benefits: more reliable ambulances and buses, better‑equipped facilities, and more accessible public spaces.[web:90][web:92]

---

## 10. Innovation and Differentiation

Sanchay is distinctive because it:

1. **Spans departments and asset types** rather than staying within a single agency or asset class.[web:44][web:41]
2. Embeds **AI‑driven maintenance and utilisation intelligence**, grounded in proven fleet‑maintenance results, instead of only scheduled reminders.[web:38][web:78][web:108]
3. Integrates **citizen and field‑officer reporting** with official registers, improving data quality and trust.
4. Uses a **permissioned ledger** to give auditors immutable trails while remaining compatible with government IT environments.[web:30][web:41]
5. Is engineered as a **modular, open‑source‑friendly GovTech building block**, rather than a closed commercial SaaS.

---

## 11. Implementation Status (MVP)

Current prototype capabilities:

- Working full‑stack MVP with role‑based login, asset registry, digital passports, dashboard and map view.
- Ingestion of open and synthetic datasets; basic adapters for CSV imports.
- Simple AI agents for utilisation scoring and failure‑risk flags using publicly available predictive‑maintenance examples.[web:27][web:35]
- PDF/CSV export of asset lists and basic utilisation reports.
- Email/SMS/WhatsApp integration via free‑tier APIs for alert notifications.

Planned near‑term work includes integration with realistic datasets, richer time‑series models, structured usability testing and security hardening.

---

## 12. Risks and Assumptions

- **Data quality and access** – assumes departments will share sufficiently clean asset data; mitigation includes schema mapping, validation and feedback loops.[web:26][web:34]
- **Privacy and security** – location and status of sensitive assets must be protected; requires government‑grade hosting, encryption and strict RBAC.[web:13][web:41]
- **Change management** – adoption depends on officers trusting and using the system; mitigated via co‑design, clear benefits and phased pilots.
- **Model risk** – predictive models may be imperfect; they will be used as decision support with human oversight, not as automatic commands.[web:38][web:110]

---

## 13. Long‑Term Vision

Over 3–5 years, Sanchay aims to evolve into a **reference implementation for public‑asset intelligence**:

- Deployed in at least one state as a shared platform across multiple departments.
- Integrated with SDG‑ and disaster‑related indicators, helping cities monitor infrastructure reliability and resilience.[web:89][web:91][web:96]
- Open‑sourced wherever possible, enabling universities, civic‑tech groups and smaller municipalities to reuse and improve the design.

In the long run, the goal is that whenever India debates new capex or SDG‑11 progress, decision‑makers can consult a **live, trusted asset graph** powered by Sanchay or its derivatives, making public infrastructure truly inclusive, safe, resilient and sustainable.
