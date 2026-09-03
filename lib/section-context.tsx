'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import type { SectionKey } from '@/lib/types';

type SectionContextType = {
  section: SectionKey;
  setSection: (key: SectionKey) => void;
};

const SectionContext = React.createContext<SectionContextType | null>(null);

function initialSectionForPath(pathname: string | null): SectionKey {
  if (pathname && (pathname.startsWith('/disputes') || pathname.startsWith('/reports'))) {
    return 'disputes';
  }
  return 'dashboard';
}

export function SectionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [section, setSection] = React.useState<SectionKey>(() =>
    initialSectionForPath(pathname)
  );
  const value = React.useMemo(() => ({ section, setSection }), [section]);
  return (
    <SectionContext.Provider value={value}>{children}</SectionContext.Provider>
  );
}

export function useSection() {
  const ctx = React.useContext(SectionContext);
  if (!ctx) throw new Error('useSection must be used within SectionProvider');
  return ctx;
}
