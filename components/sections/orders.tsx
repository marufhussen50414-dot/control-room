'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search, Download, RefreshCw, ArrowRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useRealOrders, type RealOrder } from '@/lib/use-real-orders';
import { formatBDT } from '@/lib/format';
import { cn } from '@/lib/utils';
import { getStepDef, getStatusOption, stepLabel, statusLabel, TONE_CLASSNAMES } from '@/lib/workflow';
import { toast } from 'sonner';

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers.map((h) => {
        const v = r[h];
        const s = v == null ? '' : String(v);
        return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function OrderCardSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3.5 w-1/2" />
        <div className="flex items-center justify-between border-t pt-3">
          <Skeleton className="h-4 w-14" />
          <Skeleton className="h-3.5 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function OrderCard({ order, onClick }: { order: RealOrder; onClick: () => void }) {
  const option = getStatusOption(order.workflowStatus);
  return (
    <Card
      onClick={onClick}
      className="group cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold">#{order.shortId}</span>
          {order.workflowStatus === 'step5_released' && order.workflowCompletedAt ? (
            <div className="flex shrink-0 flex-col items-end gap-0.5">
              <Badge variant="outline" className={cn('whitespace-nowrap font-medium', TONE_CLASSNAMES[option.tone])}>
                Completed
              </Badge>
              <span className="text-[10px] text-muted-foreground">
                History in {Math.max(0, Math.ceil(72 - (Date.now() - new Date(order.workflowCompletedAt).getTime()) / 3600000))}h
              </span>
            </div>
          ) : (
            <Badge variant="outline" className={cn('shrink-0 whitespace-nowrap font-medium', TONE_CLASSNAMES[option.tone])}>
              {statusLabel(order.workflowStatus, 'buyer')}
            </Badge>
          )}
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

export function OrderManagement() {
  const router = useRouter();
  const { orders, loading, loadError, refresh } = useRealOrders();
  const [query, setQuery] = React.useState('');

  const q = query.toLowerCase().trim();
  const filtered = orders.filter(
    (o) =>
      !q ||
      o.shortId.toLowerCase().includes(q) ||
      o.buyerLabel.toLowerCase().includes(q) ||
      o.sellerLabel.toLowerCase().includes(q)
  );

  // Only show the full skeleton grid on the very first load (no data yet).
  // A background refresh (loading again with data already on screen) should
  // never wipe the list — the Refresh button's own spin icon is enough there.
  const isInitialLoading = loading && orders.length === 0 && !loadError;

  const handleExport = () => {
    exportCSV(
      filtered.map((o) => ({
        OrderID: o.shortId, Buyer: o.buyerLabel, Seller: o.sellerLabel,
        Account: o.accountTitle, Amount: o.amount, Fee: o.platformFee,
        Step: stepLabel(getStepDef(o.workflowStatus).step, 'buyer'),
        Status: statusLabel(o.workflowStatus, 'buyer'),
        Created: o.createdAt,
      })),
      'orders.csv'
    );
    toast.success('Orders exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order Management Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all marketplace orders.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={refresh} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Order ID, Buyer or Seller…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {loadError && <p className="text-sm text-destructive">Failed to load orders: {loadError}</p>}

      {isInitialLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No orders found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <OrderCard key={o.id} order={o} onClick={() => router.push(`/orders/${o.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
