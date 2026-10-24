import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  return { supabase, getResponse: () => supabaseResponse };
};

export type SupabaseMiddlewareResult = ReturnType<typeof createClient>;

/**
 * Refreshes the Supabase auth cookies and returns a response carrying them.
 * Returns a plain pass-through response when Supabase is not configured.
 */
export const updateSession = async (request: NextRequest) => {
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request });
  }

  const { supabase, getResponse } = createClient(request);

  // Required to refresh expired tokens; do not run code between client
  // creation and this call, or the session can desync from the cookies.
  await supabase.auth.getUser();

  return getResponse();
};
