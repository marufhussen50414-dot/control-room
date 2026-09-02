'use client';

import * as React from 'react';
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

export function AppShell({ children }: { children?: React.ReactNode }) {
  const { currentUser } = useApp();
  const [active, setActive] = React.useState<SectionKey>('dashboard');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!currentUser) return <LoginScreen />;

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
      case 'finance':
        return <PayoutFinance />;
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

  // 🔥 ডিটেইল পেজে active স্টেট null করা হচ্ছে
  const sidebarActive = children ? null : active;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={sidebarActive} onSelect={setActive} />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        active={sidebarActive}
        onSelect={setActive}
      />
      <div className="lg:pl-64">
        <Topbar
          active={active}
          onSelect={setActive}
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
