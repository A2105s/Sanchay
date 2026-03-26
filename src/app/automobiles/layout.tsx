'use client';

import { X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { useAutomobilesAuth } from '@/hooks/use-automobiles-auth';
import { cn } from '@/lib/utils';

export default function AutomobilesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, isAuthenticated, account, signOutAccount } = useAutomobilesAuth();

  const isAuthPage = pathname.startsWith('/automobiles/auth');

  useEffect(() => {
    if (isAuthPage) return;
    if (!loading && !isAuthenticated) {
      router.replace('/automobiles/auth');
    }
  }, [isAuthPage, isAuthenticated, loading, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-[calc(100dvh-4rem)] items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading station account...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const isDashboard = pathname === '/automobiles';

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden bg-background">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/95 px-3 backdrop-blur md:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{account?.stationName}</p>
            <p className="text-xs text-muted-foreground">Automobiles Dashboard</p>
          </div>

          <button
            type="button"
            onClick={() => {
              void signOutAccount().then(() => router.replace('/automobiles/auth'));
            }}
            className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Log out"
          >
            <X className="h-4 w-4" aria-hidden />
            Logout
          </button>
        </header>

        <main
          id="maincontent"
          className={cn(
            'min-h-0 flex-1',
            isDashboard ? 'overflow-hidden' : 'overflow-auto p-4 md:p-6'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
