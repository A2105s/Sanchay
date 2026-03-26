# NationTrack Automobiles Module - AI Context

## Overview

The Automobiles Module is a comprehensive fleet management and tracking system integrated into the NationTrack application. It provides real-time tracking, monitoring, and management of municipal vehicles including police patrol cars, ambulances, PWD heavy machinery, and other department vehicles in Gwalior city.

## Purpose & Key Objectives

- **Real-time Vehicle Tracking**: Monitor vehicle locations, speed, and operational status across Gwalior
- **Fleet Management**: Manage vehicle bookings, maintenance, compliance, and utilization
- **Operational Insights**: Provide dashboards and reports for fleet utilization, idle time analysis, and maintenance scheduling
- **Multi-Sector Support**: Support various department sectors (Police, Ambulance, PWD, Health, Elections)
- **Compliance Monitoring**: Track vehicle compliance (PUC, Insurance, Fitness certificates)
- **Integration Hub**: Connect with GPS sources (AIS-140, QR PWA, Manual CSV imports)

## Architecture Overview

### Technology Stack

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **UI Framework**: React with Tailwind CSS
- **Mapping**: Leaflet.js with CartoDB tiles
- **Icons**: Lucide React
- **Theme**: Dark/Light mode support (next-themes)
- **Forms**: Form handling with keyboard navigation

### Directory Structure

```
src/
├── app/automobiles/
│   ├── page.tsx                 # Main dashboard page
│   ├── layout.tsx               # Layout wrapper
│   ├── vehicles/                # Vehicle fleet listing
│   ├── bookings/                # Booking management
│   ├── calendar/                # Calendar view
│   ├── notifications/           # Alert notifications
│   ├── reports/                 # Analytics & reports
│   ├── settings/                # Configuration
│   ├── [id]/                    # Individual vehicle detail
│   ├── approvals/               # Admin approvals
│   ├── audit/                   # Audit logs
│   ├── entries/                 # Trip logging
│   ├── idle/                    # Idle analysis
│   ├── map/                     # Map components
│   └── request/                 # Booking requests
├── components/automobiles/
│   ├── AutomobileMapDashboard.tsx    # Main map component
│   ├── PoliceStationPanel.tsx        # Station detail panel
│   ├── VehicleBottomSheet.tsx        # Vehicle info sheet
│   └── VehicleTypeCounter.tsx        # Type counter UI
├── lib/
│   ├── automobiles-service.ts   # API calls & business logic
│   ├── gwalior-police-stations.ts # Station coordinates data
│   └── road-constrained-simulation.ts
└── types/
    └── automobiles.ts            # TypeScript interfaces
```

## Key Data Types & Models

### AutomobileAsset

Main vehicle representation with properties:

```typescript
{
  id: string;
  registrationNumber: string;
  displayName: string;
  sector: DepartmentSector; // POLICE_PATROL, AMBULANCE_108, etc.
  vehicleType: string;
  driverName: string;
  departmentName: string;
  status: VehicleOperationalStatus; // MOVING | IDLE | BREAKDOWN | OFFLINE
  coordinates: GeoPoint;
  speedKmph: number;
  heading: number;
  idleMinutes: number;
  gpsSource: GpsSourceTier; // AIS_140 | QR_PWA | MANUAL_CSV
  compliance: ComplianceDates; // PUC, Insurance, Fitness
  utilization: UtilizationStats; // Hours today/week, idle%
  maintenanceRiskScore: number;
  specs: { fuelType, capacity, model, year };
  pathTrail24h: GeoPoint[];
}
```

### TripLog

Records of vehicle trips/journeys:

```typescript
{
  id: string;
  vehicleId: string;
  purpose: string;
  status: 'ONGOING' | 'COMPLETED' | 'ABORTED';
  startedAt: ISODate;
  endedAt?: ISODate;
  startAddress: string;
  endAddress?: string;
  distanceKm?: number;
  durationMinutes?: number;
  fuelLiters?: number;
  routePath: GeoPoint[];
}
```

### DepartmentSectors & Statuses

```typescript
Sectors: (GMC_WASTE, AMBULANCE_108, POLICE_PATROL, PWD_HEAVY, HEALTH_VAN, ELECTION_REQUISITION);
Statuses: (MOVING, IDLE, BREAKDOWN, OFFLINE);
```

## Main Components

