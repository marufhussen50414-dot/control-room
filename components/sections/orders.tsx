'use client';

import * as React from 'react';
import { Search, Download, RefreshCw, LogOut } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RealOrderStatusBadge } from '@/components/real-order-status-badge';
import { ConnectLiveSitePrompt } from '@/components/connect-live-site-prompt';
import { useRealOrders } from '@/lib/use-real-orders';
import { formatBDT, formatDateTime } from '@/lib/format';
import type { MainSiteOrderStatus } from '@/lib/main-site-types';
import { toast } from 'sonner';

const STATUSES: MainSiteOrderStatus[] = [
  'pending', 'paid', 'delivering', 'completed', 'cancelled', 'disputed', 'refunded',
];

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

export function OrderManagement() {
  const {
    connected, checking, adminEmail, orders, loading, loadError,
    refresh, updateStatus, disconnect,
  } = useRealOrders();
  const [query, setQuery] = React.useState('');

  if (checking) {
    return <div className="py-10 text-center text-muted-foreground">Checking connection…</div>;
  }

  if (!connected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order Management Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage all marketplace orders.</p>
        </div>
        <ConnectLiveSitePrompt />
      </div>
    );
  }

  const q = query.toLowerCase().trim();
  const filtered = orders.filter(
    (o) =>
      !q ||
      o.shortId.toLowerCase().includes(q) ||
      o.buyerLabel.toLowerCase().includes(q) ||
      o.sellerLabel.toLowerCase().includes(q)
  );

  const handleExport = () => {
    exportCSV(
      filtered.map((o) => ({
        OrderID: o.shortId,
        Buyer: o.buyerLabel,
        Seller: o.sellerLabel,
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

  const handleStatusChange = async (id: string, status: MainSiteOrderStatus) => {
    const res = await updateStatus(id, status);
    if (!res.ok) toast.error(res.message);
    else toast.success('Status updated');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Order Management Center</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all marketplace orders. Connected as {adminEmail}.
          </p>
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
          <Button variant="ghost" onClick={disconnect}>
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
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

      {loadError && (
        <p className="text-sm text-destructive">Failed to load orders: {loadError}</p>
      )}

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
                    <TableCell className="pl-6 font-medium">#{o.shortId}</TableCell>
                    <TableCell className="text-muted-foreground">{o.buyerLabel}</TableCell>
                    <TableCell className="text-muted-foreground">{o.sellerLabel}</TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {o.accountTitle}
                    </TableCell>
                    <TableCell>{formatBDT(o.amount)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatBDT(o.platformFee)}</TableCell>
                    <TableCell><RealOrderStatusBadge status={o.status} /></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateTime(o.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => handleStatusChange(o.id, v as MainSiteOrderStatus)}>
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                      No orders match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
