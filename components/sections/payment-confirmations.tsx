'use client';

import * as React from 'react';
import { BadgeCheck, Clock, CheckCircle2, Copy, ArrowRight, Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatBDT } from '@/lib/format';
import { toast } from 'sonner';

type Confirmation = {
  id: string;
  order_id: string;
  buyer_id: string;
  method: string;
  amount: number;
  submitted_tnx_id: string;
  admin_tnx_id: string | null;
  status: 'pending' | 'confirmed';
  created_at: string;
  confirmed_at: string | null;
  order: {
    id: string;
    order_number: string;
    status: string;
    workflow_status: string | null;
    game_listings?: { title: string } | null;
  } | null;
  buyer: {
    profile_id: string;
    full_name: string;
    username: string | null;
    phone: string | null;
    email: string;
  } | null;
};

function useConfirmations() {
  const [items, setItems] = React.useState<Confirmation[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payment-confirmations');
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { refresh(); }, [refresh]);

  const confirm = React.useCallback(async (id: string, adminTnxId: string) => {
    const res = await fetch('/api/payment-confirmations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, adminTnxId }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, message: data.error ?? 'Failed to confirm' };
    await refresh();
    return { ok: true, message: '' };
  }, [refresh]);

  return { items, loading, refresh, confirm };
}

export function PaymentSettingsCard() {
  const [bkash, setBkash] = React.useState('');
  const [nagad, setNagad] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const res = await fetch('/api/payment-settings');
      const data = await res.json();
      setBkash(data?.bkash_number ?? '');
      setNagad(data?.nagad_number ?? '');
      setLoading(false);
    })();
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/payment-settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bkash_number: bkash, nagad_number: nagad }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('Failed to save'); return; }
    toast.success('Payment numbers updated — shown to buyers on checkout');
  }

  if (loading) return null;

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div>
          <h3 className="text-sm font-semibold">Buyer payment numbers</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Shown to buyers on checkout as the number to send money to.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">bKash Number</p>
            <Input value={bkash} onChange={(e) => setBkash(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Nagad Number</p>
            <Input value={nagad} onChange={(e) => setNagad(e.target.value)} placeholder="01XXXXXXXXX" />
          </div>
        </div>
        <Button size="sm" onClick={save} disabled={saving}>Save</Button>
      </CardContent>
    </Card>
  );
}

export function PaymentConfirmations() {
  const { items, loading, confirm } = useConfirmations();
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [adminTnx, setAdminTnx] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const pending = items.filter((i) => i.status === 'pending');
  const confirmed = items.filter((i) => i.status === 'confirmed');
  const selected = items.find((i) => i.id === selectedId) ?? pending[0] ?? null;

  React.useEffect(() => {
    if (!selectedId && pending.length > 0) setSelectedId(pending[0].id);
  }, [selectedId, pending]);

  React.useEffect(() => {
    setAdminTnx('');
  }, [selected?.id]);

  const isInitialLoading = loading && items.length === 0;
  const match = selected && adminTnx.trim().length > 0 && adminTnx.trim() === selected.submitted_tnx_id.trim();

  async function handleConfirm() {
    if (!selected || !adminTnx.trim()) return;
    setSubmitting(true);
    const res = await confirm(selected.id, adminTnx.trim());
    setSubmitting(false);
    if (!res.ok) { toast.error(res.message); return; }
    toast.success('Payment confirmed — order moved to escrow');
    setSelectedId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Payment Confirmation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Buyers submit their transaction ID here after sending payment. Verify it against your own bKash/Nagad
          statement, then confirm to move the order into escrow.
        </p>
      </div>

      <PaymentSettingsCard />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pending ({pending.length})
          </p>
          {isInitialLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-16 w-full" /></CardContent></Card>
              ))}
            </div>
          ) : pending.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No pending submissions.</CardContent></Card>
          ) : (
            pending.map((c) => (
              <Card
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={cn(
                  'cursor-pointer transition-all hover:border-primary/40',
                  selected?.id === c.id && 'border-primary shadow-sm ring-1 ring-primary/20'
                )}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">#{c.order?.order_number ?? '—'}</span>
                    <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30">
                      <Clock className="mr-1 h-3 w-3" /> Pending
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{c.order?.game_listings?.title ?? 'Listing'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.buyer?.full_name ?? 'Unknown'}</span>
                    <span className="font-semibold">{formatBDT(c.amount)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          {confirmed.length > 0 && (
            <>
              <p className="pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Recently confirmed ({confirmed.length})
              </p>
              {confirmed.slice(0, 5).map((c) => (
                <Card key={c.id} className="opacity-70">
                  <CardContent className="flex items-center justify-between gap-2 p-4">
                    <div className="min-w-0">
                      <span className="font-semibold">#{c.order?.order_number ?? '—'}</span>
                      <p className="truncate text-xs text-muted-foreground">{c.buyer?.full_name}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
                      <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmed
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        <div>
          {!selected ? (
            <Card className="h-full">
              <CardContent className="flex h-full min-h-[300px] items-center justify-center py-10 text-center text-muted-foreground">
                Select a submission to review its details.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">Order #{selected.order?.order_number ?? '—'}</h2>
                    <p className="text-sm text-muted-foreground">{selected.order?.game_listings?.title ?? 'Listing'}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      selected.status === 'confirmed'
                        ? 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-600 border-amber-500/30'
                    )}
                  >
                    {selected.status === 'confirmed' ? 'Confirmed' : 'Pending Review'}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1 rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Buyer</p>
                    <p className="text-sm font-medium">{selected.buyer?.full_name ?? 'Unknown'}</p>
                    <p className="font-mono text-xs text-muted-foreground">{selected.buyer?.profile_id ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{selected.buyer?.email ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{selected.buyer?.phone ?? '—'}</p>
                  </div>
                  <div className="space-y-1 rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
                    <p className="text-sm font-medium capitalize">{selected.method}</p>
                    <p className="text-sm font-semibold">{formatBDT(selected.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {new Date(selected.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                    Transaction ID submitted by buyer
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-lg font-bold">{selected.submitted_tnx_id}</span>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(selected.submitted_tnx_id); toast.success('Copied'); }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </button>
                  </div>
                </div>

                {selected.status === 'pending' ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Check this transaction ID against your own {selected.method} statement. If it matches, type it
                      below to confirm.
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={adminTnx}
                        onChange={(e) => setAdminTnx(e.target.value)}
                        placeholder="Type the transaction ID to confirm"
                        className="font-mono"
                      />
                      {match && <Check className="h-5 w-5 shrink-0 text-emerald-500" />}
                    </div>
                    <Button onClick={handleConfirm} disabled={!adminTnx.trim() || submitting} className="w-full sm:w-auto">
                      <BadgeCheck className="mr-2 h-4 w-4" /> Confirm Payment
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    Confirmed with transaction ID <span className="font-mono font-semibold">{selected.admin_tnx_id}</span> on{' '}
                    {selected.confirmed_at ? new Date(selected.confirmed_at).toLocaleString() : ''}.
                  </div>
                )}

                {selected.order && (
                  <a
                    href={`/orders/${selected.order.id}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    View full order <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
