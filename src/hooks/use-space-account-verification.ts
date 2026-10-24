'use client';

import { useEffect, useMemo, useState } from 'react';

import { fetchRows, subscribeToTable } from '@/lib/supabase-query';
import { isSupabaseConfigured } from '@/utils/supabase/client';
import type { Space } from '@/types/spaces';

interface SpaceUserRecord {
  openSpaceId?: string;
  openSpaceName?: string;
}

const normalize = (value: string) => value.trim().toLowerCase();

export function useSpaceAccountVerification() {
  const [verifiedSpaceIds, setVerifiedSpaceIds] = useState<Set<string>>(new Set());
  const [verifiedSpaceNames, setVerifiedSpaceNames] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Without Supabase config the query throws and takes the whole /spaces page down.
    if (!isSupabaseConfigured) return;

    let active = true;

    const load = async () => {
      try {
        const rows = await fetchRows<SpaceUserRecord>('space_users', {
          select: 'open_space_id, open_space_name',
        });

        if (!active) return;

        const nextIds = new Set<string>();
        const nextNames = new Set<string>();

        for (const row of rows) {
          const id = row.openSpaceId?.trim();
          const name = row.openSpaceName?.trim();

          if (id) {
            nextIds.add(id);
          }

          if (name) {
            nextNames.add(normalize(name));
          }
        }

        setVerifiedSpaceIds(nextIds);
        setVerifiedSpaceNames(nextNames);
      } catch {
        if (!active) return;
        setVerifiedSpaceIds(new Set());
        setVerifiedSpaceNames(new Set());
      }
    };

    void load();
    const unsubscribe = subscribeToTable('space_users', () => void load());

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isVerifiedSpace = useMemo(() => {
    return (space: Space) => {
      if (verifiedSpaceIds.has(space.id)) {
        return true;
      }

      return verifiedSpaceNames.has(normalize(space.name));
    };
  }, [verifiedSpaceIds, verifiedSpaceNames]);

  return {
    isVerifiedSpace,
  };
}
