import { NextResponse } from 'next/server';

import { AUTH_COOKIE_NAME, createSessionCookieValue } from '@/lib/auth-session';
import { createSupabaseServerClient } from '@/utils/supabase/server';

import type { SessionCookiePayload } from '@/lib/auth-session';

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

const setSessionCookie = (response: NextResponse, payload: SessionCookiePayload) => {
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionCookieValue(payload),
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
};

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Invalid request body.' }, { status: 400 });
  }

  const accessToken =
    body &&
    typeof body === 'object' &&
    typeof (body as { accessToken?: unknown }).accessToken === 'string'
      ? (body as { accessToken: string }).accessToken
      : '';

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, message: 'A verified Supabase access token is required to sign in.' },
      { status: 401 }
    );
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(accessToken);

    if (authError || !user) {
      return NextResponse.json({ ok: false, message: 'Unable to sign in.' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('space_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    const openSpaceId = profile?.open_space_id as string | undefined;
    const openSpaceName = profile?.open_space_name as string | undefined;

    if (!openSpaceId || !openSpaceName) {
      return NextResponse.json(
        { ok: false, message: 'No linked open space profile found for this account.' },
        { status: 403 }
      );
    }

    const session = {
      id: `supabase-${user.id}`,
      uid: user.id,
      name: (profile?.name as string | undefined) ?? user.user_metadata?.name ?? 'Space Admin',
      email: user.email ?? '',
      role: 'MINISTRY' as const,
      openSpaceId,
      openSpaceName,
    };

    const response = NextResponse.json({
      ok: true,
      session: { ...session, signedInAt: new Date().toISOString() },
    });

    setSessionCookie(response, session);

    return response;
  } catch {
    return NextResponse.json({ ok: false, message: 'Unable to sign in.' }, { status: 401 });
  }
}
