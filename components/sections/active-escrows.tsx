'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useRealOrders, type RealOrder } from '@/lib/use-real-orders';
import { formatBDT } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getStepDef, getStatusOption, stepLabel, statusLabel, TONE_CLASSNAMES } from '@/lib/workflow';

// An order is "in escrow" once payment has been confirmed and until the
// money is either released to the seller or the order is closed out
// (cancelled/refunded/disputed-resolved). This list is read-only — every
// control (release, extend, dispute) lives on the order's own detail page,
// reached by clicking a card.
function isInEscrow(o: RealOrder) {
  if (o.status !== 'paid' && o.status !== 'delivering') return false;
  return o.workflowStatus !== 'step5_released';
}

function EscrowCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
      </CardContent>
    </Card>
  );
}

function EscrowCard({ order, onClick }: { order: RealOrder; onClick: () => void }) {
  const option = getStatusOption(order.workflowStatus);
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-semibold">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" /> #{order.shortId}
          </span>
          <Badge variant="outline" className={cn('shrink-0 whitespace-nowrap font-medium', TONE_CLASSNAMES[option.tone])}>
            {statusLabel(order.workflowStatus, 'buyer')}
          </Badge>
        </div>

        <p className="truncate text-sm font-medium" title={order.accountTitle}>{order.accountTitle}</p>

        <div className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <span className="truncate">{order.buyerLabel}</span>
          <ArrowRight className="h-3 w-3 shrink-0" />
          <span className="truncate">{order.sellerLabel}</span>
        </div>

        <div className="flex items-end justify-between border-t pt-3">
          <div>
            <p className="font-semibold leading-none">{formatBDT(order.amount)}</p>
            <p className="mt-1 text-xs text-muted-foreground">Fee {formatBDT(order.platformFee)}</p>
          </div>
          <p className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
            {stepLabel(getStepDef(order.workflowStatus).step, 'buyer')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ActiveEscrows() {
  const router = useRouter();
  const { orders, loading } = useRealOrders();

  const escrowOrders = orders.filter(isInEscrow);
  const isInitialLoading = loading && orders.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Active Escrows</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every order currently holding funds in escrow. Tap a card to open the full order and manage it there.
        </p>
      </div>

      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <EscrowCardSkeleton key={i} />)}
        </div>
      ) : escrowOrders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No orders currently in escrow.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {escrowOrders.map((o) => (
            <EscrowCard key={o.id} order={o} onClick={() => router.push(`/orders/${o.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
