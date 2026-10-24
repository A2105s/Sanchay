# Sanchay Automobile Module Blueprint

## 1) Recommended Monorepo Structure (Next.js + NestJS)

```text
sanchay/
  apps/
    web/                                # Next.js 15 App Router frontend
      src/
        app/
          automobiles/
            page.tsx
          api/
            automobiles/
              vehicles/route.ts
              live/route.ts
              compliance/route.ts
              idle/route.ts
              trips/[vehicleId]/route.ts
              reports/utilization/route.ts
        components/
          automobiles/
            AutomobileMapDashboard.tsx
            VehicleBottomSheet.tsx
        lib/
          automobiles-service.ts
        types/
          automobiles.ts
      public/
        sw.js
        Sanchay.png
      next.config.js
      package.json
    api/                                # NestJS backend service (target architecture)
      src/
        modules/
          automobiles/
            controllers/
              automobiles.controller.ts
            services/
              automobiles.service.ts
            gateways/
              automobiles.gateway.ts
            schemas/
              vehicle.schema.ts
              trip.schema.ts
              maintenance.schema.ts
              audit-log.schema.ts
              compliance-alert.schema.ts
              field-report.schema.ts
            dto/
              create-incident.dto.ts
              update-vehicle-status.dto.ts
        modules/notifications/
          twilio.service.ts
          whatsapp.service.ts
        modules/integrations/
          ais140.provider.ts
          qr-sync.service.ts
          vahan-import.service.ts
      package.json
  packages/
    shared-types/
      src/
        automobiles.ts
  docs/
    automobiles-module/
      AUTOMOBILE_MODULE_BLUEPRINT.md
```

## 2) MongoDB Schemas (Collection Design)

### vehicles

