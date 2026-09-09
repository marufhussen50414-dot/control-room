'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSection } from '@/lib/section-context';
import { ArrowLeft, User as UserIcon, Store, Phone, Mail, MessageCircle, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RealOrderStatusBadge } from '@/components/real-order-status-badge';
import { useRealOrders } from '@/lib/use-real-orders';
import { formatBDT, formatDateTime } from '@/lib/format';
import type { MainSiteOrderStatus } from '@/lib/main-site-types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUSES: MainSiteOrderStatus[] = [
  'pending', 'paid', 'delivering', 'completed', 'cancelled', 'disputed', 'refunded',
];

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function PartyCard({
  role, name, email, phone, whatsapp,
}: {
  role: 'Buyer' | 'Seller'; name: string; email: string; phone: string | null; whatsapp: string | null;
}) {
  const isBuyer = role === 'Buyer';
  return (
    <Card className={isBuyer ? 'border-blue-200 dark:border-blue-500/20' : 'border-emerald-200 dark:border-emerald-500/20'}>
      <CardContent className="space-y-3 p-5">
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg border p-3',
            isBuyer
              ? 'border-blue-200 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
              : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
          )}
        >
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold', isBuyer ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white')}>
            {initials(name || role)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              {isBuyer ? <UserIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />}
              <p className={cn('text-xs font-semibold', isBuyer ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400')}>{role}</p>
            </div>
            <p className="truncate text-sm font-medium">{name || 'Unknown'}</p>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{email || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{phone || '—'}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{whatsapp || '—'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { orders, loading, updateStatus } = useRealOrders();
  const id = params?.id as string;
  const order = orders.find((o) => o.id === id);

  const handleStatusChange = async (status: MainSiteOrderStatus) => {
    const res = await updateStatus(id, status);
    if (!res.ok) toast.error(res.message);
    else toast.success('Status updated');
  };

  if (loading) {
    return <div className="py-20 text-center text-muted-foreground">Loading…</div>;
  }

  if (!order) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Order not found</h2>
          <Button className="mt-4" onClick={() => router.push('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Orders
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order #{order.shortId}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{order.accountTitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <RealOrderStatusBadge status={order.status} />
          <Select value={order.status} onValueChange={(v) => handleStatusChange(v as MainSiteOrderStatus)}>
            <SelectTrigger className="h-9 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <PartyCard role="Buyer" name={order.buyerLabel} email={order.buyerEmail} phone={order.buyerPhone} whatsapp={order.buyerWhatsapp} />
        <PartyCard role="Seller" name={order.sellerLabel} email={order.sellerEmail} phone={order.sellerPhone} whatsapp={order.sellerWhatsapp} />
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="mb-2 font-semibold">Order Details</h3>
          <Row label="Order ID" value={order.id} />
          <Row label="Account / Listing" value={order.accountTitle} />
          <Row label="Game" value={order.gameName} />
          <Row label="Price" value={formatBDT(order.amount)} />
          <Row label="Commission" value={`${formatBDT(order.platformFee)} (${(order.commissionRate * 100).toFixed(1)}%)`} />
          <Row label="Seller Receives" value={formatBDT(order.sellerAmount)} />
          <Row label="Payment Method" value={order.paymentMethod} />
          <Row label="Payment Number" value={order.paymentNumber} />
          <Row label="Created" value={formatDateTime(order.createdAt)} />
          <Row label="Last Updated" value={formatDateTime(order.updatedAt)} />
          <Row label="Escrow Deadline" value={order.escrowDeadline ? formatDateTime(order.escrowDeadline) : null} />
        </CardContent>
      </Card>

      {(order.deliveryPassword || order.deliveryVideoUrl || order.deliveredAt) && (
        <Card>
          <CardContent className="p-5">
            <h3 className="mb-2 font-semibold">Delivery</h3>
            <Row label="Delivered At" value={order.deliveredAt ? formatDateTime(order.deliveredAt) : null} />
            {order.deliveryPassword && (
              <div className="mt-2 rounded-lg border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Delivery Password</p>
                <p className="font-mono text-sm">{order.deliveryPassword}</p>
              </div>
            )}
            {order.deliveryVideoUrl && (
              <div className="mt-3 space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Play className="h-3.5 w-3.5" /> Seller's Delivery Video
                </p>
                <video src={order.deliveryVideoUrl} controls className="max-h-64 w-full rounded-lg bg-black" />
              </div>
            )}
            {order.buyerVideoUrl && (
              <div className="mt-3 space-y-1.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Play className="h-3.5 w-3.5" /> Buyer's Confirmation Video
                </p>
                <video src={order.buyerVideoUrl} controls className="max-h-64 w-full rounded-lg bg-black" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(order.disputeReason || order.adminNotes) && (
        <Card className="border-red-200 dark:border-red-500/20">
          <CardContent className="p-5">
            <h3 className="mb-2 font-semibold">Dispute</h3>
            <Row label="Opened" value={order.disputeOpenedAt ? formatDateTime(order.disputeOpenedAt) : null} />
            <Row label="Resolved" value={order.resolvedAt ? formatDateTime(order.resolvedAt) : null} />
            {order.disputeReason && (
              <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Reason</p>
                <p>{order.disputeReason}</p>
              </div>
            )}
            {order.adminNotes && (
              <div className="mt-2 rounded-lg border bg-muted/30 p-3 text-sm">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Admin Notes</p>
                <p>{order.adminNotes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function OrderDetailPage() {
  const { setSection } = useSection();
  React.useEffect(() => {
    setSection('orders');
  }, [setSection]);

  return <OrderDetailContent />;
}
