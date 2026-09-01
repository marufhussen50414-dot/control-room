'use client';

import * as React from 'react';
import { useApp } from '@/lib/store';
import { LoginScreen } from '@/components/login-screen';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';
import { MobileSidebar } from '@/components/mobile-sidebar';
import { OwnerNameModal } from '@/components/owner-name-modal';
import { Dashboard } from '@/components/sections/dashboard';
import { OrderManagement, DisputesView } from '@/components/sections/orders';
import { PayoutFinance } from '@/components/sections/payouts';
import { Members } from '@/components/sections/members';
import { AccountSettings } from '@/components/sections/account';
import { AuditLog } from '@/components/sections/audit';
import type { SectionKey } from '@/lib/types';

export function AppShell() {
  const { currentUser } = useApp();
  const [active, setActive] = React.useState<SectionKey>('dashboard');
  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (!currentUser) return <LoginScreen />;

  const renderSection = () => {
    switch (active) {
      case 'dashboard':
        return <Dashboard />;
      case 'orders':
        return <OrderManagement />;
      case 'disputes':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Disputes &amp; Mediation
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Resolve buyer-seller conflicts with evidence review and
                verdicts.
              </p>
            </div>
            <DisputesView />
          </div>
        );
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={active} onSelect={setActive} />
      <MobileSidebar
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        active={active}
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
