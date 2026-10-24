import { NextResponse } from 'next/server';
import { z } from 'zod';

import { listSpaces } from '@/lib/spaces-service';
import { createSupabaseServerClient } from '@/utils/supabase/server';

const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  openSpaceName: z.string().trim().min(2).max(180),
});

const normalize = (value: string) => value.trim().toLowerCase();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = signupSchema.parse(body);

    const matchedSpace = listSpaces().find(
      (space) => normalize(space.name) === normalize(payload.openSpaceName)
    );

    if (!matchedSpace) {
      return NextResponse.json(
        {
          ok: false,
          message:
            'Open space not found in the registered list. Please select a valid registered open space name.',
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          name: payload.name,
          open_space_id: matchedSpace.id,
          open_space_name: matchedSpace.name,
        },
      },
    });

    if (error) throw error;

    if (!data.user) {
      throw new Error('Unable to create account at this time.');
    }

    const { error: profileError } = await supabase.from('space_users').upsert(
      {
        id: data.user.id,
        name: payload.name,
        email: payload.email,
        open_space_id: matchedSpace.id,
        open_space_name: matchedSpace.name,
        role: 'SPACE_ADMIN',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (profileError) throw profileError;

    return NextResponse.json({
      ok: true,
      message: data.session
        ? 'Account created successfully. You can now sign in.'
        : 'Account created. Confirm your email address, then sign in.',
      requiresEmailConfirmation: !data.session,
      user: {
        uid: data.user.id,
        email: data.user.email,
        displayName: payload.name,
        openSpaceId: matchedSpace.id,
        openSpaceName: matchedSpace.name,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { ok: false, message: 'Invalid signup data.', issues: error.flatten() },
        { status: 400 }
      );
    }

    const errorMessage =
      error instanceof Error &&
      /already registered|already exists|user already/i.test(error.message)
        ? 'An account with this email already exists. Please sign in.'
        : 'Unable to create account at this time.';

    return NextResponse.json({ ok: false, message: errorMessage }, { status: 400 });
  }
}
