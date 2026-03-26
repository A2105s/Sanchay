'use client';

import { ChevronLeft, Search } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';

import { SpaceShowcaseCard } from '@/components/spaces/SpaceShowcaseCard';
import { useSpaceAccountVerification } from '@/hooks/use-space-account-verification';
import { cn } from '@/lib/utils';
import type { Space } from '@/types/spaces';

const SpacesMapView = dynamic(
  () => import('@/components/spaces/SpacesMapView').then((mod) => mod.SpacesMapView),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-lg">Loading map...</div>
      </div>
    ),
  }
);

interface SpacesPayload {
  success: boolean;
  data: Space[];
}

export default function SpacesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const { isVerifiedSpace } = useSpaceAccountVerification();

  useEffect(() => {
    const load = async () => {
      const response = await fetch('/api/spaces', { cache: 'no-store' });
      const payload = (await response.json()) as SpacesPayload;
      if (!payload.success) return;
      setSpaces(payload.data);
    };

    load();
  }, []);

  useEffect(() => {
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const filteredSpaces = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return spaces.filter((space) => {
      if (!normalizedQuery) return true;

      return (
        space.name.toLowerCase().includes(normalizedQuery) ||
        space.department.toLowerCase().includes(normalizedQuery) ||
        space.address.toLowerCase().includes(normalizedQuery) ||
        space.assetId.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [searchQuery, spaces]);

  useEffect(() => {
    if (!filteredSpaces.length) {
      setSelectedSpaceId(null);
      return;
    }

    if (!selectedSpaceId || !filteredSpaces.some((space) => space.id === selectedSpaceId)) {
      setSelectedSpaceId(filteredSpaces[0].id);
    }
  }, [filteredSpaces, selectedSpaceId]);

  const selectedSpace = filteredSpaces.find((space) => space.id === selectedSpaceId) ?? null;

  const toggleFullscreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    const mapContainer = document.querySelector('.nt-map-canvas')?.parentElement;
    if (mapContainer) {
      await mapContainer.requestFullscreen();
    } else {
      await document.documentElement.requestFullscreen();
    }
  };

  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
      <div className="flex h-full min-h-0 flex-1">
        <div className="pointer-events-none absolute left-3 top-3 z-[640] md:left-6">
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="relative min-w-[220px] shrink-0 md:min-w-[280px]">
              <span className="pointer-events-none absolute left-2.5 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                <Search className="h-3.5 w-3.5" aria-hidden />
              </span>
              <input
                type="text"
                placeholder="Search spaces"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 w-full rounded-full border border-border/90 bg-card/95 pl-9 pr-3.5 text-sm text-foreground shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                aria-label="Search government spaces"
              />
            </div>
          </div>
        </div>

        <div className="h-full min-w-0 flex-1 border-l border-r border-border">
          <SpacesMapView
            spaces={filteredSpaces}
            selectedSpaceId={selectedSpaceId}
            onSpaceSelect={(space) => setSelectedSpaceId(space.id)}
            showInternalFilters={false}
            onFullscreenToggle={toggleFullscreen}
            isFullscreen={isFullscreen}
          />
        </div>

        <aside
          id="spaces-right-panel"
          className={cn(
            'group/rightpanel absolute right-0 top-0 z-[700] h-full w-[300px] translate-x-[calc(100%-1.25rem)] bg-transparent shadow-none backdrop-blur-0 transition-transform duration-300 ease-in-out focus-within:translate-x-0 hover:translate-x-0 md:w-[320px] md:translate-x-[calc(100%-1.5rem)]'
          )}
          aria-label="Available government spaces"
        >
          <div
            className="absolute left-0 top-1/2 z-[715] flex h-14 w-5 -translate-x-full -translate-y-1/2 items-center justify-center rounded-l-xl border border-border/80 bg-card/95 shadow-sm backdrop-blur transition group-focus-within/rightpanel:bg-muted group-hover/rightpanel:bg-muted"
            aria-hidden="true"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-foreground" aria-hidden />
          </div>

          <div className="h-full overflow-y-auto bg-transparent px-2.5 py-2.5 [scrollbar-color:rgba(148,163,184,0.65)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5">
            {filteredSpaces.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                No spaces matched your search or filter.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredSpaces.map((space) => {
                  const isSelected = selectedSpace?.id === space.id;

                  return (
                    <SpaceShowcaseCard
                      key={space.id}
                      space={space}
                      compact
                      selected={isSelected}
                      verified={isVerifiedSpace(space)}
                      onSelect={setSelectedSpaceId}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
