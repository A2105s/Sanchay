import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('space_users').select('id').limit(1);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      backend: 'supabase',
      reachable: true,
    });
  } catch {
    // Log details server-side; never return driver/credential errors to the caller.
    return NextResponse.json(
      { success: false, backend: 'supabase', reachable: false },
      { status: 503 }
    );
  }
}
