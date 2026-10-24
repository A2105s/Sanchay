-- Sanchay / Sanchay — Supabase schema
--
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query)
-- or with `supabase db execute --file supabase/schema.sql`.
--
-- It recreates the collections the app used in Firestore as Postgres tables,
-- enables Row Level Security with demo-friendly policies, adds the tables to
-- the realtime publication, and installs the two transfer RPCs that replace
-- the Firestore transactions.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.space_users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  open_space_id text,
  open_space_name text,
  role text not null default 'SPACE_ADMIN',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.spaces (
  id text primary key,
  name text,
  department text,
  space_type text,
  status text,
  district text,
  address text,
  capacity integer,
  area_sq_ft integer,
  is_idle boolean not null default false,
  amenities jsonb not null default '[]'::jsonb,
  location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_id text,
  space_id text,
  space_name text,
  booked_by text,
  booked_by_name text,
  booked_by_role text,
  booked_by_phone text,
  purpose text,
  organization_name text,
  expected_attendees integer not null default 0,
  asset_id text,
  start_date_time timestamptz,
  end_date_time timestamptz,
  start_time timestamptz,
  end_time timestamptz,
  status text not null default 'PENDING',
  approved_by text,
  approved_at timestamptz,
  rejected_by text,
  rejected_reason text,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_booked_by_idx on public.bookings (booked_by);
create index if not exists bookings_space_name_idx on public.bookings (space_name);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

create table if not exists public.space_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text,
  space_id text,
  space_name text,
  district text,
  address text,
  purpose text,
  requester_name text,
  requester_id text,
  organization_name text,
  expected_attendees integer,
  capacity integer,
  area_sq_ft integer,
  amenities jsonb not null default '[]'::jsonb,
  update_summary text,
  status text not null default 'PENDING',
  created_at timestamptz not null default now()
);

create table if not exists public.asset_passports (
  id text primary key,
  asset_id text,
  type text,
  sub_type text,
  name text,
  department text,
  location jsonb,
  status text,
  metadata jsonb,
  events jsonb not null default '[]'::jsonb,
  audit_hash text,
  photos jsonb not null default '[]'::jsonb,
  qr_code text,
  tags jsonb not null default '[]'::jsonb,
  is_idle boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_activity_at timestamptz
);

create table if not exists public.vehicles (
  id text primary key,
  registration_number text,
  display_name text,
  vehicle_type text,
  sector text,
  status text,
  department_name text,
  location_label text,
  coordinates jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  asset_id text,
  event_id text,
  action text,
  performed_by text,
  performed_by_role text,
  "timestamp" timestamptz not null default now(),
  prev_hash text,
  hash text,
  payload text not null default '{}'
);

