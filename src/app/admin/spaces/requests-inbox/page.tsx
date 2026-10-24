'use client';

import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchRows, subscribeToTable, updateRow } from '@/lib/supabase-query';
import { isSupabaseConfigured } from '@/utils/supabase/client';
import type { BookingStatus } from '@/types/spaces';

interface AdminBooking {
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
  rejectedReason?: string;
}

const formatBookingDateTime = (value: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN');
};

export default function AdminSpacesRequestsInboxPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [reasonById, setReasonById] = useState<Record<string, string>>({});
  const [loadMessage, setLoadMessage] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoadMessage('Supabase is not configured for the live requests inbox.');
      return;
    }

    let active = true;

    const load = async () => {
      try {
        const rows = await fetchRows<Record<string, unknown>>('bookings', {
          filters: [{ column: 'status', value: 'PENDING' }],
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
              status: ((data.status as string) ?? 'PENDING').toUpperCase() as BookingStatus,
              startDateTime: startRaw,
              endDateTime: endRaw,
              approvedBy: (data.approvedBy as string) ?? undefined,
              rejectedReason: (data.rejectedReason as string) ?? undefined,
            } satisfies AdminBooking;
          })
          .sort((a, b) => a.bookingId.localeCompare(b.bookingId));

        setBookings(next);
        setLoadMessage('');
      } catch {
        if (active) setLoadMessage('Unable to load requests right now.');
      }
    };

    void load();
    const unsubscribe = subscribeToTable('bookings', () => void load());

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const pending = bookings.filter((booking) => booking.status === 'PENDING');

  const approve = async (id: string) => {
    setActionMessage('');
    const response = await fetch(`/api/spaces/bookings/${id}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ approverName: 'Admin Panel' }),
    });

    if (!response.ok) {
      await updateRow('bookings', id, {
        status: 'APPROVED',
        approvedBy: 'Admin Panel',
        approvedAt: new Date().toISOString(),
        rejectedReason: null,
      });
    }

    setActionMessage('Booking approved successfully.');
  };

  const reject = async (id: string) => {
    const reason = reasonById[id] ?? '';
    if (!reason.trim()) return;
    setActionMessage('');

    const response = await fetch(`/api/spaces/bookings/${id}/reject`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, actorName: 'Admin Panel' }),
    });

    if (!response.ok) {
      await updateRow('bookings', id, {
        status: 'REJECTED',
        rejectedReason: reason,
        rejectedBy: 'Admin Panel',
        rejectedAt: new Date().toISOString(),
        approvedBy: null,
      });
    }

    setActionMessage('Booking rejected successfully.');
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground">Requests Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Approve or reject requests booked on your space and monitor current statuses.
        </p>
      </header>

      <section className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
        Total requests: {bookings.length} | Pending: {pending.length}
      </section>

      {actionMessage ? (
        <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
          {actionMessage}
        </p>
      ) : null}

      <section className="space-y-3">
        {pending.length === 0 ? (
          <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
            {loadMessage || 'No pending requests.'}
          </p>
        ) : null}

        {pending.map((booking) => (
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
                  Organization: {booking.organizationName ?? '-'}
                </p>
              </div>
              <Badge variant="outline">{booking.status}</Badge>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
              <Input
                placeholder="Rejection reason"
                value={reasonById[booking.id] ?? ''}
                onChange={(event) =>
                  setReasonById((prev) => ({
                    ...prev,
                    [booking.id]: event.target.value,
                  }))
                }
              />
              <Button size="sm" onClick={() => approve(booking.id)}>
                Approve
              </Button>
              <Button size="sm" variant="destructive" onClick={() => reject(booking.id)}>
                Reject
              </Button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
