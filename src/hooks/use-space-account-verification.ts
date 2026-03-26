'use client';

import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/lib/firebase';
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
    const unsubscribe = onSnapshot(collection(db, 'space_users'), (snapshot) => {
      const nextIds = new Set<string>();
      const nextNames = new Set<string>();

      for (const doc of snapshot.docs) {
        const data = doc.data() as SpaceUserRecord;
        const id = data.openSpaceId?.trim();
        const name = data.openSpaceName?.trim();

        if (id) {
          nextIds.add(id);
        }

        if (name) {
          nextNames.add(normalize(name));
        }
      }

      setVerifiedSpaceIds(nextIds);
      setVerifiedSpaceNames(nextNames);
    });

    return () => unsubscribe();
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
