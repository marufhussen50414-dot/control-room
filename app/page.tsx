'use client';

import { useSection } from '@/lib/section-context';
import { Dashboard } from '@/components/sections/dashboard';
import { OrderManagement } from '@/components/sections/orders';
import { ActiveEscrows } from '@/components/sections/active-escrows';
import { DisputesReportsView } from '@/components/sections/disputes-reports';
import { PayoutFinance } from '@/components/sections/payouts';
import { Members } from '@/components/sections/members';
import { AccountSettings } from '@/components/sections/account';
import { AuditLog } from '@/components/sections/audit';

export default function Home() {
  const { section } = useSection();

  switch (section) {
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
}