```json
{
  "_id": "ObjectId",
  "registrationNumber": "string",
  "displayName": "string",
  "sector": "GMC_WASTE|AMBULANCE_108|POLICE_PATROL|PWD_HEAVY|HEALTH_VAN|ELECTION_REQUISITION",
  "vehicleType": "string",
  "departmentName": "string",
  "driverName": "string",
  "status": "MOVING|IDLE|BREAKDOWN|OFFLINE",
  "gpsSource": "AIS_140|QR_PWA|MANUAL_CSV",
  "coordinates": { "type": "Point", "coordinates": [78.1828, 26.2183] },
  "speedKmph": "number",
  "heading": "number",
  "idleMinutes": "number",
  "lastSeenAt": "ISODate",
  "compliance": {
    "pucExpiry": "ISODate",
    "insuranceExpiry": "ISODate",
    "fitnessExpiry": "ISODate"
  },
  "utilization": {
    "hoursToday": "number",
    "hoursWeek": "number",
    "idlePercent": "number"
  },
  "maintenanceRiskScore": "number",
  "specs": {
    "fuelType": "string",
    "capacity": "string",
    "model": "string",
    "year": "number"
  },
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Indexes:

- `{ registrationNumber: 1 }` unique
- `{ sector: 1, status: 1 }`
- `{ coordinates: "2dsphere" }`
- `{ lastSeenAt: -1 }`

### trips

```json
{
  "_id": "ObjectId",
  "vehicleId": "ObjectId",
  "startedAt": "ISODate",
  "endedAt": "ISODate",
  "startAddress": "string",
  "endAddress": "string",
  "distanceKm": "number",
  "durationMinutes": "number",
  "fuelLiters": "number",
  "routePath": [{ "lat": "number", "lng": "number" }],
  "createdAt": "ISODate"
}
```

Indexes:

- `{ vehicleId: 1, startedAt: -1 }`

### maintenance_history

```json
{
  "_id": "ObjectId",
  "vehicleId": "ObjectId",
  "title": "string",
  "note": "string",
  "costInr": "number",
  "loggedAt": "ISODate",
  "riskDelta": "number"
}
```

### compliance_alerts

```json
{
  "_id": "ObjectId",
  "vehicleId": "ObjectId",
  "alertType": "PUC|INSURANCE|FITNESS",
  "expiresOn": "ISODate",
  "daysRemaining": "number",
  "severity": "CRITICAL|WARNING|OK",
  "notifiedVia": ["SMS", "WHATSAPP", "EMAIL"],
  "notifiedAt": "ISODate"
}
```

### field_reports

```json
{
  "_id": "ObjectId",
  "vehicleId": "ObjectId",
  "reporterId": "string",
  "reporterName": "string",
  "message": "string",
  "location": { "type": "Point", "coordinates": [78.1828, 26.2183] },
  "photoUrl": "string",
  "isOfflineCaptured": "boolean",
  "syncStatus": "PENDING_SYNC|SYNCED",
  "createdAt": "ISODate"
}
```

### audit_logs (immutable)

```json
{
  "_id": "ObjectId",
  "actorRole": "ADMIN|DEPARTMENT_OFFICER|FIELD_STAFF|CITIZEN",
  "actorName": "string",
  "actionType": "string",
  "entityType": "VEHICLE|TRIP|COMPLIANCE|INCIDENT|REPORT",
  "entityId": "string",
  "metadata": { "any": "value" },
  "occurredAt": "ISODate"
}
```

### idle_suggestions

```json
{
  "_id": "ObjectId",
  "vehicleId": "ObjectId",
  "idleDays": "number",
  "suggestedAction": "ELECTION_DEPLOYMENT|INTER_DEPARTMENT_TRANSFER|GEM_AUCTION",
  "targetDepartment": "string",
  "reasoning": "string",
  "createdAt": "ISODate"
}
```

## 3) API Endpoints with Request/Response Examples

### GET /api/automobiles/vehicles?layer=ALL&q=ambulance

Response:

```json
{
  "vehicles": [
    {
      "id": "nt-auto-001",
      "registrationNumber": "MP07-2000",
      "status": "MOVING",
      "gpsSource": "AIS_140",
      "coordinates": { "lat": 26.223, "lng": 78.176 }
    }
  ],
  "complianceAlerts": [
    {
      "id": "nt-auto-001-PUC",
      "vehicleId": "nt-auto-001",
      "type": "PUC",
      "daysRemaining": 6,
      "severity": "CRITICAL"
    }
  ],
  "idleSuggestions": [],
  "generatedAt": "2026-03-23T00:00:00.000Z"
}
```

### GET /api/automobiles/live (SSE)

Event stream payload:

```json
{
  "timestamp": "2026-03-23T00:00:06.000Z",
  "delta": [
    {
      "vehicleId": "nt-auto-001",
      "coordinates": { "lat": 26.2232, "lng": 78.1764 },
      "speedKmph": 34,
      "status": "MOVING",
      "gpsSource": "AIS_140"
    }
  ]
}
```

### GET /api/automobiles/trips/:vehicleId

Response:

```json
{
  "vehicleId": "nt-auto-001",
  "trips": [
    {
      "id": "trip-nt-auto-001-1",
      "distanceKm": 12.4,
      "durationMinutes": 38,
      "routePath": [{ "lat": 26.223, "lng": 78.176 }]
    }
  ]
}
```

### GET /api/automobiles/compliance

Response:

```json
{
  "alerts": [
    {
      "id": "nt-auto-001-PUC",
      "type": "PUC",
      "daysRemaining": 6,
      "severity": "CRITICAL"
    }
  ],
  "generatedAt": "2026-03-23T00:00:00.000Z"
}
```

### GET /api/automobiles/idle

Response:

```json
{
  "suggestions": [
    {
      "vehicleId": "nt-auto-087",
      "idleDays": 214,
      "suggestedAction": "GEM_AUCTION",
      "targetDepartment": "Cross Department Pool"
    }
  ],
  "generatedAt": "2026-03-23T00:00:00.000Z"
}
```

### GET /api/automobiles/reports/utilization

Response headers:

- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="sanchay-utilization.pdf"`

## 4) Implemented Module Surface in This Repository

- Google Maps-style map-first dashboard
- Live vehicle pins and 5-10 second updates via SSE
- Cluster markers + map overlays + search + layer toggles
- Bottom sheet with digital passport, logs, compliance, idle actions, and reports
- Utilization PDF endpoint
- Workbox-powered service worker and installable web manifest
