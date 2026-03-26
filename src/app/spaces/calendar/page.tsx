'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import { Activity, CalendarDays, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { db, isFirebaseReady } from '@/lib/firebase';
import type { BookingStatus, Space } from '@/types/spaces';

interface SpacesResponse {
  success: boolean;
  data: Space[];
}

interface CalendarBooking {
  id: string;
  bookingId: string;
  spaceName: string;
  purpose: string;
  status: BookingStatus;
  startDateTime: string;
  endDateTime: string;
  expectedAttendees: number;
}

const activeStatuses = new Set<BookingStatus>(['PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED']);

const pad = (value: number) => String(value).padStart(2, '0');

const toDateKey = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseBookingDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDateTime = (value: string) => {
  const date = parseBookingDate(value);
  if (!date) return '-';
  return date.toLocaleString('en-IN');
};

const formatReadableDate = (value: Date) => {
  return value.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const getDateRangeKeys = (startValue: string, endValue: string) => {
  const start = parseBookingDate(startValue);
  const end = parseBookingDate(endValue);
  if (!start || !end) return [] as string[];

  const rangeStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const rangeEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  if (rangeEnd < rangeStart) return [toDateKey(rangeStart)];

  const keys: string[] = [];
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    keys.push(toDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return keys;
};

const getMonthDates = (month: Date) => {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const days: Date[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
};

const bookingTouchesDate = (booking: CalendarBooking, dateKey: string) => {
  if (!activeStatuses.has(booking.status)) return false;
  return getDateRangeKeys(booking.startDateTime, booking.endDateTime).includes(dateKey);
};

export default function SpacesCalendarPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [search, setSearch] = useState('');
  const [spaceFilter, setSpaceFilter] = useState('ALL');
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [loadMessage, setLoadMessage] = useState('');
  const [sessionSpaceName, setSessionSpaceName] = useState('');

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesResponse;
      if (payload.success) {
        setSpaces(payload.data);
      }
    };

    void load();

    const loadSession = async () => {
      const authResponse = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!authResponse.ok) return;
      const authPayload = (await authResponse.json()) as {
        ok: boolean;
        session?: { openSpaceName?: string };
      };

      const openSpaceName = authPayload.session?.openSpaceName?.trim();
      if (openSpaceName) {
        setSessionSpaceName(openSpaceName);
        setSpaceFilter(openSpaceName);
      }
    };

    void loadSession();
  }, []);

  useEffect(() => {
    if (!isFirebaseReady) {
      setLoadMessage('Firebase is not configured for live booking calendar sync.');
      return;
    }

    const unsubscribe = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const next = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const startRaw = (data.startTime ?? data.startDateTime ?? '') as string;
          const endRaw = (data.endTime ?? data.endDateTime ?? '') as string;

          return {
            id: docSnap.id,
            bookingId: (data.bookingId as string) ?? `BK-${docSnap.id.slice(0, 8).toUpperCase()}`,
            spaceName: ((data.spaceName as string) ?? '-').trim(),
            purpose: (data.purpose as string) ?? '-',
            status: ((data.status as string) ?? 'PENDING').toUpperCase() as BookingStatus,
            startDateTime: startRaw,
            endDateTime: endRaw,
            expectedAttendees: Number(data.expectedAttendees ?? 0),
          } satisfies CalendarBooking;
        })
        .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));

      setBookings(next);
      setLoadMessage('');
    });

    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return spaces.filter((space) => {
      if (spaceFilter !== 'ALL' && space.name !== spaceFilter) return false;
      if (!q) return true;

      return (
        space.name.toLowerCase().includes(q) ||
        space.department.toLowerCase().includes(q) ||
        space.address.toLowerCase().includes(q)
      );
    });
  }, [search, spaceFilter, spaces]);

  const visibleSpaceNames = useMemo(() => {
    return new Set(filtered.map((space) => space.name.trim()));
  }, [filtered]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      if (spaceFilter !== 'ALL' && booking.spaceName !== spaceFilter) return false;
      if (
        spaceFilter === 'ALL' &&
        visibleSpaceNames.size > 0 &&
        !visibleSpaceNames.has(booking.spaceName)
      ) {
        return false;
      }

      if (!search.trim()) return true;
      const text = search.toLowerCase();
      return (
        booking.spaceName.toLowerCase().includes(text) ||
        booking.bookingId.toLowerCase().includes(text) ||
        booking.purpose.toLowerCase().includes(text)
      );
    });
  }, [bookings, search, spaceFilter, visibleSpaceNames]);

  const monthDates = useMemo(() => getMonthDates(currentMonth), [currentMonth]);

  const bookedDateKeys = useMemo(() => {
    const keys = new Set<string>();
    filteredBookings.forEach((booking) => {
      if (!activeStatuses.has(booking.status)) return;
      getDateRangeKeys(booking.startDateTime, booking.endDateTime).forEach((key) => keys.add(key));
    });
    return keys;
  }, [filteredBookings]);

  const bookedDates = useMemo(() => {
    return monthDates.filter((day) => bookedDateKeys.has(toDateKey(day)));
  }, [bookedDateKeys, monthDates]);

  const availableDates = useMemo(() => {
    return monthDates.filter((day) => !bookedDateKeys.has(toDateKey(day)));
  }, [bookedDateKeys, monthDates]);

  const selectedDateKey = toDateKey(selectedDate);

  const selectedDateBookings = useMemo(() => {
    return filteredBookings
      .filter((booking) => bookingTouchesDate(booking, selectedDateKey))
      .sort((a, b) => a.startDateTime.localeCompare(b.startDateTime));
  }, [filteredBookings, selectedDateKey]);

  const monthTotalDays = monthDates.length;
  const bookedDaysCount = bookedDates.length;
  const availableDaysCount = availableDates.length;
  const utilizationPercent = monthTotalDays
    ? Math.round((bookedDaysCount / monthTotalDays) * 100)
    : 0;

  const selectedDateBooked = selectedDateBookings.length > 0;

  return (
    <main id="maincontent" className="container-wide relative space-y-6 py-8">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-60 rounded-3xl bg-[radial-gradient(circle_at_top_right,_rgba(34,197,94,0.25),_transparent_52%),radial-gradient(circle_at_top_left,_rgba(239,68,68,0.22),_transparent_50%)]"
        aria-hidden
      />

      <header className="rounded-2xl border border-border/80 bg-card/90 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Open Space Live Booking Calendar
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Date-wise availability overview with real-time sync. Booked dates are red, available
              dates are green, and updates appear automatically when a new booking is made.
            </p>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700"
            role="status"
            aria-live="polite"
          >
            <Activity className="h-3.5 w-3.5 animate-pulse" aria-hidden />
            {isFirebaseReady ? 'Live sync active' : 'Live sync unavailable'}
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-border/70 bg-background/90 p-4">
            <p className="text-xs text-muted-foreground">Month Utilization</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{utilizationPercent}%</p>
          </article>
          <article className="rounded-xl border border-red-200/70 bg-red-50/70 p-4">
            <p className="text-xs text-red-700">Booked Days</p>
            <p className="mt-1 text-2xl font-semibold text-red-700">{bookedDaysCount}</p>
          </article>
          <article className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4">
            <p className="text-xs text-emerald-700">Available Days</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">{availableDaysCount}</p>
          </article>
          <article className="rounded-xl border border-border/70 bg-background/90 p-4">
            <p className="text-xs text-muted-foreground">Tracked Spaces</p>
            <p className="mt-1 text-2xl font-semibold text-foreground">{filtered.length}</p>
          </article>
        </div>
      </header>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
            <label className="relative block">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                placeholder="Search by space name, booking ID, or purpose"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
                aria-label="Search calendar bookings"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Space Filter</span>
              <select
                value={spaceFilter}
                onChange={(event) => setSpaceFilter(event.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Filter by open space"
              >
                <option value="ALL">All spaces</option>
                {spaces.map((space) => (
                  <option key={space.id} value={space.name}>
                    {space.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" /> Booked date
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" /> Available
              date
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Showing {currentMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
            </span>
          </div>

          <div className="rounded-xl border border-border/70 bg-background p-3">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) setSelectedDate(date);
              }}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              modifiers={{
                booked: bookedDates,
                available: availableDates,
              }}
              modifiersClassNames={{
                booked: 'bg-red-100 text-red-700 font-semibold hover:bg-red-200',
                available: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
              }}
              className="w-full"
            />
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm">
          <div className="rounded-xl border border-border/70 bg-background p-4">
            <p className="text-xs text-muted-foreground">Selected Date</p>
            <h2 className="mt-1 text-xl font-semibold text-foreground">
              {formatReadableDate(selectedDate)}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={
                  selectedDateBooked
                    ? 'border-red-300 text-red-700'
                    : 'border-emerald-300 text-emerald-700'
                }
              >
                {selectedDateBooked ? 'Booked' : 'Available'}
              </Badge>
              <Badge variant="outline">{selectedDateBookings.length} booking(s)</Badge>
              {sessionSpaceName ? (
                <Badge variant="outline">Space account: {sessionSpaceName}</Badge>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            {selectedDateBookings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4 text-sm text-emerald-700">
                This date is free for booking.
              </p>
            ) : (
              selectedDateBookings.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-xl border border-red-200 bg-red-50/40 p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{booking.bookingId}</p>
                      <p className="text-xs text-muted-foreground">{booking.spaceName}</p>
                    </div>
                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-foreground">{booking.purpose}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDateTime(booking.startDateTime)} - {formatDateTime(booking.endDateTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expected attendees: {booking.expectedAttendees}
                  </p>
                </article>
              ))
            )}

            {loadMessage ? (
              <p className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                {loadMessage}
              </p>
            ) : null}
          </div>
        </aside>
      </section>
    </main>
  );
}
