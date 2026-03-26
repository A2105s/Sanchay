'use client';

import {
  Bell,
  CalendarClock,
  CalendarDays,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LanguageSwitcher } from '@/components/i18n/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/spaces', icon: LayoutDashboard },
  { label: 'Available Spaces', href: '/spaces/spaces', icon: Home },
  { label: 'My Bookings', href: '/spaces/bookings', icon: CalendarClock },
  { label: 'Calendar', href: '/spaces/calendar', icon: CalendarDays },
  { label: 'Notifications', href: '/spaces/notifications', icon: Bell },
  { label: 'Reports', href: '/spaces/reports', icon: FileText },
  { label: 'Settings', href: '/spaces/settings', icon: Settings },
];

export default function SpacesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isDashboard = pathname === '/spaces';
  const [openSpaceName, setOpenSpaceName] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch('/api/auth/me', { cache: 'no-store' });
        if (!response.ok) return;

        const payload = (await response.json()) as {
          authenticated?: boolean;
          session?: { openSpaceName?: string };
        };

        if (!isMounted) return;
        if (payload.authenticated && payload.session?.openSpaceName) {
          setOpenSpaceName(payload.session.openSpaceName);
        }
      } catch {
        if (isMounted) {
          setOpenSpaceName('');
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const isActiveTopNav = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="sticky top-0 z-[900] w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="container-wide">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5" data-no-translate="true">
              <Image
                src="/NationTrack.png"
                alt="NationTrack logo"
                width={36}
                height={36}
                priority
              />
              <span className="text-lg font-bold leading-tight text-foreground">NationTrack</span>
            </Link>

            <nav className="flex items-center gap-1" aria-label="Primary navigation">
              <Link
                href="/"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-semibold transition-all md:gap-2 md:px-4',
                  isActiveTopNav('/')
                    ? 'border border-primary text-foreground'
                    : 'text-muted-foreground hover:border hover:border-primary'
                )}
              >
                <Home className="h-4 w-4" aria-hidden />
                Home
              </Link>
              <Link
                href="/about"
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-semibold transition-all md:gap-2 md:px-4',
                  isActiveTopNav('/about')
                    ? 'border border-primary text-foreground'
                    : 'text-muted-foreground hover:border hover:border-primary'
                )}
              >
                <ShieldCheck className="h-4 w-4" aria-hidden />
                About
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <p
                className="hidden max-w-[18rem] truncate rounded-full border border-border/70 bg-muted/70 px-3 py-1.5 text-xs font-medium text-foreground md:block"
                aria-live="polite"
                title={openSpaceName ? `Logged in space: ${openSpaceName}` : 'Not signed in'}
              >
                {openSpaceName ? `Open Space: ${openSpaceName}` : 'Open Space: Not signed in'}
              </p>
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside
          className="group/sidebar hidden h-full w-[4.5rem] shrink-0 border-r border-border bg-muted/40 transition-[width] duration-300 md:flex md:flex-col md:focus-within:w-[14rem] md:hover:w-[14rem]"
          aria-label="Office spaces sidebar"
        >
          <ul className="flex flex-1 flex-col gap-1 px-2 pb-2 pt-2">
            {navItems.map((item) => {
              const active =
                pathname.startsWith(item.href.split('?')[0]) ||
                (pathname === '/spaces' && item.href === '/spaces');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'group flex h-10 items-center rounded-full px-2.5 text-sm font-medium text-foreground transition',
                      'justify-center group-focus-within/sidebar:justify-start group-focus-within/sidebar:gap-2 group-hover/sidebar:justify-start group-hover/sidebar:gap-2',
                      active
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted hover:text-foreground'
                    )}
                    aria-label={item.label}
                    title={item.label}
                  >
                    <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-focus-within/sidebar:w-[7.8rem] group-focus-within/sidebar:opacity-100 group-hover/sidebar:w-[7.8rem] group-hover/sidebar:opacity-100">
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>

        <main
          className={cn('min-h-0 flex-1', isDashboard ? 'overflow-hidden p-0' : 'overflow-auto')}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
