'use client';

import * as React from 'react';
import {
  Search,
  Download,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { formatBDT, formatDateTime } from '@/lib/format';
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
  const { db, updateOrderStatus } = useApp();
  const [query, setQuery] = React.useState('');

  const q = query.toLowerCase().trim();
  const filtered = db.orders.filter(
    (o) =>
      !q ||
      String(o.id).includes(q) ||
      o.buyerEmail.toLowerCase().includes(q) ||
      o.sellerEmail.toLowerCase().includes(q)
  );

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
            Manage all marketplace orders.
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
    </div>
  );
}