### 1. AutomobilesPage (page.tsx)

**Purpose**: Main dashboard entry point
**Key Features**:

- Responsive sidebar navigation with collapsible state
- Search functionality with KML-based station hints
- Dynamic route navigation
- Fullscreen map mode toggle
- Station autocomplete from KML files
- Real-time map rendering (Client-side rendering)

**Navigation Items**:

- Dashboard (main page)
- Available Fleet (vehicle listing)
- My Bookings (booking management)
- Calendar (calendar view)
- Notifications (alerts)
- Reports (analytics)
- Settings (configuration)

**Technical Highlights**:

- Uses `'use client'` directive (client component)
- Dynamic import for AutomobileMapDashboard (SSR disabled)
- Keyboard navigation for search hints (arrow keys, Enter, Escape)
- KML parsing for station names from /maps/gwalior/
- Click-outside detection for dropdown hints

### 2. AutomobileMapDashboard (AutomobileMapDashboard.tsx)

**Purpose**: Interactive map visualization with vehicle tracking
**Features**:

- Leaflet-based map rendering
- Light/Dark theme tile support (CartoDB)
- Police station markers with vehicle counts
- Vehicle clustering status display
- Station panel with drill-down details
- Search and filter capabilities
- Locate user + Fullscreen controls
- Dynamic icon generation for markers

**Key Functions**:

- `getStationFleetSummary()`: Vehicle count distribution
- `getStationSearchTokens()`: Fuzzy search token generation
- `normalizeSearchText()`: Search normalization
- Theme-aware tile selection

### 3. PoliceStationPanel (PoliceStationPanel.tsx)

**Purpose**: Display detailed station information
**Shows**:

- Station name and location
- Vehicle count breakdown by type
- Vehicle operational status distribution
- Clickable vehicle list with drill-down

### 4. VehicleBottomSheet (VehicleBottomSheet.tsx)

**Purpose**: Mobile-friendly vehicle detail view
**Displays**:

- Vehicle specifications
- Compliance status
- Utilization metrics
- Trip history
- Maintenance alerts

### 5. AutomobileVehiclesPage (vehicles/page.tsx)

**Purpose**: Fleet listing and vehicle discovery interface
**Key Features**:

- Glass-morphic card design with gradient backgrounds
- Featured vehicle highlighting
- Status-based badge color coding
- Search bar with vehicle name/registration filtering
- Multi-select filters (Status, Vehicle Type, Department)
- Pagination with sortable/filterable results
- Media preview with Image optimization
- Responsive grid layout (1-2-3 columns on mobile/tablet/desktop)
- Quick action CTAs (View Details, Track Live)

**Visual Design** (matches spaces module language):

- **Card Gradient**: `from-azure-100/80 via-accent-foreground/5 to-azure-200/60` (light mode) with dark mode support
- **Border Styling**: `border-azure-200/70` with `rounded-3xl`
- **Media Preview**: Full-width image container with `aspect-video`, `rounded-2xl`, hover zoom effect (`group-hover:scale-105`)
- **Featured Chip**: Amber background (`bg-amber-400/90`) with star icon, shown for highly utilized vehicles (≥30 hours/week) or moving vehicles
- **Status Badges**: Conditional color classes:
  - `MOVING`: Emerald/green theme
  - `IDLE`: Amber/yellow theme
  - `BREAKDOWN`: Red/destructive theme
  - `OFFLINE`: Slate/gray theme
- **CTA Buttons**:
  - "View Details" → Outline style + ArrowRight icon (rounded-full for consistency)
  - "Track Live" → Blue solid style + ExternalLink icon (rounded-full, higher emphasis)

**Data Structure** (per card):

```typescript
{
  id: string;
  registrationNumber: string;
  displayName: string;
  photoUrl?: string; // Displays placeholder if missing
  departmentName: string;
  sector: DepartmentSector;
  vehicleType: string;
  status: VehicleOperationalStatus;
  isMoving: boolean;
  compliance: { pucExpiry, insuranceExpiry, fitnessExpiry };
  utilization: { hoursWeek, hoursToday, idlePercent };
  speedKmph: number;
  ignitionStatus: boolean;
}
```

**Key Functions in Page Component**:

