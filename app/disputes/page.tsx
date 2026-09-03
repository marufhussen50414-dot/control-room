'use client';

import * as React from 'react';
import { useSection } from '@/lib/section-context';
import { DisputesReportsView } from '@/components/sections/disputes-reports';

export default function DisputesPage() {
  const { setSection } = useSection();
  React.useEffect(() => {
    setSection('disputes');
  }, [setSection]);

  return <DisputesReportsView defaultTab="disputes" />;
}
