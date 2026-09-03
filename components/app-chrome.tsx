'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { useSection } from '@/lib/section-context';
import { LoginScreen } from '@/components/login-screen';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { OwnerNameModal } from '@/components/owner-name-modal';
import type { SectionKey } from '@/lib/types';

/**
 * Renders once at the root layout and stays mounted for every route —
 * the dashboard's own section tabs (`/`), and the standalone
 * disputes/reports list + detail pages, all live inside it as
 * `children`. Keeping the sidebar/topbar here (instead of each page
 * re-creating its own copy) is what stops navigation between them from
 * flashing/remounting the chrome.
 */
export function AppChrome({ children }: { children: React.ReactNode }) {
  const { currentUser } = useApp();
  const { section, setSection } = useSection();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!currentUser) return <LoginScreen />;

  const isDisputesArea =
    pathname === '/disputes' ||
    pathname.startsWith('/disputes/') ||
    pathname === '/reports' ||
    pathname.startsWith('/reports/');

  const handleSelect = (key: SectionKey) => {
    setSection(key);
    if (pathname !== '/' && !(isDisputesArea && key === 'disputes')) {
      router.push('/');
    }
  };

  // Sidebar highlight: on the dashboard shell it follows the local
  // section state; on the disputes/reports routes it's always
  // "disputes" (those pages set this via useSection on mount).
  const sidebarActive: SectionKey | null =
    pathname === '/' || isDisputesArea ? section : null;

  const titleOverride =
    pathname.startsWith('/disputes/') && pathname !== '/disputes'
      ? 'Dispute Details'
      : pathname.startsWith('/reports/') && pathname !== '/reports'
        ? 'Report Details'
        : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={sidebarActive} onSelect={handleSelect} />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        active={sidebarActive}
        onSelect={handleSelect}
      />
      <div className="lg:pl-64">
        <Topbar
          active={section}
          titleOverride={titleOverride}
          onSelect={handleSelect}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
      <OwnerNameModal />
    </div>
  );
}
