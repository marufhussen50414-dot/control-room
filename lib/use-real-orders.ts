'use client';

import * as React from 'react';
import type { MainSiteOrder, MainSiteOrderStatus } from '@/lib/main-site-types';
import { normalizeWorkflowStatus, type WorkflowStatus } from '@/lib/workflow';

export type RealOrder = {
  id: string;
  shortId: string;
  buyerLabel: string;
  sellerLabel: string;
  accountTitle: string;
  amount: number;
  platformFee: number;
  status: MainSiteOrderStatus;
  workflowStatus: WorkflowStatus;
  escrowLocked: boolean;
  escrowDeadline: string | null;
  createdAt: string;
  // নিচের ফিল্ডগুলো শুধু detail পেজে ব্যবহার হয়, টেবিলে না
  buyerId: string;
  sellerId: string;
  buyerEmail: string;
  sellerEmail: string;
  buyerPhone: string | null;
  sellerPhone: string | null;
  buyerWhatsapp: string | null;
  sellerWhatsapp: string | null;
  gameName: string | null;
  sellerAmount: number;
  commissionRate: number;
  paymentMethod: string;
  paymentNumber: string | null;
  deliveryPassword: string | null;
  deliveryVideoUrl: string | null;
  deliveredAt: string | null;
  buyerVideoUrl: string | null;
  disputeReason: string | null;
  disputeOpenedAt: string | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  updatedAt: string;
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
    workflowStatus: normalizeWorkflowStatus(o.workflow_status),
    escrowLocked: !o.escrow_released && ['paid', 'delivering', 'disputed'].includes(o.status),
    escrowDeadline: o.buyer_confirm_deadline,
    createdAt: o.created_at,
    buyerId: o.buyer_id,
    sellerId: o.seller_id,
    buyerEmail: o.buyer?.email ?? '',
    sellerEmail: o.seller?.email ?? '',
    buyerPhone: o.buyer?.phone ?? null,
    sellerPhone: o.seller?.phone ?? null,
    buyerWhatsapp: o.buyer?.whatsapp ?? null,
    sellerWhatsapp: o.seller?.whatsapp ?? null,
    gameName: o.game_listings?.game_name ?? null,
    sellerAmount: o.seller_amount,
    commissionRate: o.commission_rate,
    paymentMethod: o.payment_method,
    paymentNumber: o.payment_number,
    deliveryPassword: o.delivery_password,
    deliveryVideoUrl: o.delivery_video_url,
    deliveredAt: o.delivered_at,
    buyerVideoUrl: o.buyer_video_url,
    disputeReason: o.dispute_reason,
    disputeOpenedAt: o.dispute_opened_at,
    adminNotes: o.admin_notes,
    resolvedAt: o.resolved_at,
    updatedAt: o.updated_at,
  };
}

export function useRealOrders() {
  const [orders, setOrders] = React.useState<RealOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        setLoadError(json.error ?? 'Failed to load orders');
      } else {
        setOrders(((json as MainSiteOrder[]) ?? []).map(mapOrder));
      }
    } catch (err: any) {
      setLoadError(err.message ?? 'Failed to load orders');
    }
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const patchOrder = React.useCallback(async (id: string, patch: Record<string, unknown>) => {
    const res = await fetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, patch }),
    });
    const json = await res.json();
    if (!res.ok) return { ok: false as const, message: json.error ?? 'Update failed' };
    return { ok: true as const };
  }, []);

  const updateStatus = React.useCallback(
    async (id: string, status: MainSiteOrderStatus) => {
      const patch: Record<string, unknown> = { status };
      if (status === 'completed') patch.escrow_released = true;
      const res = await patchOrder(id, patch);
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? {
                  ...o,
                  status,
                  escrowLocked: status === 'completed' ? false : ['paid', 'delivering', 'disputed'].includes(status),
                }
              : o
          )
        );
      }
      return res;
    },
    [patchOrder]
  );

  const updateWorkflowStatus = React.useCallback(
    async (id: string, workflowStatus: WorkflowStatus, note?: string) => {
      const patch: Record<string, unknown> = { workflow_status: workflowStatus };
      if (note) {
        const order = orders.find((o) => o.id === id);
        const stamp = new Date().toLocaleString();
        const line = `[${stamp}] ${note}`;
        patch.admin_notes = order?.adminNotes ? `${order.adminNotes}\n${line}` : line;
      }
      const res = await patchOrder(id, patch);
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === id
              ? { ...o, workflowStatus, adminNotes: (patch.admin_notes as string) ?? o.adminNotes }
              : o
          )
        );
      }
      return res;
    },
    [patchOrder, orders]
  );

  const releaseEscrow = React.useCallback(
    async (id: string) => {
      const res = await patchOrder(id, {
        status: 'completed',
        escrow_released: true,
        completed_at: new Date().toISOString(),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'completed', escrowLocked: false } : o)));
      }
      return res;
    },
    [patchOrder]
  );

  const extendEscrow = React.useCallback(
    async (id: string, hours: number) => {
      const order = orders.find((o) => o.id === id);
      const base = order?.escrowDeadline ? new Date(order.escrowDeadline).getTime() : Date.now();
      const newDeadline = new Date(base + hours * 3600000).toISOString();
      const res = await patchOrder(id, { buyer_confirm_deadline: newDeadline });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, escrowDeadline: newDeadline } : o)));
      }
      return res;
    },
    [orders, patchOrder]
  );

  return { orders, loading, loadError, refresh: load, updateStatus, updateWorkflowStatus, releaseEscrow, extendEscrow };
}
