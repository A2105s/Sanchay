import { NextResponse } from 'next/server';

import { getSessionContext } from '@/lib/api-role';
import { createSupabaseServerClient } from '@/utils/supabase/server';

interface Props {
  params: Promise<{ bookingId: string }>;
}

export async function PATCH(request: Request, { params }: Props) {
  const { bookingId } = await params;
  const body = (await request.json().catch(() => ({}))) as { approverName?: string };
  const session = getSessionContext(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: 'Authentication required' },
      { status: 401 }
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

    const approvedBy =
      body.approverName ?? session?.openSpaceName ?? session?.name ?? 'Admin Panel';
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'APPROVED',
        approved_by: approvedBy,
        approved_at: nowIso,
        rejected_reason: null,
        updated_at: nowIso,
      })
      .eq('id', bookingId);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      data: { id: bookingId, status: 'APPROVED', approvedBy },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 400 }
    );
  }
}
