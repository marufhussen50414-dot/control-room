'use client';

import * as React from 'react';
import { mainSiteSupabase } from '@/lib/main-site-supabase';
import type { MainSiteOrder, MainSiteOrderStatus } from '@/lib/main-site-types';

export type RealOrder = {
  id: string;
  shortId: string;
  buyerLabel: string;
  sellerLabel: string;
  accountTitle: string;
  amount: number;
  platformFee: number;
  status: MainSiteOrderStatus;
  escrowLocked: boolean;
  escrowDeadline: string | null;
  createdAt: string;
};

function toShortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function mapOrder(o: MainSiteOrder): RealOrder {
  return {
    id: o.id,
    shortId: toShortId(o.id),
    buyerLabel: o.buyer?.full_name || o.buyer?.username || o.buyer_id.slice(0, 8),
    sellerLabel: o.seller?.full_name || o.seller?.username || o.seller_id.slice(0, 8),
    accountTitle: o.game_listings?.title ?? 'Listing',
    amount: o.price,
    platformFee: o.commission_amount,
    status: o.status,
    escrowLocked:
      !o.escrow_released && ['paid', 'delivering', 'disputed'].includes(o.status),
    escrowDeadline: o.buyer_confirm_deadline,
    createdAt: o.created_at,
  };
}

/**
 * Shared by Order Management and Active Escrows: connection state plus
 * the real orders list and the actions that write back to the main
 * site's database. Both pages just read `orders` and call these
 * actions — neither talks to Supabase directly.
 */
export function useRealOrders() {
  const [connected, setConnected] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [adminEmail, setAdminEmail] = React.useState('');
  const [orders, setOrders] = React.useState<RealOrder[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    const { data, error } = await mainSiteSupabase
      .from('orders')
      .select(
        '*, buyer:buyer_id(username, full_name), seller:seller_id(username, full_name), game_listings(title, game_name)'
      )
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      setLoadError(error.message);
      return;
    }
    setOrders(((data as unknown as MainSiteOrder[]) ?? []).map(mapOrder));
  }, []);

  React.useEffect(() => {
    mainSiteSupabase.auth.getUser().then(({ data }) => {
      setConnected(!!data.user);
      setAdminEmail(data.user?.email ?? '');
      setChecking(false);
    });
    const { data: sub } = mainSiteSupabase.auth.onAuthStateChange(
      (_event, session) => {
        setConnected(!!session?.user);
        setAdminEmail(session?.user?.email ?? '');
        setChecking(false);
      }
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  React.useEffect(() => {
    if (connected) load();
  }, [connected, load]);

  const updateStatus = React.useCallback(
    async (id: string, status: MainSiteOrderStatus) => {
      const patch: Record<string, unknown> = { status };
      if (status === 'completed') patch.escrow_released = true;
      const { error } = await mainSiteSupabase
        .from('orders')
        .update(patch)
        .eq('id', id);
      if (error) return { ok: false as const, message: error.message };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id
            ? {
                ...o,
                status,
                escrowLocked:
                  status === 'completed'
                    ? false
                    : ['paid', 'delivering', 'disputed'].includes(status),
              }
            : o
        )
      );
      return { ok: true as const };
    },
    []
  );

  const releaseEscrow = React.useCallback(async (id: string) => {
    const { error } = await mainSiteSupabase
      .from('orders')
      .update({
        status: 'completed',
        escrow_released: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) return { ok: false as const, message: error.message };
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id ? { ...o, status: 'completed', escrowLocked: false } : o
      )
    );
    return { ok: true as const };
  }, []);

  const extendEscrow = React.useCallback(
    async (id: string, hours: number) => {
      const order = orders.find((o) => o.id === id);
      const base = order?.escrowDeadline
        ? new Date(order.escrowDeadline).getTime()
        : Date.now();
      const newDeadline = new Date(base + hours * 3600000).toISOString();
      const { error } = await mainSiteSupabase
        .from('orders')
        .update({ buyer_confirm_deadline: newDeadline })
        .eq('id', id);
      if (error) return { ok: false as const, message: error.message };
      setOrders((prev) =>
        prev.map((o) =>
          o.id === id ? { ...o, escrowDeadline: newDeadline } : o
        )
      );
      return { ok: true as const };
    },
    [orders]
  );

  const disconnect = React.useCallback(async () => {
    await mainSiteSupabase.auth.signOut();
    setConnected(false);
    setOrders([]);
  }, []);

  return {
    connected,
    checking,
    adminEmail,
    orders,
    loading,
    loadError,
    refresh: load,
    updateStatus,
    releaseEscrow,
    extendEscrow,
    disconnect,
  };
}