create table if not exists public.automobile_station_accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  station_id text not null unique,
  station_name text not null,
  role text not null default 'STATION',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.station_fleet (
  station_id text primary key,
  station_name text not null,
  available_by_type jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.automobile_transfer_requests (
  id uuid primary key default gen_random_uuid(),
  requester_uid text,
  requester_email text,
  requester_station_id text,
  requester_station_name text,
  source_station_id text,
  source_station_name text,
  destination_station_id text,
  destination_station_name text,
  start_date_time timestamptz,
  end_date_time timestamptz,
  requested_by_type jsonb not null default '{}'::jsonb,
  purpose text,
  comments text,
  status text not null default 'PENDING',
  reviewed_by_uid text,
  reviewed_by_email text,
  reviewed_at timestamptz,
  rejection_reason text,
  completed_by_uid text,
  completed_by_email text,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transfer_requests_requester_idx
  on public.automobile_transfer_requests (requester_station_id);
create index if not exists transfer_requests_source_idx
  on public.automobile_transfer_requests (source_station_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The app authenticates through Supabase Auth, but most reads run with the
-- publishable key from the browser. Policies below keep the demo workflows
-- usable; tighten them before exposing real government data.
-- ---------------------------------------------------------------------------

alter table public.space_users enable row level security;
alter table public.spaces enable row level security;
alter table public.bookings enable row level security;
alter table public.space_requests enable row level security;
alter table public.asset_passports enable row level security;
alter table public.vehicles enable row level security;
alter table public.audit_logs enable row level security;
alter table public.automobile_station_accounts enable row level security;
alter table public.station_fleet enable row level security;
alter table public.automobile_transfer_requests enable row level security;

drop policy if exists "space_users read" on public.space_users;
create policy "space_users read" on public.space_users for select using (true);
drop policy if exists "space_users insert" on public.space_users;
create policy "space_users insert" on public.space_users for insert with check (true);
drop policy if exists "space_users update" on public.space_users;
create policy "space_users update" on public.space_users for update using (true) with check (true);

drop policy if exists "spaces read" on public.spaces;
create policy "spaces read" on public.spaces for select using (true);
drop policy if exists "spaces insert" on public.spaces;
create policy "spaces insert" on public.spaces for insert with check (true);
drop policy if exists "spaces update" on public.spaces;
create policy "spaces update" on public.spaces for update using (true) with check (true);

drop policy if exists "bookings read" on public.bookings;
create policy "bookings read" on public.bookings for select using (true);
drop policy if exists "bookings insert" on public.bookings;
create policy "bookings insert" on public.bookings for insert with check (status = 'PENDING');
drop policy if exists "bookings update" on public.bookings;
create policy "bookings update" on public.bookings for update using (true) with check (true);

drop policy if exists "space_requests read" on public.space_requests;
create policy "space_requests read" on public.space_requests for select using (true);
drop policy if exists "space_requests insert" on public.space_requests;
create policy "space_requests insert" on public.space_requests for insert with check (true);
drop policy if exists "space_requests update" on public.space_requests;
create policy "space_requests update" on public.space_requests for update using (true) with check (true);

drop policy if exists "asset_passports read" on public.asset_passports;
create policy "asset_passports read" on public.asset_passports for select using (true);
drop policy if exists "asset_passports write" on public.asset_passports;
create policy "asset_passports write" on public.asset_passports for all using (true) with check (true);

drop policy if exists "vehicles read" on public.vehicles;
create policy "vehicles read" on public.vehicles for select using (true);
drop policy if exists "vehicles write" on public.vehicles;
create policy "vehicles write" on public.vehicles for all using (true) with check (true);

drop policy if exists "audit_logs read" on public.audit_logs;
create policy "audit_logs read" on public.audit_logs for select using (true);
drop policy if exists "audit_logs write" on public.audit_logs;
create policy "audit_logs write" on public.audit_logs for all using (true) with check (true);

drop policy if exists "station_accounts read" on public.automobile_station_accounts;
create policy "station_accounts read" on public.automobile_station_accounts for select using (true);
drop policy if exists "station_accounts insert" on public.automobile_station_accounts;
create policy "station_accounts insert" on public.automobile_station_accounts for insert with check (true);
drop policy if exists "station_accounts update" on public.automobile_station_accounts;
create policy "station_accounts update" on public.automobile_station_accounts for update using (true) with check (true);

drop policy if exists "station_fleet read" on public.station_fleet;
create policy "station_fleet read" on public.station_fleet for select using (true);
drop policy if exists "station_fleet write" on public.station_fleet;
create policy "station_fleet write" on public.station_fleet for all using (true) with check (true);

drop policy if exists "transfer_requests read" on public.automobile_transfer_requests;
create policy "transfer_requests read" on public.automobile_transfer_requests for select using (true);
drop policy if exists "transfer_requests insert" on public.automobile_transfer_requests;
create policy "transfer_requests insert" on public.automobile_transfer_requests for insert with check (true);
drop policy if exists "transfer_requests update" on public.automobile_transfer_requests;
create policy "transfer_requests update" on public.automobile_transfer_requests for update using (true) with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on
  public.space_users,
  public.spaces,
  public.bookings,
  public.space_requests,
  public.asset_passports,
  public.vehicles,
  public.audit_logs,
  public.automobile_station_accounts,
  public.station_fleet,
  public.automobile_transfer_requests
to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

do $$
declare
  target text;
begin
  foreach target in array array[
    'space_users',
    'spaces',
    'bookings',
    'space_requests',
    'asset_passports',
    'vehicles',
    'station_fleet',
    'automobile_transfer_requests'
  ] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', target);
    exception
      when duplicate_object then null;
      when undefined_object then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Transfer helpers (replace the Firestore transactions)
-- ---------------------------------------------------------------------------

-- Mirrors the deterministic starter fleet the client used to seed.
create or replace function public.default_station_fleet(p_station_id text)
returns jsonb
language plpgsql
immutable
as $$
declare
  total integer := 0;
  variation integer;
  i integer := 1;
begin
  while i <= length(p_station_id) loop
    total := total + ascii(substr(p_station_id, i, 1));
    i := i + 1;
  end loop;

  variation := total % 4;

  return jsonb_build_object(
    'PATROL_CAR', 20 + variation,
    'MOTORCYCLE', 12 + (variation % 3),
    'VAN', 6 + (variation % 2),
    'HEAVY', 4
  );
end;
$$;

create or replace function public.apply_inventory_delta(
  p_current jsonb,
  p_delta jsonb,
  p_sign integer
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'PATROL_CAR',
      greatest(0, coalesce((p_current ->> 'PATROL_CAR')::int, 0) + p_sign * coalesce((p_delta ->> 'PATROL_CAR')::int, 0)),
    'MOTORCYCLE',
      greatest(0, coalesce((p_current ->> 'MOTORCYCLE')::int, 0) + p_sign * coalesce((p_delta ->> 'MOTORCYCLE')::int, 0)),
    'VAN',
      greatest(0, coalesce((p_current ->> 'VAN')::int, 0) + p_sign * coalesce((p_delta ->> 'VAN')::int, 0)),
    'HEAVY',
      greatest(0, coalesce((p_current ->> 'HEAVY')::int, 0) + p_sign * coalesce((p_delta ->> 'HEAVY')::int, 0))
  );
$$;

create or replace function public.approve_transfer_request(
  p_request_id uuid,
  p_reviewer_uid text,
  p_reviewer_email text,
  p_reviewer_station_id text,
  p_reviewer_is_admin boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.automobile_transfer_requests;
  source_row public.station_fleet;
  destination_row public.station_fleet;
  vehicle_key text;
  available integer;
  requested integer;
begin
  select * into request_row
  from public.automobile_transfer_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Transfer request not found.';
  end if;

  if request_row.status <> 'PENDING' then
    raise exception 'Only pending requests can be approved.';
  end if;

  if not coalesce(p_reviewer_is_admin, false)
     and p_reviewer_station_id <> request_row.source_station_id then
    raise exception 'Only the source station or admin can approve this request.';
  end if;

  insert into public.station_fleet (station_id, station_name, available_by_type)
  values (
    request_row.source_station_id,
    request_row.source_station_name,
    public.default_station_fleet(request_row.source_station_id)
  )
  on conflict (station_id) do nothing;

  insert into public.station_fleet (station_id, station_name, available_by_type)
  values (
    request_row.destination_station_id,
    request_row.destination_station_name,
    public.default_station_fleet(request_row.destination_station_id)
  )
  on conflict (station_id) do nothing;

  select * into source_row
  from public.station_fleet
  where station_id = request_row.source_station_id
  for update;

  select * into destination_row
  from public.station_fleet
  where station_id = request_row.destination_station_id
  for update;

  foreach vehicle_key in array array['PATROL_CAR', 'MOTORCYCLE', 'VAN', 'HEAVY'] loop
    available := coalesce((source_row.available_by_type ->> vehicle_key)::int, 0);
    requested := coalesce((request_row.requested_by_type ->> vehicle_key)::int, 0);

    if available < requested then
      raise exception 'Insufficient % at source station.', lower(replace(vehicle_key, '_', ' '));
    end if;
  end loop;

  update public.station_fleet
  set available_by_type = public.apply_inventory_delta(
        source_row.available_by_type,
        request_row.requested_by_type,
        -1
      ),
      updated_at = now()
  where station_id = request_row.source_station_id;

  update public.station_fleet
  set available_by_type = public.apply_inventory_delta(
        destination_row.available_by_type,
        request_row.requested_by_type,
        1
      ),
      updated_at = now()
  where station_id = request_row.destination_station_id;

  update public.automobile_transfer_requests
  set status = 'ALLOCATED',
      reviewed_by_uid = p_reviewer_uid,
      reviewed_by_email = p_reviewer_email,
      reviewed_at = now(),
      rejection_reason = null,
      updated_at = now()
  where id = p_request_id;
end;
$$;

create or replace function public.complete_transfer_request(
  p_request_id uuid,
  p_reviewer_uid text,
  p_reviewer_email text,
  p_reviewer_station_id text,
  p_reviewer_is_admin boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  request_row public.automobile_transfer_requests;
  source_row public.station_fleet;
  destination_row public.station_fleet;
  vehicle_key text;
  available integer;
  requested integer;
begin
  select * into request_row
  from public.automobile_transfer_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Transfer request not found.';
  end if;

  if request_row.status not in ('ALLOCATED', 'APPROVED') then
    raise exception 'Only allocated requests can be marked completed.';
  end if;

  if not coalesce(p_reviewer_is_admin, false)
     and p_reviewer_station_id <> request_row.destination_station_id then
    raise exception 'Only the destination station or admin can complete this request.';
  end if;

  select * into source_row
  from public.station_fleet
  where station_id = request_row.source_station_id
  for update;

  select * into destination_row
  from public.station_fleet
  where station_id = request_row.destination_station_id
  for update;

  if destination_row.station_id is null then
    raise exception 'Destination station inventory not found.';
  end if;

  foreach vehicle_key in array array['PATROL_CAR', 'MOTORCYCLE', 'VAN', 'HEAVY'] loop
    available := coalesce((destination_row.available_by_type ->> vehicle_key)::int, 0);
    requested := coalesce((request_row.requested_by_type ->> vehicle_key)::int, 0);

    if available < requested then
      raise exception 'Destination inventory is lower than allocated quantity.';
    end if;
  end loop;

  update public.station_fleet
  set available_by_type = public.apply_inventory_delta(
        source_row.available_by_type,
        request_row.requested_by_type,
        1
      ),
      updated_at = now()
  where station_id = request_row.source_station_id;

  update public.station_fleet
  set available_by_type = public.apply_inventory_delta(
        destination_row.available_by_type,
        request_row.requested_by_type,
        -1
      ),
      updated_at = now()
  where station_id = request_row.destination_station_id;

  update public.automobile_transfer_requests
  set status = 'COMPLETED',
      completed_by_uid = p_reviewer_uid,
      completed_by_email = p_reviewer_email,
      completed_at = now(),
      updated_at = now()
  where id = p_request_id;
end;
$$;

grant execute on function public.approve_transfer_request(uuid, text, text, text, boolean)
  to anon, authenticated;
grant execute on function public.complete_transfer_request(uuid, text, text, text, boolean)
  to anon, authenticated;
