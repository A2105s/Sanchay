'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import {
  ArrowRight,
  Building2,
  CarFront,
  ClipboardCheck,
  Languages,
  LocateFixed,
  Shield,
  Sparkles,
  TimerReset,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { GradientBlinds } from '@/components/effects/GradientBlinds';
import { AssetPassportCard } from '@/components/nationtrack/AssetPassportCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { db, isFirebaseReady } from '@/lib/firebase';
import { nationTrackService } from '@/lib/nationtrack-service';
import type { AssetPassport, DashboardMetrics } from '@/types/nationtrack';

type GenericDoc = Record<string, unknown>;

const normalizeText = (value: unknown, fallback: string) => {
  if (typeof value !== 'string') return fallback;
  const next = value.trim();
  return next.length > 0 ? next : fallback;
};

const normalizeStatus = (value: unknown, fallback = 'UNKNOWN') =>
  normalizeText(value, fallback).toUpperCase();

const toDisplayLabel = (raw: string) =>
  raw
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const sortedEntries = (record: Record<string, number>, limit = 6) =>
  Object.entries(record)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

const getRecordArray = (input: unknown): GenericDoc[] => {
  if (!Array.isArray(input)) return [];
  return input.filter((item): item is GenericDoc => typeof item === 'object' && item !== null);
};