- `vehicleStatusBadgeClass(status)`: Maps vehicle status to Tailwind badge color classes
- `isFeatured(vehicle)`: Determines if vehicle should show featured chip (hoursWeek >= 30 || isMoving)
- `handleViewDetails(vehicleId)`: Navigate to individual vehicle detail page
- `handleTrackLive(vehicleId)`: Open vehicle on map dashboard

**Search & Filter Logic**:

- **Search Field**: Filters by vehicle displayName OR registrationNumber (case-insensitive partial match)
- **Status Filter**: Multi-select checkbox group (MOVING, IDLE, BREAKDOWN, OFFLINE)
- **Vehicle Type Filter**: Multi-select from available types in fleet
- **Department Filter**: Multi-select from departments with visible fleet
- **Dynamic Filter Application**: All filters combined with AND logic; results update in real-time

**Responsive Behavior**:

- **Mobile** (`< md`): Single column grid, full-width cards, stacked filter sidebar
- **Tablet** (`md: ` 768px - `lg:`): Two column grid, collapsible sidebar
- **Desktop** (`lg: ` 1024px+): Three column grid with sticky sidebar filters

**Performance Optimizations**:

1. **Image Optimization**: Uses Next.js Image component with `fill` layout and `object-cover` for lazy loading
2. **Pagination**: Limits displayed vehicles to reduce DOM nodes (typically 12-24 per page)
3. **Memoization**: Search/filter results memoized via `useMemo` to prevent recalculation on re-renders
4. **CSS Classes**: All styling via Tailwind utilities; no runtime style calculations
5. **Icon Imports**: Lucide React icons lazy-loaded (Star, ArrowRight, ExternalLink)

**Accessibility Features**:

- Semantic HTML: `<section>`, `<article>` for card structure
- ARIA Labels\*\*: Filter inputs have associated labels; buttons have descriptive text or aria-label
- **Keyboard Navigation**: All interactive elements (filters, buttons) are keyboard operable with visible focus states
- **Color Contrast**: Status badge colors meet WCAG AA contrast ratios (3:1 minimum)
- **Image Alt Text**: Each vehicle card image has descriptive alt text
- **Link Semantics**: "View Details" styled as button (not link) for proper semantics; "Track Live" opens external map view

**Animation & State Transitions**:

- **Card Hover**: Image zoom from 1.0 to 1.05 scale over 300ms cubic-bezier ease
- **Badge Pulse** (if vehicle moving): Optional subtle opacity pulse (not implemented by default; add if needed)
- **Filter Collapse**: Animated sidebar with `transition-all` on desktop
- **Pagination**: Smooth fade-in of new results

**Data Flow**:

1. Page loads with full fleet list (from API or static data)
2. User enters search term → component re-evaluates filter predicate
3. User selects filter options → multiple active filters combined
4. Filtered results re-rendered with animation
5. User clicks "View Details" → navigate to `/automobiles/:id` with vehicle ID
6. User clicks "Track Live" → navigate to `/automobiles` map dashboard (with optional vehicle ID param forwarded)

**State Management Pattern**:

```typescript
// Component-level state (useState hooks)
const [searchTerm, setSearchTerm] = useState('');
const [activeStatusFilters, setActiveStatusFilters] = useState<VehicleOperationalStatus[]>([]);
const [activeTypeFilters, setActiveTypeFilters] = useState<string[]>([]);
const [activeDepartmentFilters, setActiveDepartmentFilters] = useState<string[]>([]);
const [currentPage, setCurrentPage] = useState(1);

// Derived state (useMemo)
const filteredVehicles = useMemo(() => {
  return vehicles.filter(vehicle => {
    const matchesSearch = /* search logic */;
    const matchesStatus = /* status filter logic */;
    const matchesType = /* type filter logic */;
    const matchesDepartment = /* department filter logic */;
    return matchesSearch && matchesStatus && matchesType && matchesDepartment;
  });
}, [vehicles, searchTerm, activeStatusFilters, activeTypeFilters, activeDepartmentFilters]);
```

**Integration Points**:

- **API Call**: `GET /api/automobiles/vehicles` fetches full fleet list
- **Map Navigation**: Links to `/automobiles` with optional `?vehicleId=<id>` param
- **Vehicle Detail**: Links to `/automobiles/:id` with full vehicle context
- **Live Tracking**: Button opens map in fullscreen mode with vehicle pre-selected

**Common Development Tasks** (specific to vehicles page):

