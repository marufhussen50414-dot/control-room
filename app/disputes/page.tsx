'use client';

import { AppShell } from '@/components/app-shell';
import { DisputesReportsView } from '@/components/sections/disputes-reports';

export default function DisputesPage() {
  return (
    <AppShell title="Disputes & Reports">
      <DisputesReportsView defaultTab="disputes" />
    </AppShell>
  );
}