const dedupeByKey = (items: GenericDoc[], getKey: (item: GenericDoc) => string): GenericDoc[] => {
  const seen = new Set<string>();
  const result: GenericDoc[] = [];

  for (const item of items) {
    const key = getKey(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
};

export default function HomePage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [highlights, setHighlights] = useState<AssetPassport[]>([]);
  const [vehicleCategoryCounts, setVehicleCategoryCounts] = useState<Record<string, number>>({});
  const [freeSpaceCategoryCounts, setFreeSpaceCategoryCounts] = useState<Record<string, number>>(
    {}
  );
  const [bookingStatusCounts, setBookingStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboardMetrics, assets] = await Promise.all([
          nationTrackService.getDashboardMetrics(),
          nationTrackService.getAssets(),
        ]);
        setMetrics(dashboardMetrics);
        setHighlights(assets.slice(0, 3));
      } catch (error) {
        console.error('Failed to load NationTrack home data', error);
        setMetrics(null);
        setHighlights([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    let passportAssets: GenericDoc[] = [];
    let moduleSpaces: GenericDoc[] = [];
    let moduleVehicles: GenericDoc[] = [];
    let realtimeSpaces: GenericDoc[] = [];
    let realtimeVehicles: GenericDoc[] = [];
    let bookings: GenericDoc[] = [];

    const recomputeLiveDashboard = () => {
      const passportVehicleAssets = passportAssets.filter(
        (asset) => normalizeStatus(asset.type) === 'VEHICLE'
      );
      const passportSpaceAssets = passportAssets.filter(
        (asset) => normalizeStatus(asset.type) === 'SPACE'
      );

      const effectiveVehicles = dedupeByKey(
        [...moduleVehicles, ...realtimeVehicles, ...passportVehicleAssets],
        (vehicle) =>
          normalizeText(
            vehicle.id ?? vehicle.assetId ?? vehicle.registrationNumber ?? vehicle.displayName,
            ''
          )
      );

      const effectiveSpaces = dedupeByKey(
        [...moduleSpaces, ...realtimeSpaces, ...passportSpaceAssets],
        (space) => {
          const directId = normalizeText(space.id ?? space.assetId, '');
          if (directId) return directId;

          const namePart = normalizeText(space.name, 'space');
          const typePart = normalizeText(
            space.spaceType ?? space.subType ?? space.department,
            'general'
          );
          return `${namePart}-${typePart}`;
        }
      );

      const nextMetrics: DashboardMetrics = {
        totalAssets: effectiveVehicles.length + effectiveSpaces.length,
        activeAssets:
          effectiveVehicles.filter((vehicle) => normalizeStatus(vehicle.status) === 'MOVING')
            .length +
          effectiveSpaces.filter((space) => {
            const status = normalizeStatus(space.status);
            return status === 'AVAILABLE' || status === 'BOOKED' || status === 'ACTIVE';
          }).length,
        idleAssets:
          effectiveVehicles.filter((vehicle) => normalizeStatus(vehicle.status) === 'IDLE').length +
          effectiveSpaces.filter(
            (space) => normalizeStatus(space.status) === 'IDLE' || space.isIdle === true
          ).length,
        maintenanceAssets:
          effectiveVehicles.filter((vehicle) => normalizeStatus(vehicle.status) === 'BREAKDOWN')
            .length +
          effectiveSpaces.filter((space) => normalizeStatus(space.status) === 'MAINTENANCE').length,
        activeBookings: bookings.filter((booking) => {
          const status = normalizeStatus(booking.status);
          return status === 'APPROVED' || status === 'ACTIVE';
        }).length,
      };

      const nextVehicleCategories = effectiveVehicles.reduce<Record<string, number>>(
        (acc, vehicle) => {
          const category = normalizeText(vehicle.vehicleType ?? vehicle.subType, 'OTHER');
          acc[category] = (acc[category] ?? 0) + 1;
          return acc;
        },
        {}
      );

      const nextFreeSpaceCategories = effectiveSpaces.reduce<Record<string, number>>(
        (acc, space) => {
          const status = normalizeStatus(space.status);
          if (status !== 'AVAILABLE' && status !== 'ACTIVE') return acc;
          const category = normalizeText(space.spaceType ?? space.subType, 'OTHER');
          acc[category] = (acc[category] ?? 0) + 1;
          return acc;
        },
        {}
      );

      const nextBookingStatuses = bookings.reduce<Record<string, number>>((acc, booking) => {
        const status = normalizeStatus(booking.status, 'UNKNOWN');
        acc[status] = (acc[status] ?? 0) + 1;
        return acc;
      }, {});

      setMetrics(nextMetrics);
      setVehicleCategoryCounts(nextVehicleCategories);
      setFreeSpaceCategoryCounts(nextFreeSpaceCategories);
      setBookingStatusCounts(nextBookingStatuses);
    };

    const loadModuleAssets = async () => {
      try {
        const [spacesResponse, vehiclesResponse] = await Promise.all([
          fetch('/api/spaces', { cache: 'no-store' }),
          fetch('/api/automobiles/vehicles?status=ALL', { cache: 'no-store' }),
        ]);

        if (spacesResponse.ok) {
          const spacesJson = (await spacesResponse.json()) as { data?: unknown };
          moduleSpaces = getRecordArray(spacesJson.data);
        }

        if (vehiclesResponse.ok) {
          const vehiclesJson = (await vehiclesResponse.json()) as {
            data?: unknown;
            vehicles?: unknown;
          };

          moduleVehicles = getRecordArray(vehiclesJson.data ?? vehiclesJson.vehicles);
        }

        recomputeLiveDashboard();
      } catch {
        // Keep last known values if network fetch fails.
      }
    };

    void loadModuleAssets();
    const moduleAssetsInterval = globalThis.setInterval(() => {
      void loadModuleAssets();
    }, 20_000);

    let unsubAssets: (() => void) | null = null;
    let unsubSpaces: (() => void) | null = null;
    let unsubVehicles: (() => void) | null = null;
    let unsubBookings: (() => void) | null = null;

    if (isFirebaseReady) {
      unsubAssets = onSnapshot(
        collection(db, 'asset_passports'),
        (snapshot) => {
          passportAssets = snapshot.docs.map((docSnap) => docSnap.data() as GenericDoc);
          recomputeLiveDashboard();
        },
        () => {
          passportAssets = [];
          recomputeLiveDashboard();
        }
      );

      unsubSpaces = onSnapshot(
        collection(db, 'spaces'),
        (snapshot) => {
          realtimeSpaces = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
          recomputeLiveDashboard();
        },
        () => {
          realtimeSpaces = [];
          recomputeLiveDashboard();
        }
      );

      unsubVehicles = onSnapshot(
        collection(db, 'vehicles'),
        (snapshot) => {
          realtimeVehicles = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          recomputeLiveDashboard();
        },
        () => {
          realtimeVehicles = [];
          recomputeLiveDashboard();
        }
      );

      unsubBookings = onSnapshot(
        collection(db, 'bookings'),
        (snapshot) => {
          bookings = snapshot.docs.map((docSnap) => docSnap.data() as GenericDoc);
          recomputeLiveDashboard();
        },
        () => {
          bookings = [];
          recomputeLiveDashboard();
        }
      );
    }

    return () => {
      globalThis.clearInterval(moduleAssetsInterval);
      unsubAssets?.();
      unsubSpaces?.();
      unsubVehicles?.();
      unsubBookings?.();
    };
  }, []);

  const vehicleCategoryList = sortedEntries(vehicleCategoryCounts);
  const freeSpaceCategoryList = sortedEntries(freeSpaceCategoryCounts);
  const bookingStatusList = sortedEntries(bookingStatusCounts);

  const maxVehicleCount = vehicleCategoryList[0]?.[1] ?? 1;
  const maxSpaceCount = freeSpaceCategoryList[0]?.[1] ?? 1;
  const maxBookingCount = bookingStatusList[0]?.[1] ?? 1;

  return (
    <>
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 z-0" aria-hidden>
          <GradientBlinds
            className="absolute inset-0"
            gradientColors={['#FF9933', '#FFFFFF', '#138808']}
            angle={-15}
            noise={0.3}
            blindCount={24}
            blindMinWidth={60}
            mouseDampening={0.15}
            mirrorGradient={false}
            spotlightRadius={0.7}
            spotlightSoftness={1.0}
            spotlightOpacity={1.0}
            distortAmount={0}
            shineDirection="left"
            mixBlendMode="lighten"
          />
        </div>

        <div className="container-wide relative z-20 py-16 text-center md:py-24">
          <h1 className="hero-dynamic-contrast hero-dynamic-contrast-strong mb-4 text-balance font-sans text-6xl font-extrabold tracking-tighter md:text-7xl lg:text-8xl">
            NationTrack
          </h1>
          <p className="hero-dynamic-contrast mb-3 text-xl font-medium md:text-2xl">
            Public Asset Intelligence for Operational Governance
          </p>
          <p className="hero-dynamic-contrast mx-auto mb-10 max-w-3xl text-base leading-relaxed md:text-lg">
            Track vehicles, spaces, and service infrastructure through digital passports, booking
            workflows, and auditable operational events in a single control layer.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/project-overview">
              <Button
                size="lg"
                className="gap-2 bg-white font-medium text-primary hover:bg-white/90"
              >
                Project Overview
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 w-full">
          <svg
            viewBox="0 0 1440 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full"
            preserveAspectRatio="none"
          >
            <path
              d="M0,50 C240,80 480,80 720,50 C960,20 1200,20 1440,50 L1440,100 L0,100 Z"
              fill="hsl(var(--background))"
            />
          </svg>
        </div>
      </section>

      <section className="pb-8">
        <div className="container-wide">
          <div className="mb-4 text-center">
            <p className="mx-auto mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-sky-300 bg-sky-50 px-4 py-1.5 text-xs font-semibold text-sky-800">
              <Languages className="h-3.5 w-3.5" aria-hidden />
              Website Supported Languages: English, Hindi, Marathi, Tamil, Bengali
            </p>
            <h2 className="text-2xl font-bold text-foreground md:text-3xl">
              Choose Your Operations Role
            </h2>
            <p className="mt-2 text-muted-foreground">
              Open the role module you manage. Admin can be accessed from the header button.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <article className="card-elevated rounded-xl border border-blue-300 bg-blue-50 p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <CarFront className="h-5 w-5 text-blue-700" />
                Automobiles Role
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Manage vehicle registries, compliance lifecycle, seizures, and auctions.
              </p>
              <div className="mt-4">
                <Link href="/automobiles">
                  <Button variant="outline" className="gap-2">
                    Open Automobiles
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </article>

            <article className="card-elevated rounded-xl border border-indigo-300 bg-indigo-50 p-5">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Building2 className="h-5 w-5 text-indigo-700" />
                Office Spaces Role
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Supervise spaces registry, contracts, map operations, and revenue analytics.
              </p>
              <div className="mt-4">
                <Link href="/spaces/auth">
                  <Button variant="outline" className="gap-2">
                    Open Spaces
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-6 py-12">
        <div className="container-wide">
          <div className="mb-3 flex items-center justify-end">
            <p className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              Live sync enabled
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {[
              {
                value: metrics?.totalAssets ?? 0,
                label: 'Total Assets',
                text: 'text-azure-700',
                bg: 'bg-azure-50 border-azure-300',
              },
              {
                value: metrics?.activeAssets ?? 0,
                label: 'Active',
                text: 'text-green-700',
                bg: 'bg-green-50 border-green-300',
              },
              {
                value: metrics?.idleAssets ?? 0,
                label: 'Idle',
                text: 'text-amber-700',
                bg: 'bg-amber-50 border-amber-300',
              },
              {
                value: metrics?.maintenanceAssets ?? 0,
                label: 'Maintenance',
                text: 'text-red-700',
                bg: 'bg-red-50 border-red-300',
              },
              {
                value: metrics?.activeBookings ?? 0,
                label: 'Active Bookings',
                text: 'text-indigo-700',
                bg: 'bg-indigo-50 border-indigo-300',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-xl border p-5 text-center transition-shadow hover:shadow-md ${stat.bg}`}
              >
                <p className={`mb-1 text-xl font-bold md:text-2xl ${stat.text}`}>{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
              <h3 className="text-sm font-semibold text-blue-900">Automobile Categories</h3>
              <p className="mt-1 text-xs text-blue-700/90">Live distribution by vehicle type</p>
              <div className="mt-3 space-y-2">
                {vehicleCategoryList.length > 0 ? (
                  vehicleCategoryList.map(([category, count]) => (
                    <div key={category}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-blue-900">
                          {toDisplayLabel(category)}
                        </span>
                        <span className="text-blue-700">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-blue-100">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${Math.max(8, (count / maxVehicleCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-blue-800">No vehicle category data yet.</p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
              <h3 className="text-sm font-semibold text-emerald-900">Free Space Categories</h3>
              <p className="mt-1 text-xs text-emerald-700/90">Available spaces by category</p>
              <div className="mt-3 space-y-2">
                {freeSpaceCategoryList.length > 0 ? (
                  freeSpaceCategoryList.map(([category, count]) => (
                    <div key={category}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-emerald-900">
                          {toDisplayLabel(category)}
                        </span>
                        <span className="text-emerald-700">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${Math.max(8, (count / maxSpaceCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-emerald-800">No free-space data yet.</p>
                )}
              </div>
            </article>

            <article className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-4">
              <h3 className="text-sm font-semibold text-indigo-900">Booking Live Status</h3>
              <p className="mt-1 text-xs text-indigo-700/90">Real-time booking flow by status</p>
              <div className="mt-3 space-y-2">
                {bookingStatusList.length > 0 ? (
                  bookingStatusList.map(([status, count]) => (
                    <div key={status}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-medium text-indigo-900">
                          {toDisplayLabel(status)}
                        </span>
                        <span className="text-indigo-700">{count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-indigo-100">
                        <div
                          className="h-full rounded-full bg-indigo-500"
                          style={{ width: `${Math.max(8, (count / maxBookingCount) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-indigo-800">No booking status data yet.</p>
                )}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section-padding bg-muted/30">
        <div className="container-wide">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <h2 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
                Live Asset Passports
              </h2>
              <p className="text-muted-foreground">
                Operationally relevant assets surfaced from your current registry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-56 w-full rounded-3xl" />
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ))}
              </>
            ) : highlights.length > 0 ? (
              highlights.map((asset) => (
                <AssetPassportCard
                  key={asset.id}
                  asset={asset}
                  href={
                    asset.type === 'VEHICLE' ? `/automobiles/${asset.id}` : `/spaces/${asset.id}`
                  }
                />
              ))
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-muted-foreground">No assets found yet in asset_passports.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide">
          <div className="rounded-2xl border-2 border-azure-400 bg-azure-50 p-8 shadow-sm dark:border-azure-800 dark:bg-card md:p-10">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-2xl font-bold text-foreground md:text-3xl">
                NationTrack Intelligence Layer
              </h2>
              <p className="mx-auto max-w-2xl text-muted-foreground">
                A modular control stack for transport and public-space governance.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: LocateFixed,
                  title: 'Live Asset Visibility',
                  description:
                    'Unify operational status for ambulances, fleet vehicles, and public spaces through digital passports.',
                  gradient: 'from-blue-500 to-cyan-500',
                },
                {
                  icon: ClipboardCheck,
                  title: 'Booking Governance',
                  description:
                    'Run structured approval workflows for spaces and keep booking history auditable and reportable.',
                  gradient: 'from-indigo-500 to-blue-500',
                },
                {
                  icon: Shield,
                  title: 'Audit Integrity',
                  description:
                    'Build trust with immutable event records that support compliance, audits, and accountability.',
                  gradient: 'from-emerald-500 to-teal-500',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border bg-card p-6 text-center transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient}`}
                  >
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-wide max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm md:p-10">
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  title: 'Daily Idle Detection',
                  description: 'Identify under-utilized assets and support reuse recommendations.',
                },
                {
                  icon: TimerReset,
                  title: 'Operational Alerts',
                  description: 'Stay ahead of maintenance and compliance deadlines.',
                },
                {
                  icon: Shield,
                  title: 'Traceable Decisions',
                  description: 'Track who changed what, when, and why through audit logs.',
                },
              ].map((item) => (
                <div key={item.title} className="rounded-xl border bg-muted/30 p-5">
                  <item.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
