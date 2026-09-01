'use client';

import * as React from 'react';
import {
  Search,
  Lock,
  Unlock,
  Clock,
  Plus,
  Download,
  Eye,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useApp } from '@/lib/store';
import { formatBDT, formatDateTime, timeRemaining } from '@/lib/format';
import type { OrderStatus } from '@/lib/types';
import { toast } from 'sonner';

function exportCSV(rows: Record<string, unknown>[], filename: string) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const v = r[h];
          const s = v == null ? '' : String(v);
          return s.includes(',') ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(',')
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

export function OrderManagement() {
  const { db, updateOrderStatus, releaseEscrow, extendEscrow } = useApp();
  const [query, setQuery] = React.useState('');
  const [tick, setTick] = React.useState(0);

  React.useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const q = query.toLowerCase().trim();
  const filtered = db.orders.filter(
    (o) =>
      !q ||
      String(o.id).includes(q) ||
      o.buyerEmail.toLowerCase().includes(q) ||
      o.sellerEmail.toLowerCase().includes(q)
  );

  const escrowOrders = db.orders.filter((o) => o.escrowLocked);

  const handleExport = () => {
    exportCSV(
      filtered.map((o) => ({
        OrderID: `#${o.id}`,
        Buyer: o.buyerEmail,
        Seller: o.sellerEmail,
        Account: o.accountTitle,
        Amount: o.amount,
        Fee: o.platformFee,
        Status: o.status,
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
          <h1 className="text-2xl font-semibold tracking-tight">
            Order Management Center
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all marketplace orders, escrow holdings, and dispute
            mediation.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Order ID, Buyer or Seller email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All Orders</TabsTrigger>
          <TabsTrigger value="escrow">Active Escrows</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardContent className="px-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-6">Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Update</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell className="pl-6 font-medium">
                          #{o.id}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {o.buyerEmail}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {o.sellerEmail}
                        </TableCell>
                        <TableCell className="max-w-[180px] truncate text-muted-foreground">
                          {o.accountTitle}
                        </TableCell>
                        <TableCell>{formatBDT(o.amount)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatBDT(o.platformFee)}
                        </TableCell>
                        <TableCell>
                          <OrderStatusBadge status={o.status} />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDateTime(o.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={o.status}
                            onValueChange={(v) =>
                              updateOrderStatus(o.id, v as OrderStatus)
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(
                                [
                                  'PENDING',
                                  'VERIFYING',
                                  'COMPLETED',
                                  'CANCELLED',
                                  'DISPUTED',
                                ] as OrderStatus[]
                              ).map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s.charAt(0) + s.slice(1).toLowerCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell
                          colSpan={9}
                          className="py-10 text-center text-muted-foreground"
                        >
                          No orders match your search.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escrow">
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
        </TabsContent>

        <TabsContent value="disputes">
          <DisputesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function DisputesView() {
  const { db, addDisputeMessage, resolveDispute } = useApp();
  const [text, setText] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<number | null>(
    db.disputes[0]?.orderId ?? null
  );

  const dispute = db.disputes.find((d) => d.orderId === selectedId);

  const send = () => {
    if (!dispute || !text.trim()) return;
    addDisputeMessage(dispute.orderId, text);
    setText('');
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardContent className="p-5">
          {!dispute ? (
            <p className="py-10 text-center text-muted-foreground">
              No disputes selected.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">
                    Dispute · Order #{dispute.orderId}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {dispute.buyerEmail} vs {dispute.sellerEmail}
                  </p>
                </div>
                <Badge
                  className={
                    dispute.status === 'open'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  }
                >
                  {dispute.status === 'open'
                    ? 'Open'
                    : dispute.status === 'resolved_release'
                      ? 'Released to Seller'
                      : 'Refunded Buyer'}
                </Badge>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-500/20 dark:bg-blue-500/5">
                  <h4 className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-400">
                    Buyer Evidence
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {dispute.buyerEvidence}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                  <h4 className="mb-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    Seller Evidence
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {dispute.sellerEvidence}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Eye className="h-4 w-4" />
                  Credential Details
                </h4>
                <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                  {dispute.credentials}
                </pre>
              </div>

              {dispute.status === 'open' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      resolveDispute(dispute.orderId, 'release');
                      toast.success('Funds released to seller');
                    }}
                  >
                    Release to Seller
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      resolveDispute(dispute.orderId, 'refund');
                      toast.success('Buyer refunded');
                    }}
                  >
                    Refund Buyer
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex h-full flex-col p-5">
          <h3 className="mb-3 font-semibold">Mediation Chat</h3>
          {dispute ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto pb-3">
                {dispute.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.author === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        m.author === 'admin'
                          ? 'bg-primary text-primary-foreground'
                          : m.author === 'buyer'
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-500/15 dark:text-blue-200'
                            : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200'
                      }`}
                    >
                      <p className="mb-0.5 text-xs font-semibold opacity-80">
                        {m.authorName}
                      </p>
                      <p>{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              {dispute.status === 'open' && (
                <div className="flex gap-2 border-t pt-3">
                  <Input
                    placeholder="Type a message…"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                  />
                  <Button size="sm" onClick={send}>
                    Send
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Select a dispute.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
