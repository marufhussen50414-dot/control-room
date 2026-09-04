'use client';

import * as React from 'react';
import { Download, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApp } from '@/lib/store';
import { formatBDT } from '@/lib/format';
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

export function PayoutFinance() {
  const { db, approvePayout, rejectPayout } = useApp();
  const [trxInputs, setTrxInputs] = React.useState<Record<number, string>>({});

  const allPayouts = db.payouts;

  const handleExport = () => {
    exportCSV(
      allPayouts.map((p) => ({
        PayoutID: `#${p.id}`,
        Seller: p.sellerEmail,
        Amount: p.amount,
        Method: p.method,
        Destination: p.destination,
        Status: p.status,
        TrxID: p.trxId,
        Created: p.createdAt,
      })),
      'payouts.csv'
    );
    toast.success('Payouts exported to CSV');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Payout Management
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Process seller cash-outs and manage payout requests.
        </p>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">ID</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TrxID / Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allPayouts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="pl-6 font-medium">
                      #{p.id}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.sellerEmail}
                    </TableCell>
                    <TableCell>{formatBDT(p.amount)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{p.method}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.destination}
                    </TableCell>
                    <TableCell>
                      {p.status === 'pending' && (
                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                          Pending
                        </Badge>
                      )}
                      {p.status === 'approved' && (
                        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          Approved
                        </Badge>
                      )}
                      {p.status === 'rejected' && (
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                          Rejected
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {p.status === 'pending' ? (
                        <div className="flex items-center gap-2">
                          <Input
                            placeholder="TrxID"
                            value={trxInputs[p.id] ?? ''}
                            onChange={(e) =>
                              setTrxInputs((s) => ({
                                ...s,
                                [p.id]: e.target.value,
                              }))
                            }
                            className="h-8 w-[120px]"
                          />
                          <Button
                            size="sm"
                            disabled={!trxInputs[p.id]?.trim()}
                            onClick={() => {
                              approvePayout(p.id, trxInputs[p.id].trim());
                              toast.success(`Payout #${p.id} approved`);
                            }}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              rejectPayout(p.id);
                              toast.success(`Payout #${p.id} rejected`);
                            }}
                          >
                            <X className="mr-1 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">
                          {p.trxId || '—'}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {allPayouts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No payout requests.
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