1. **Adding a new filter**: Add state variable, checkbox UI, and update filter predicate
2. **Changing card styling**: Update gradient/border/rounded classes; ensure color contrast
3. **Modifying featured logic**: Edit `isFeatured` function predicate
4. **Adding new badge types**: Add status-to-color mapping in `vehicleStatusBadgeClass`
5. **Customizing search behavior**: Update search text normalization and matching logic

**Known Constraints**:

- Image URLs must be valid; broken images show placeholder
- Pagination requires server-side limit/offset support (or client-side chunking)
- Filter combinations can result in 0 results (handled with "No vehicles found" message)
- Page load time depends on fleet size; recommend server-side pagination for 1000+ vehicles

## Navigation & Pages

| Path                         | Purpose             | Key Features                                 |
| ---------------------------- | ------------------- | -------------------------------------------- |
| `/automobiles`               | Main dashboard      | Map + sidebar navigation                     |
| `/automobiles/vehicles`      | Fleet listing       | All vehicles, sortable/filterable            |
| `/automobiles/bookings`      | Booking management  | Create/manage vehicle bookings               |
| `/automobiles/calendar`      | Calendar view       | Calendar-based scheduling                    |
| `/automobiles/notifications` | Notifications       | Alerts and compliance warnings               |
| `/automobiles/reports`       | Analytics & Reports | Utilization, maintenance, compliance reports |
| `/automobiles/settings`      | Configuration       | Module settings and preferences              |
| `/automobiles/:id`           | Vehicle detail      | Individual vehicle tracking + trip logs      |
| `/automobiles/approvals`     | Admin approvals     | Approve booking requests                     |
| `/automobiles/audit`         | Audit logs          | Change history and compliance audits         |
| `/automobiles/entries`       | Trip entries        | Manual trip logging                          |
| `/automobiles/idle`          | Idle analysis       | Suggestions for idle vehicle reuse           |

## Data Flow & Integration

### GPS Sources (Multi-tier)

1. **AIS_140**: Hardware GPS trackers following AIS-140 standard
2. **QR_PWA**: QR code scanning via Progressive Web App
3. **MANUAL_CSV**: Manual CSV imports for vehicles without trackers

### External Data Sources

- **KML Files**:
  - `/maps/gwalior/Police_Station_doc.kml`
  - `/maps/gwalior/Gwalior_Police_Stations.kml`
  - Used for auto-complete suggestions and station boundaries

### Real-time Updates

- Vehicle position & speed updates
- Status changes (MOVING ↔ IDLE ↔ BREAKDOWN)
- Trip start/end events
- Compliance date reminders
- Maintenance alerts

## Key Features & Workflows

### 1. Real-time Tracking

- Live vehicle positions on map
- Speed and heading display
- 24-hour path trail visualization
- Station-based clustering

### 2. Fleet Management

- Vehicle booking system with approval workflow
- Maintenance scheduling and history
- Compliance tracking (PUC, Insurance, Fitness)
- Fuel consumption monitoring

### 3. Utilization Analytics

- Hours used today/this week
- Idle time percentage
- Trip distance and duration
- Maintenance risk scoring

### 4. Compliance Monitoring

- Expiry tracking for PUC, Insurance, Fitness
- Automated alerts before expiry
- Non-compliance reporting
- Audit trail of compliance actions

### 5. Smart Search & Navigation

- Fuzzy search across station names
- Keyboard shortcuts (arrows, Enter, Escape)
- Station autocomplete from KML
- Multi-term filtering support

## UI/UX Patterns

### Responsive Design

- Desktop: Full sidebar navigation with collapsible state
- Tablet: Adaptive sidebar and bottom sheets
- Mobile: Full-width map with floating action buttons

### Navigation Pattern

- Gmail-inspired sidebar (collapsible with icon-only mode)
- Consistent navigation across all pages
- Breadcrumb support for sub-sections

### Interactive Elements

- **Search Bar**: Auto-complete with KML hints
- **Map Controls**: Locate me, Fullscreen, Theme toggle
- **Bottom Sheets**: Mobile-friendly detail panels
- **Markers**: Clustered station markers with vehicle counts

### Theme Support

- Dark mode: Dark tiles + dark UI
- Light mode: Voyager tiles + light UI
- Persistent theme preference (next-themes)

## Performance Considerations

### Optimization Strategies

