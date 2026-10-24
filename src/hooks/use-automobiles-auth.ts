'use client';

import type { User } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { AUTH_BYPASS, DEV_STATION_ACCOUNT } from '@/lib/dev-auth';
import { getSupabaseClient } from '@/utils/supabase/client';
import type { AutomobileStationAccount } from '@/types/automobiles';

interface UseAutomobilesAuthResult {
  loading: boolean;
  user: User | null;
  account: AutomobileStationAccount | null;
  isAuthenticated: boolean;
  signOutAccount: () => Promise<void>;
}

interface StationAccountRow {
  id: string;
  email: string;
  station_id: string;
  station_name: string;
  role: 'ADMIN' | 'STATION';
  created_at?: string;
  updated_at?: string;
}

export function useAutomobilesAuth(): UseAutomobilesAuthResult {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<AutomobileStationAccount | null>(null);

  useEffect(() => {
    if (AUTH_BYPASS) {
      setLoading(false);
      setUser(null);
      setAccount(DEV_STATION_ACCOUNT);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      setUser(null);
      setAccount(null);
      return;
    }

    let active = true;

    const loadAccount = async (nextUser: User | null) => {
      if (!active) return;

      setUser(nextUser);

      if (!nextUser) {
        setAccount(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('automobile_station_accounts')
          .select('*')
          .eq('id', nextUser.id)
          .maybeSingle();

        if (!active) return;

        if (error || !data) {
          setAccount(null);
          return;
        }

        const row = data as StationAccountRow;
        setAccount({
          uid: row.id,
          email: row.email,
          stationId: row.station_id,
          stationName: row.station_name,
          role: row.role,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      } catch {
        if (active) setAccount(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    void supabase.auth.getSession().then(({ data }) => loadAccount(data.session?.user ?? null));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadAccount(session?.user ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signOutAccount = useCallback(async () => {
    if (AUTH_BYPASS) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const isAuthenticated = useMemo(() => AUTH_BYPASS || Boolean(user && account), [account, user]);

  return {
    loading,
    user,
    account: AUTH_BYPASS ? DEV_STATION_ACCOUNT : account,
    isAuthenticated,
    signOutAccount,
  };
}
