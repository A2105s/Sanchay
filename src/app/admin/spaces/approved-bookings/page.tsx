'use client';

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import type { BookingStatus } from '@/types/spaces';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { db, isFirebaseReady } from '@/lib/firebase';

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
    if (!isFirebaseReady) {
      setLoadMessage('Firebase is not configured for approved bookings feed.');
      return;
    }

    const bookingsQuery = query(collection(db, 'bookings'), where('status', '==', 'APPROVED'));
    const unsubscribe = onSnapshot(bookingsQuery, (snapshot) => {
      const next = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          const startRaw = (data.startTime ?? data.startDateTime ?? '') as string;
          const endRaw = (data.endTime ?? data.endDateTime ?? '') as string;

          return {
            id: docSnap.id,
            bookingId: (data.bookingId as string) ?? `BK-${docSnap.id.slice(0, 8).toUpperCase()}`,
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
    });

    return () => unsubscribe();
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
