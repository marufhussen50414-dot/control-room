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

const FALLBACK = { label: 'Unknown', className: 'bg-muted text-muted-foreground' };

export function RealOrderStatusBadge({
  status,
  workflowStatus,
  workflowCompletedAt,
}: {
  status: MainSiteOrderStatus | string | null | undefined;
  workflowStatus?: string | null;
  workflowCompletedAt?: string | null;
}) {
  if (workflowStatus === 'step5_released') {
    const hoursLeft = workflowCompletedAt
      ? Math.max(0, Math.ceil(72 - (Date.now() - new Date(workflowCompletedAt).getTime()) / 3600000))
      : null;
    return (
      <div className="flex flex-col items-start gap-0.5">
        <Badge variant="outline" className={cn('font-medium', MAP.completed.className)}>
          Completed
        </Badge>
        {hoursLeft !== null && (
          <span className="text-[10px] text-muted-foreground">History in {hoursLeft}h</span>
        )}
      </div>
    );
  }
  const normalized = String(status ?? '').toLowerCase() as MainSiteOrderStatus;
  const cfg = MAP[normalized] ?? FALLBACK;
  return (
    <Badge variant="outline" className={cn('font-medium', cfg.className)}>
      {cfg.label}
    </Badge>
  );
}
