'use client';

import * as React from 'react';
import { Lock, Unlock, Clock, Plus, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RealOrderStatusBadge } from '@/components/real-order-status-badge';
import { ConnectLiveSitePrompt } from '@/components/connect-live-site-prompt';
import { useRealOrders } from '@/lib/use-real-orders';
import { formatBDT, timeRemaining } from '@/lib/format';
import { toast } from 'sonner';

export function ActiveEscrows() {
  const { connected, checking, orders, loading, refresh, releaseEscrow, extendEscrow } =
    useRealOrders();
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const escrowOrders = orders.filter((o) => o.escrowLocked);

  const handleRelease = async (id: string, shortId: string) => {
    const res = await releaseEscrow(id);
    if (res.ok) toast.success(`Escrow released for #${shortId}`);
    else toast.error(`Failed: ${res.message}`);
  };

  const handleExtend = async (id: string, shortId: string) => {
    const res = await extendEscrow(id, 6);
    if (res.ok) toast.success(`Escrow extended by 6h for #${shortId}`);
    else toast.error(`Failed: ${res.message}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Active Escrows
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Live escrow holdings from the GameHaatBD marketplace. Release
            funds or extend deadlines.
          </p>
        </div>
        {connected && (
          <Button variant="outline" size="icon" onClick={refresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {checking ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Checking connection…
        </p>
      ) : !connected ? (
        <ConnectLiveSitePrompt />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {escrowOrders.map((o) => (
            <Card key={o.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" />
                    <span className="font-mono text-sm font-semibold">
                      #{o.shortId}
                    </span>
                  </div>
                  <RealOrderStatusBadge status={o.status} />
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
                    {o.escrowDeadline
                      ? timeRemaining(o.escrowDeadline)
                      : 'No deadline set'}
                  </span>
                  {o.escrowDeadline && (
                    <span className="text-xs text-muted-foreground">
                      remaining
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleRelease(o.id, o.shortId)}>
                    <Unlock className="mr-1.5 h-3.5 w-3.5" />
                    Release
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleExtend(o.id, o.shortId)}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Extend 6h
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {!loading && escrowOrders.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                No active escrows.
              </CardContent>
            </Card>
          )}
          {loading && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-10 text-center text-muted-foreground">
                Loading live escrows…
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
