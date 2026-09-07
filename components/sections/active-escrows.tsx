'use client';

import * as React from 'react';
import {
  Lock,
  Unlock,
  Clock,
  Plus,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useApp } from '@/lib/store';
import { formatBDT, timeRemaining } from '@/lib/format';
import { toast } from 'sonner';

export function ActiveEscrows() {
  const { db, releaseEscrow, extendEscrow } = useApp();
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const escrowOrders = db.orders.filter((o) => o.escrowLocked);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Active Escrows
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage all active escrow holdings. Release funds or extend deadlines.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {escrowOrders.map((o) => (
          <Card key={o.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <span className="font-semibold">#{o.id}</span>
                </div>
                <OrderStatusBadge status={o.status} />
              </div>
              <div>
                <p className="truncate text-sm text-muted-foreground">
                  {o.accountTitle}
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {formatBDT(o.amount)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Platform fee: {formatBDT(o.platformFee)}
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium tabular-nums">
                  {timeRemaining(o.escrowDeadline)}
                </span>
                <span className="text-xs text-muted-foreground">
                  remaining
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    releaseEscrow(o.id);
                    toast.success(`Escrow released for #${o.id}`);
                  }}
                >
                  <Unlock className="mr-1.5 h-3.5 w-3.5" />
                  Release
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    extendEscrow(o.id, 6);
                    toast.success(`Escrow extended by 6h for #${o.id}`);
                  }}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Extend 6h
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {escrowOrders.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <CardContent className="py-10 text-center text-muted-foreground">
              No active escrows.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
