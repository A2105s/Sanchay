import { fetchRow, fetchRows, insertRow, updateRow } from '@/lib/supabase-query';
import { getSupabaseClient } from '@/utils/supabase/client';
import { GWALIOR_POLICE_STATIONS } from '@/lib/gwalior-police-stations';
import type {
  AutomobileStationAccount,
  AutomobileTransferRequest,
  StationFleetInventory,
  VehicleInventoryByType,
  VehicleInventoryKey,
} from '@/types/automobiles';

const TRANSFER_REQUESTS_TABLE = 'automobile_transfer_requests';
const STATION_FLEET_TABLE = 'station_fleet';

const VEHICLE_KEYS: VehicleInventoryKey[] = ['PATROL_CAR', 'MOTORCYCLE', 'VAN', 'HEAVY'];

const BASE_STATION_FLEET: VehicleInventoryByType = {
  PATROL_CAR: 20,
  MOTORCYCLE: 12,
  VAN: 6,
  HEAVY: 4,
};

let stationFleetSeedPromise: Promise<void> | null = null;

interface TransferRequestCreateInput {
  requester: AutomobileStationAccount;
  sourceStationId: string;
  sourceStationName: string;
  destinationStationId: string;
  destinationStationName: string;
  startDateTime: string;
  endDateTime: string;
  requestedByType: VehicleInventoryByType;
  purpose: string;
  comments?: string;
}

interface StationFleetRow extends Record<string, unknown> {
  stationId?: string;
  stationName?: string;
  availableByType?: unknown;
  updatedAt?: string;
}

const toIso = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value) {
    return value;
  }

  return fallback;
};

const toOptionalIso = (value: unknown): string | undefined => {
  return typeof value === 'string' && value ? value : undefined;
};

const toInventory = (raw: unknown): VehicleInventoryByType => {
  const source = (raw as Record<string, unknown> | undefined) ?? {};

  return {
    PATROL_CAR: Math.max(0, Number(source.PATROL_CAR ?? 0) || 0),
    MOTORCYCLE: Math.max(0, Number(source.MOTORCYCLE ?? 0) || 0),
    VAN: Math.max(0, Number(source.VAN ?? 0) || 0),
    HEAVY: Math.max(0, Number(source.HEAVY ?? 0) || 0),
  };
};

const mapTransferRequest = (
  id: string,
  raw: Record<string, unknown>,
  fallbackIso: string
): AutomobileTransferRequest => {
  return {
    id,
    requesterUid: String(raw.requesterUid ?? ''),
    requesterEmail: String(raw.requesterEmail ?? ''),
    requesterStationId: String(raw.requesterStationId ?? ''),
    requesterStationName: String(raw.requesterStationName ?? ''),
    sourceStationId: String(raw.sourceStationId ?? ''),
    sourceStationName: String(raw.sourceStationName ?? ''),
    destinationStationId: String(raw.destinationStationId ?? ''),
    destinationStationName: String(raw.destinationStationName ?? ''),
    startDateTime: String(raw.startDateTime ?? ''),
    endDateTime: String(raw.endDateTime ?? ''),
    requestedByType: toInventory(raw.requestedByType),
    purpose: String(raw.purpose ?? ''),
    comments: typeof raw.comments === 'string' ? raw.comments : undefined,
    status:
      raw.status === 'APPROVED' ||
      raw.status === 'REJECTED' ||
      raw.status === 'ALLOCATED' ||
      raw.status === 'COMPLETED'
        ? raw.status
        : 'PENDING',
    reviewedByUid: typeof raw.reviewedByUid === 'string' ? raw.reviewedByUid : undefined,
    reviewedByEmail: typeof raw.reviewedByEmail === 'string' ? raw.reviewedByEmail : undefined,
    reviewedAt: toOptionalIso(raw.reviewedAt),
    rejectionReason: typeof raw.rejectionReason === 'string' ? raw.rejectionReason : undefined,
    createdAt: toIso(raw.createdAt, fallbackIso),
    updatedAt: toIso(raw.updatedAt, fallbackIso),
  };
};

const getDefaultFleetForStation = (stationId: string): VehicleInventoryByType => {
  // Deterministic per-station variance so all stations have usable inventory but not identical counts.
  const hash = Array.from(stationId).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const variation = hash % 4;

  return {
    PATROL_CAR: BASE_STATION_FLEET.PATROL_CAR + variation,
    MOTORCYCLE: BASE_STATION_FLEET.MOTORCYCLE + (variation % 3),
    VAN: BASE_STATION_FLEET.VAN + (variation % 2),
    HEAVY: BASE_STATION_FLEET.HEAVY,
  };
};

