'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MainSiteOrderStatus } from '@/lib/main-site-types';

const MAP: Record<MainSiteOrderStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  },
  paid: {
    label: 'Paid',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  },
  delivering: {
    label: 'Delivering',
    className:
      'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  },
  completed: {
    label: 'Completed',
    className:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-muted text-muted-foreground',
  },
  disputed: {
    label: 'Disputed',
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  },
  refunded: {
    label: 'Refunded',
    className:
      'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  },
};

export function RealOrderStatusBadge({ status }: { status: MainSiteOrderStatus }) {
  const cfg = MAP[status];
  return (
    <Badge variant="outline" className={cn('font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}
