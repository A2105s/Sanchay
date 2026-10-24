import { createBrowserClient } from '@supabase/ssr';

import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const requiredKeys = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const values: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabaseKey,
};

export const missingSupabaseClientKeys = requiredKeys.filter((key) => !values[key]);
export const isSupabaseConfigured = missingSupabaseClientKeys.length === 0;

let browserClient: SupabaseClient | null = null;

export const createClient = () => {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
    );
  }

  // One client per browser tab keeps the auth session and realtime socket shared.
  browserClient ??= createBrowserClient(supabaseUrl, supabaseKey);
  return browserClient;
};

/** Returns the browser client, or null when Supabase env vars are missing. */
export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured) return null;
  return createClient();
};