1. **Dynamic Imports**: Map component imported dynamically (SSR disabled)
2. **Lazy Loading**: Station hints loaded on mount
3. **Memoization**: `useMemo` for filtered hints and search results
4. **Event Delegation**: Click-outside detection for dropdown optimization

### Accessibility Features

- ARIA labels for interactive elements
- Semantic HTML (nav, aside, main)
- Keyboard navigation support
- Screen reader friendly structure

## Styling & Theme

### Color Scheme

- Primary: Theme-based (light/dark)
- Status colors:
  - MOVING: Green
  - IDLE: Yellow
  - BREAKDOWN: Red
  - OFFLINE: Gray

### Tailwind CSS Classes Used

- Layout: `flex`, `grid`, `h-dvh`, `overflow-hidden`
- Spacing: `px-`, `py-`, `gap-`
- Responsiveness: `md:`, `lg:` breakpoints
- States: `hover:`, `focus-visible:`

## Security & Access Control

### Current Implementation

- Role-based access (ADMIN, DEPARTMENT_OFFICER, FIELD_STAFF, CITIZEN)
- Read-only access for non-admin users
- Driver name verification on trip start/end

### Future Considerations

- Fine-grained permission control per sector
- Audit logging of user actions
- Data encryption for sensitive information

## Common Development Tasks

### Adding a New Sector

1. Update `DepartmentSector` type in `types/automobiles.ts`
2. Add label in `sectorLabel` map in `automobiles-service.ts`
3. Update filter options in components
4. Add test data generation for new sector

### Adding a New Navigation Item

1. Add to `navItems` array in `page.tsx`
2. Create corresponding page/layout in `src/app/automobiles/`
3. Update route navigation
4. Add icon from lucide-react

### Handling Real-time Updates

1. Implement WebSocket listener in appropriate page component
2. Update component state with new vehicle data
3. Re-render map markers if using Leaflet
4. Handle connection losses and reconnections

### Modifying Vehicle Card Design

1. Update gradient colors in card className: `from-*-100/80 via-* to-*-200/60`
2. Adjust border color and rounded size: `border-*-200/70 rounded-3xl`
3. Modify media preview aspect ratio: `aspect-video` (change to `aspect-square` if needed)
4. Update button styling: `rounded-full` for consistency with spaces module
5. Test color contrast for WCAG AA compliance (3:1 minimum for large text)

### Adding New Vehicle Status

1. Add status to `VehicleOperationalStatus` enum in `types/automobiles.ts`
2. Add color class mapping in `vehicleStatusBadgeClass` function in `vehicles/page.tsx`
3. Update badge UI to display new status label
4. Add corresponding API field update if status comes from backend
5. Test featured chip logic still works with new status

### Filtering Vehicle Cards

1. Add new filter state: `const [activeFilterName, setActiveFilterName] = useState<Type[]>([])`
2. Create filter UI section (checkboxes or dropdown)
3. Add filter predicate to `filteredVehicles` useMemo:
   ```typescript
   const matchesNewFilter =
     activeFilterName.length === 0 || activeFilterName.includes(vehicle.newField);
   ```
4. Include new filter in overall AND logic
5. Update filter clearing/reset logic to include new filter state

### Implementing Pagination

1. Define page size constant: `const PAGE_SIZE = 12;`
2. Calculate total pages: `const totalPages = Math.ceil(filteredVehicles.length / PAGE_SIZE);`
3. Slice filtered results: `const paginatedVehicles = filteredVehicles.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);`
4. Add pagination controls (Previous/Next buttons or number buttons)
5. Reset to page 1 when filter criteria change: `setCurrentPage(1)`
6. Show page indicator: `Page {currentPage} of {totalPages}`

## Backend Integration (Expected)

### API Endpoints (from docs)

- `GET /api/automobiles/vehicles` - List all vehicles
- `GET /api/automobiles/vehicles/:id` - Vehicle details
- `POST /api/automobiles/trips/start` - Start trip
- `POST /api/automobiles/trips/end` - End trip
- `GET /api/automobiles/reports/utilization` - Utilization metrics
- `GET /api/automobiles/compliance` - Compliance status
- `WebSocket /api/automobiles/live` - Real-time updates

## Known Constraints & Dependencies

### Browser Requirements

- Leaflet.js support (most modern browsers)
- Web Audio API for notifications (if used)
- Geolocation API for fullscreen requests
- KML file parsing capabilities

### Map Tile Services

