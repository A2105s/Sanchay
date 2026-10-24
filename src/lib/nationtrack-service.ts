import { fetchRows } from '@/lib/supabase-query';
import { isSupabaseConfigured } from '@/utils/supabase/client';
import type {
  AssetPassport,
  AssetStatus,
  AssetType,
  AuditLog,
  Booking,
  DashboardMetrics,
} from '@/types/nationtrack';

const ASSETS_TABLE = 'asset_passports';
const BOOKINGS_TABLE = 'bookings';
const AUDIT_TABLE = 'audit_logs';

const FALLBACK_DATE = new Date().toISOString();

const toIsoDate = (value: unknown): string => {
  if (!value) return FALLBACK_DATE;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? FALLBACK_DATE : parsed.toISOString();
};

const mapAsset = (id: string, data: Record<string, unknown>): AssetPassport => {
  const location = data.location as
    | { district?: string; address?: string; coordinates?: AssetPassport['coordinates'] }
    | undefined;

  return {
    id,
    assetId: (data.assetId as string) ?? `NT-DEMO-${id.slice(0, 6).toUpperCase()}`,
    type: ((data.type as string) ?? 'VEHICLE') as AssetType,
    subType: (data.subType as AssetPassport['subType']) ?? 'AMBULANCE',
    name: (data.name as string) ?? 'Untitled Asset',
    department: (data.department as string) ?? 'Unknown Department',
    district: location?.district ?? (data.district as string) ?? 'Gwalior',
    address: location?.address ?? (data.address as string) ?? 'Unknown address',
    coordinates: location?.coordinates ?? (data.coordinates as AssetPassport['coordinates']),
    status: ((data.status as string) ?? 'ACTIVE') as AssetStatus,
    metadata: data.metadata as AssetPassport['metadata'],
    events: (data.events as AssetPassport['events']) ?? [],
    auditHash: data.auditHash as string | undefined,
    photos: (data.photos as string[]) ?? [],
    qrCode: data.qrCode as string | undefined,
    tags: (data.tags as string[]) ?? [],
    isIdle: Boolean(data.isIdle),
    createdAt: toIsoDate(data.createdAt),
    updatedAt: toIsoDate(data.updatedAt),
    lastActivityAt: toIsoDate(data.lastActivityAt ?? data.updatedAt),
  };
};

const mapBooking = (id: string, data: Record<string, unknown>): Booking => ({
  id,
  spaceId: (data.spaceId as string) ?? 'unknown-space',
  spaceName: (data.spaceName as string) ?? 'Unknown Space',
  bookedBy: (data.bookedBy as string) ?? 'unknown-user',
  bookedByName: (data.bookedByName as string) ?? 'Unknown User',
  purpose: (data.purpose as string) ?? 'General usage',
  organizationName: data.organizationName as string | undefined,
  expectedAttendees: Number(data.expectedAttendees ?? 0),
  startTime: toIsoDate(data.startTime ?? data.startDateTime),
  endTime: toIsoDate(data.endTime ?? data.endDateTime),
  status: (data.status as Booking['status']) ?? 'PENDING',
  approvedBy: data.approvedBy as string | undefined,
  approvedAt: data.approvedAt ? toIsoDate(data.approvedAt) : undefined,
  rejectionReason: (data.rejectionReason ?? data.rejectedReason) as string | undefined,
  checkinAt: data.checkinAt ? toIsoDate(data.checkinAt) : undefined,
  checkoutAt: data.checkoutAt ? toIsoDate(data.checkoutAt) : undefined,
  qrToken: data.qrToken as string | undefined,
  rating: data.rating as Booking['rating'],
  feedback: data.feedback as string | undefined,
  createdAt: toIsoDate(data.createdAt),
});

const mapAudit = (id: string, data: Record<string, unknown>): AuditLog => ({
  id,
  assetId: (data.assetId as string) ?? 'unknown-asset',
  eventId: (data.eventId as string) ?? id,
  action: (data.action as AuditLog['action']) ?? 'STATUS_CHANGE',
  performedBy: (data.performedBy as string) ?? 'system',
  performedByRole: (data.performedByRole as AuditLog['performedByRole']) ?? 'ADMIN',
  timestamp: toIsoDate(data.timestamp),
  prevHash: (data.prevHash as string) ?? 'genesis',
  hash: (data.hash as string) ?? 'pending-hash',
  payload: (data.payload as string) ?? '{}',
});

const rowId = (row: Record<string, unknown>) => String(row.id ?? '');

export const nationTrackService = {
  async getAssets(type?: AssetType): Promise<AssetPassport[]> {
    if (!isSupabaseConfigured) return [];

    const rows = await fetchRows<Record<string, unknown>>(ASSETS_TABLE, {
      filters: type ? [{ column: 'type', value: type }] : [],
      order: { column: 'updated_at', ascending: false },
    });

    return rows.map((row) => mapAsset(rowId(row), row));
  },

  async getBookings(limitCount = 50): Promise<Booking[]> {
    if (!isSupabaseConfigured) return [];

    const rows = await fetchRows<Record<string, unknown>>(BOOKINGS_TABLE, {
      order: { column: 'created_at', ascending: false },
      limit: limitCount,
    });

    return rows.map((row) => mapBooking(rowId(row), row));
  },

  async getAuditLogs(limitCount = 100): Promise<AuditLog[]> {
    if (!isSupabaseConfigured) return [];

    const rows = await fetchRows<Record<string, unknown>>(AUDIT_TABLE, {
      select:
        'id, asset_id, event_id, action, performed_by, performed_by_role, timestamp, prev_hash, hash, payload',
      order: { column: 'timestamp', ascending: false },
      limit: limitCount,
    });

    return rows.map((row) => mapAudit(rowId(row), row));
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [assets, bookings] = await Promise.all([this.getAssets(), this.getBookings(200)]);

    return {
      totalAssets: assets.length,
      activeAssets: assets.filter((a) => a.status === 'ACTIVE').length,
      idleAssets: assets.filter((a) => a.status === 'IDLE').length,
      maintenanceAssets: assets.filter((a) => a.status === 'MAINTENANCE').length,
      activeBookings: bookings.filter((b) => ['APPROVED', 'ACTIVE'].includes(b.status)).length,
    };
  },

  async getSeedFallbackCounts(): Promise<{ assets: number; bookings: number; auditLogs: number }> {
    if (!isSupabaseConfigured) return { assets: 0, bookings: 0, auditLogs: 0 };

    const [assets, bookings, auditLogs] = await Promise.all([
      fetchRows<Record<string, unknown>>(ASSETS_TABLE, { select: 'id' }),
      fetchRows<Record<string, unknown>>(BOOKINGS_TABLE, { select: 'id' }),
      fetchRows<Record<string, unknown>>(AUDIT_TABLE, { select: 'id' }),
    ]);

    return {
      assets: assets.length,
      bookings: bookings.length,
      auditLogs: auditLogs.length,
    };
  },
};