const toFleetInventory = (
  stationId: string,
  stationName: string,
  row: StationFleetRow | null,
  nowIso: string
): StationFleetInventory => {
  if (!row) {
    return {
      stationId,
      stationName,
      availableByType: getDefaultFleetForStation(stationId),
      updatedAt: nowIso,
    };
  }

  return {
    stationId: String(row.stationId ?? stationId),
    stationName: String(row.stationName ?? stationName),
    availableByType: toInventory(row.availableByType),
    updatedAt: toIso(row.updatedAt, nowIso),
  };
};

const seedFleetForKnownStationsOnce = async (): Promise<void> => {
  if (stationFleetSeedPromise) {
    return stationFleetSeedPromise;
  }

  stationFleetSeedPromise = (async () => {
    const client = getSupabaseClient();
    if (!client) return;

    const nowIso = new Date().toISOString();
    const rows = GWALIOR_POLICE_STATIONS.map((station) => ({
      station_id: station.id,
      station_name: station.name,
      available_by_type: getDefaultFleetForStation(station.id),
      updated_at: nowIso,
    }));

    const { error } = await client
      .from(STATION_FLEET_TABLE)
      .upsert(rows, { onConflict: 'station_id', ignoreDuplicates: true });

    if (error) throw error;
  })();

  return stationFleetSeedPromise;
};

const normalizeInventoryInput = (
  requestedByType: VehicleInventoryByType
): VehicleInventoryByType => {
  return {
    PATROL_CAR: Math.max(0, Math.trunc(requestedByType.PATROL_CAR || 0)),
    MOTORCYCLE: Math.max(0, Math.trunc(requestedByType.MOTORCYCLE || 0)),
    VAN: Math.max(0, Math.trunc(requestedByType.VAN || 0)),
    HEAVY: Math.max(0, Math.trunc(requestedByType.HEAVY || 0)),
  };
};

const getTotalRequestedUnits = (requestedByType: VehicleInventoryByType): number => {
  return VEHICLE_KEYS.reduce((sum, key) => sum + requestedByType[key], 0);
};

export async function getStationFleetInventory(
  stationId: string,
  stationName: string
): Promise<StationFleetInventory> {
  await seedFleetForKnownStationsOnce();

  const nowIso = new Date().toISOString();
  const row = await fetchRow<StationFleetRow>(STATION_FLEET_TABLE, stationId, 'station_id');

  if (!row) {
    const fallback: StationFleetInventory = {
      stationId,
      stationName,
      availableByType: getDefaultFleetForStation(stationId),
      updatedAt: nowIso,
    };

    const client = getSupabaseClient();
    if (client) {
      const { error } = await client.from(STATION_FLEET_TABLE).upsert(
        {
          station_id: stationId,
          station_name: stationName,
          available_by_type: fallback.availableByType,
          updated_at: nowIso,
        },
        { onConflict: 'station_id' }
      );

      if (error) throw error;
    }

    return fallback;
  }

  return toFleetInventory(stationId, stationName, row, nowIso);
}

export async function updateStationFleetInventory(
  stationId: string,
  stationName: string,
  nextAvailableByType: VehicleInventoryByType
): Promise<StationFleetInventory> {
  await seedFleetForKnownStationsOnce();

  const sanitized: VehicleInventoryByType = {
    PATROL_CAR: Math.max(0, Math.trunc(nextAvailableByType.PATROL_CAR || 0)),
    MOTORCYCLE: Math.max(0, Math.trunc(nextAvailableByType.MOTORCYCLE || 0)),
    VAN: Math.max(0, Math.trunc(nextAvailableByType.VAN || 0)),
    HEAVY: Math.max(0, Math.trunc(nextAvailableByType.HEAVY || 0)),
  };

  const nowIso = new Date().toISOString();
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from(STATION_FLEET_TABLE).upsert(
      {
        station_id: stationId,
        station_name: stationName,
        available_by_type: sanitized,
        updated_at: nowIso,
      },
      { onConflict: 'station_id' }
    );

    if (error) throw error;
  }

  return {
    stationId,
    stationName,
    availableByType: sanitized,
    updatedAt: nowIso,
  };
}