- CartoDB for map tiles (internet required)
- Fallback to light map during offline mode (planned)

### Data Size Limits

- Station hints limited to 8 suggestions (performance)
- Path trail limited to 24 hours
- Viewport clustering for 100+ vehicles

## Testing Strategy

### Unit Testing Areas

- KML parsing functions
- Search text normalization
- Station hint filtering algorithm
- Geolocation calculations

### Integration Testing

- Navigation between sections
- Station click → Detail panel flow
- Vehicle selection → Detail view
- Bookmark/favorite functionality

### E2E Testing

- Map loading and rendering
- Search and autocomplete
- Keyboard navigation
- Responsive design on mobile/tablet
- **Vehicle Page Tests**:
  - Filter combinations produce correct filtered results
  - Search by registration number and display name
  - Featured chip displays only for high-utilization vehicles
  - Status badge colors match vehicle status
  - Image loads with fallback to placeholder
  - View Details/Track Live buttons navigate correctly
  - Pagination works across filtered datasets
  - Responsive grid layout on mobile/tablet/desktop

## Future Enhancement Areas

1. **Advanced Analytics**: Predictive maintenance, route optimization
2. **Real-time Collaboration**: Multiple operators viewing same vehicle
3. **Offline Support**: Service worker for offline map access
4. **Custom Reports**: User-defined dashboards and exports
5. **Mobile App**: Native mobile clients
6. **AI Integration**: Anomaly detection, automated alerts
7. **IoT Integration**: Direct sensor data from vehicles
8. **Geofencing**: Automated alerts for zone entries/exits

## Debugging Tips

### Map Not Loading

- Check CartoDB tile URLs are accessible
- Verify Leaflet CSS is imported
- Check browser console for CORS errors
- Ensure coordinates are valid (lat/lng within bounds)

### Search Not Working

- Verify KML files are in `/public/maps/gwalior/`
- Check KML file format and element names
- Review browser console for fetch errors
- Test KML parsing with sample data

### Sidebar Collapse Issues

- Check browser localStorage for state persistence
- Verify responsive breakpoint (md: = 768px)
- Test keyboard shortcut conflicts

### Performance Issues

- Monitor component re-renders (React DevTools)
- Check Leaflet layer rendering (map tiles loading)
- Profile JavaScript execution (Chrome DevTools)
- Analyze network requests for slow API calls

### Vehicle Cards Not Displaying

- Verify `/api/automobiles/vehicles` endpoint returns valid data
- Check Image component has valid photoUrl or uses placeholder fallback
- Review Tailwind CSS classes are applied correctly (no class conflicts)
- Validate vehicle status enum matches badge color class map
- Check browser console for missing image errors

### Filter Behavior Issues

- Verify filter predicate logic combines all active filters with AND operator
- Check filter state updates trigger component re-render
- Test filter combinations produce expected result counts
- Validate search text normalization (case-insensitivity, trimming)
- Monitor useMemo dependency array includes all filter state variables

### Featured Chip Not Showing

- Verify hoursWeek >= 30 or isMoving condition is correct
- Check vehicle utilization data is populated from API
- Validate isMoving flag updates in real-time (if streaming updates)
- Inspect DOM for .bg-amber-400 class presence

### Image Zoom Animation Not Working

- Verify group-hover:scale-105 is applied to Image element parent
- Check Tailwind transition class (transition-transform duration-300) is present
- Test on actual device/browser (not all browsers support transform animation equally)
- Validate group class is on card container

### Responsive Breakpoint Issues

- Test md: (768px) and lg: (1024px) breakpoints match tailwind.config.ts
- Verify grid-cols-1 md:grid-cols-2 lg:grid-cols-3 classes are applied
- Check sidebar responsiveness on tablet/mobile viewports
- Use Chrome DevTools device emulation to test various screen sizes

## Related Documentation

- [AUTOMOBILE_MODULE_BLUEPRINT.md](./AUTOMOBILE_MODULE_BLUEPRINT.md) - MongoDB schemas and backend architecture
- [Next.js Instructions](../.github/instructions/nextjs.instructions.md)
- [Accessibility Guidelines](../.github/instructions/a11y.instructions.md)
- [Performance Optimization](../.github/instructions/performance-optimization.instructions.md)

---

**Last Updated**: March 26, 2026
**Module Status**: In Development
**Version**: 1.0
