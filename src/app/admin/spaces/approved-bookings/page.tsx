'use client';

import { useEffect, useMemo, useState } from 'react';

import type { BookingStatus } from '@/types/spaces';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { fetchRows, subscribeToTable } from '@/lib/supabase-query';
import { isSupabaseConfigured } from '@/utils/supabase/client';

interface ApprovedBooking {
  id: string;
  bookingId: string;
  spaceId: string;
  spaceName: string;
  bookedByName: string;
  bookedBy: string;
  organizationName?: string;
  purpose: string;
  expectedAttendees: number;
  status: BookingStatus;
  startDateTime: string;
  endDateTime: string;
  approvedBy?: string;
  approvedAt?: string;
}

const formatBookingDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN');
};

export default function AdminSpacesApprovedBookingsPage() {
  const [bookings, setBookings] = useState<ApprovedBooking[]>([]);
  const [searchText, setSearchText] = useState('');
  const [loadMessage, setLoadMessage] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadMessage('Supabase is not configured for the approved bookings feed.');
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const rows = await fetchRows<Record<string, unknown>>('bookings', {
          filters: [{ column: 'status', value: 'APPROVED' }],
        });

        if (!active) return;

        const next = rows
          .map((data) => {
            const id = String(data.id ?? '');
            const startRaw = String(data.startTime ?? data.startDateTime ?? '');
            const endRaw = String(data.endTime ?? data.endDateTime ?? '');

            return {
              id,
              bookingId: (data.bookingId as string) ?? `BK-${id.slice(0, 8).toUpperCase()}`,
              spaceId: (data.spaceId as string) ?? '-',
              spaceName: (data.spaceName as string) ?? '-',
              bookedByName: (data.bookedByName as string) ?? '-',
              bookedBy: (data.bookedBy as string) ?? '-',
              organizationName: (data.organizationName as string) ?? undefined,
              purpose: (data.purpose as string) ?? '-',
              expectedAttendees: Number(data.expectedAttendees ?? 0),
              status: ((data.status as string) ?? 'APPROVED').toUpperCase() as BookingStatus,
              startDateTime: startRaw,
              endDateTime: endRaw,
              approvedBy: (data.approvedBy as string) ?? undefined,
              approvedAt: (data.approvedAt as string) ?? undefined,
            } satisfies ApprovedBooking;
          })
          .sort((a, b) => a.bookingId.localeCompare(b.bookingId));

        setBookings(next);
        setLoadMessage('');
      } catch {
        if (active) setLoadMessage('Unable to load approved bookings right now.');
      }
    };

    void load();
    const unsubscribe = subscribeToTable('bookings', () => void load());

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const filteredBookings = useMemo(() => {
    const queryText = searchText.trim().toLowerCase();
    if (!queryText) return bookings;

    return bookings.filter((booking) => {
      return (
        booking.bookingId.toLowerCase().includes(queryText) ||
        booking.spaceName.toLowerCase().includes(queryText) ||
        booking.bookedByName.toLowerCase().includes(queryText) ||
        booking.purpose.toLowerCase().includes(queryText)
      );
    });
  }, [bookings, searchText]);

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Approved Bookings</h1>
        <p className="text-sm text-muted-foreground">
          Live list of approved open-space bookings for operations visibility.
        </p>
      </header>

      <section className="grid gap-3 rounded-lg border bg-card p-3 text-sm text-muted-foreground md:grid-cols-2">
        <p>Total approved: {bookings.length}</p>
        <Input
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Search by booking, space, requester or purpose"
          aria-label="Search approved bookings"
        />
      </section>

      <section className="space-y-3">
        {filteredBookings.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            {loadMessage || 'No approved bookings found.'}
          </p>
        ) : null}

        {filteredBookings.map((booking) => (
          <article key={booking.id} className="card-elevated rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{booking.bookingId}</p>
                <p className="text-sm text-muted-foreground">
                  Space: {booking.spaceName} ({booking.spaceId})
                </p>
                <p className="text-sm text-muted-foreground">
                  Requester: {booking.bookedByName} ({booking.bookedBy})
                </p>
                <p className="text-sm text-muted-foreground">Purpose: {booking.purpose}</p>
                <p className="text-sm text-muted-foreground">
                  Attendees: {booking.expectedAttendees}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatBookingDateTime(booking.startDateTime)} -{' '}
                  {formatBookingDateTime(booking.endDateTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Approved by: {booking.approvedBy ?? '-'} on{' '}
                  {formatBookingDateTime(booking.approvedAt ?? '')}
                </p>
                <p className="text-xs text-muted-foreground">
                  Organization: {booking.organizationName ?? '-'}
                </p>
              </div>
              <Badge variant="outline">{booking.status}</Badge>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