export async function createTransferRequest(input: TransferRequestCreateInput): Promise<string> {
  const requestedByType = normalizeInventoryInput(input.requestedByType);

  if (input.sourceStationId === input.destinationStationId) {
    throw new Error('Source and destination stations must be different.');
  }

  if (new Date(input.startDateTime).getTime() >= new Date(input.endDateTime).getTime()) {
    throw new Error('End date/time must be after start date/time.');
  }

  if (getTotalRequestedUnits(requestedByType) <= 0) {
    throw new Error('Select at least one vehicle quantity.');
  }

  const created = await insertRow<{ id: string }>(TRANSFER_REQUESTS_TABLE, {
    requesterUid: input.requester.uid,
    requesterEmail: input.requester.email,
    requesterStationId: input.requester.stationId,
    requesterStationName: input.requester.stationName,
    sourceStationId: input.sourceStationId,
    sourceStationName: input.sourceStationName,
    destinationStationId: input.destinationStationId,
    destinationStationName: input.destinationStationName,
    startDateTime: input.startDateTime,
    endDateTime: input.endDateTime,
    requestedByType,
    purpose: input.purpose,
    comments: input.comments?.trim() || null,
    status: 'PENDING',
  });

  return created.id;
}

export async function listTransferRequestsForAccount(
  account: AutomobileStationAccount
): Promise<AutomobileTransferRequest[]> {
  const nowIso = new Date().toISOString();

  const rows =
    account.role === 'ADMIN'
      ? await fetchRows<Record<string, unknown>>(TRANSFER_REQUESTS_TABLE, {
          order: { column: 'created_at', ascending: false },
          limit: 300,
        })
      : await fetchRows<Record<string, unknown>>(TRANSFER_REQUESTS_TABLE, {
          or: `requester_station_id.eq.${account.stationId},source_station_id.eq.${account.stationId}`,
          limit: 200,
        });

  const merged = new Map<string, AutomobileTransferRequest>();
  for (const row of rows) {
    const id = String(row.id ?? '');
    if (!id) continue;
    merged.set(id, mapTransferRequest(id, row, nowIso));
  }

  return [...merged.values()].sort((left, right) => {
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export async function approveTransferRequest(
  requestId: string,
  reviewer: AutomobileStationAccount
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { error } = await client.rpc('approve_transfer_request', {
    p_request_id: requestId,
    p_reviewer_uid: reviewer.uid,
    p_reviewer_email: reviewer.email,
    p_reviewer_station_id: reviewer.stationId,
    p_reviewer_is_admin: reviewer.role === 'ADMIN',
  });

  if (error) {
    throw new Error(error.message || 'Unable to approve transfer request.');
  }
}

export async function rejectTransferRequest(
  requestId: string,
  reviewer: AutomobileStationAccount,
  reason: string
): Promise<void> {
  const request = await fetchRow<Record<string, unknown>>(TRANSFER_REQUESTS_TABLE, requestId);

  if (!request) {
    throw new Error('Transfer request not found.');
  }

  const sourceStationId = String(request.sourceStationId ?? '');

  if (reviewer.role !== 'ADMIN' && reviewer.stationId !== sourceStationId) {
    throw new Error('Only the source station or admin can reject this request.');
  }

  if (String(request.status ?? 'PENDING') !== 'PENDING') {
    throw new Error('Only pending requests can be rejected.');
  }

  const nowIso = new Date().toISOString();
  await updateRow(TRANSFER_REQUESTS_TABLE, requestId, {
    status: 'REJECTED',
    reviewedByUid: reviewer.uid,
    reviewedByEmail: reviewer.email,
    reviewedAt: nowIso,
    rejectionReason: reason.trim() || 'Rejected by source station.',
    updatedAt: nowIso,
  });
}

export async function completeTransferRequest(
  requestId: string,
  reviewer: AutomobileStationAccount
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured.');

  const { error } = await client.rpc('complete_transfer_request', {
    p_request_id: requestId,
    p_reviewer_uid: reviewer.uid,
    p_reviewer_email: reviewer.email,
    p_reviewer_station_id: reviewer.stationId,
    p_reviewer_is_admin: reviewer.role === 'ADMIN',
  });

  if (error) {
    throw new Error(error.message || 'Unable to complete transfer request.');
  }
}
