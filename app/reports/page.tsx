'use client';

import { AppShell } from '@/components/app-shell';
import { DisputesReportsView } from '@/components/sections/disputes-reports';

export default function ReportsPage() {
  return (
    <AppShell title="Disputes & Reports">
      <DisputesReportsView defaultTab="reports" />
    </AppShell>
  );
}
