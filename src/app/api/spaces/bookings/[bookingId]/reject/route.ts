import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/api-role';
import { createSupabaseServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { bookingId } = await params;
  const body = (await request.json()) as { reason?: string; actorName?: string };
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
    );
  }

  if (!body.reason?.trim()) {
    return NextResponse.json(
      { success: false, message: 'Rejection reason is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: booking, error: readError } = await supabase
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .maybeSingle();

    if (readError) throw readError;

    if (!booking) {
      return NextResponse.json({ success: false, message: 'Booking not found' }, { status: 404 });
    }

    const rejectedBy = body.actorName ?? session?.openSpaceName ?? session?.name ?? 'Admin Panel';
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'REJECTED',
        rejected_reason: body.reason,
        rejected_by: rejectedBy,
        rejected_at: nowIso,
        approved_by: null,
        updated_at: nowIso,
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: { id: bookingId, status: 'REJECTED', rejectedReason: body.reason, rejectedBy },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
