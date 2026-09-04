'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import { LoginScreen } from '@/components/login-screen';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { OwnerNameModal } from '@/components/owner-name-modal';
import { Dashboard } from '@/components/sections/dashboard';
import { OrderManagement } from '@/components/sections/orders';
import { DisputesReportsView } from '@/components/sections/disputes-reports';
import { PayoutFinance } from '@/components/sections/payouts';
import { Members } from '@/components/sections/members';
import { AccountSettings } from '@/components/sections/account';
import { AuditLog } from '@/components/sections/audit';
import { ActiveEscrows } from '@/components/sections/active-escrows';
import type { SectionKey } from '@/lib/types';

// Used to hand off "go to this section" across a real page navigation —
// e.g. clicking "Member Management" while viewing a standalone dispute
// detail page (/disputes/123) has to leave that route entirely before a
// section can be shown, since that route only ever renders its own
// content regardless of sidebar state.
const PENDING_SECTION_KEY = 'gamehaatbd_pending_section';

export function AppShell({
  children,
  title,
}: {
  children?: React.ReactNode;
  title?: string;
}) {
  const { currentUser } = useApp();
  const router = useRouter();
  const [active, setActive] = React.useState<SectionKey>('dashboard');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = sessionStorage.getItem(PENDING_SECTION_KEY);
    if (pending) {
      sessionStorage.removeItem(PENDING_SECTION_KEY);
      setActive(pending as SectionKey);
    }
  }, []);

  if (!currentUser) return <LoginScreen />;

  const handleSelect = (key: SectionKey) => {
    if (children) {
      // We're on a standalone detail route (e.g. /disputes/123) — this
      // page only ever renders `children`, so switching sections has to
      // navigate back to the dashboard shell first.
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(PENDING_SECTION_KEY, key);
      }
      router.push('/');
      return;
    }
    setActive(key);
  };

  const renderSection = () => {
    if (children) {
      return children;
    }

    switch (active) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrderManagement />;
      case 'activeEscrows':
        return <ActiveEscrows />;
      case 'disputes':
        return <DisputesReportsView />;
      case 'payouts':
        return <PayoutFinance />;
      // case 'finance':  // 🔥 এই লাইন ডিলিট করুন
      //   return <PayoutFinance />;
      case 'members':
        return <Members />;
      case 'account':
        return <AccountSettings />;
      case 'audit':
        return <AuditLog />;
      default:
        return <Dashboard />;
    }
  };

  // On a standalone detail route, nothing in the sidebar is "active".
  const sidebarActive = children ? null : active;

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
          active={active}
          titleOverride={title}
          onSelect={handleSelect}
          onOpenMobile={() => setMobileOpen(true)}
        />
        <main className="p-4 lg:p-6">
          <div className="mx-auto max-w-7xl">{renderSection()}</div>
        </main>
      </div>
      <OwnerNameModal />
    </div>
  );
}
