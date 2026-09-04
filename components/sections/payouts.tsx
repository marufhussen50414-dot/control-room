'use client';

import * as React from 'react';
import { Download, Check, X, Wallet, TrendingUp, Lock, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { StatCard } from '@/components/stat-card';
import { useApp } from '@/lib/store';
import { formatBDT, formatDateTime } from '@/lib/format';
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

export function PayoutFinance({
  mode = 'payouts',
}: {
  mode?: 'payouts' | 'finance';
}) {
  const { db, approvePayout, rejectPayout, setFeePercent } = useApp();
  const [trxInputs, setTrxInputs] = React.useState<Record<number, string>>({});
  const [feeInput, setFeeInput] = React.useState(String(db.settings.feePercent));
  const [filter, setFilter] = React.useState<'month' | 'year'>('month');

  const pending = db.payouts.filter((p) => p.status === 'pending');
  const allPayouts = db.payouts;

  const totalRevenue = db.orders
    .filter((o) => o.status === 'COMPLETED')
    .reduce((s, o) => s + o.platformFee, 0);
  const totalEscrow = db.orders
    .filter((o) => o.escrowLocked)
    .reduce((s, o) => s + o.amount, 0);
  const totalPaidOut = db.payouts
    .filter((p) => p.status === 'approved')
    .reduce((s, p) => s + p.amount, 0);

  const now = Date.now();
  const periodMs = filter === 'month' ? 30 * 86400000 : 365 * 86400000;
  const periodRevenue = db.orders
    .filter(
      (o) =>
        o.status === 'COMPLETED' &&
        now - new Date(o.createdAt).getTime() < periodMs
    )
    .reduce((s, o) => s + o.platformFee, 0);

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

  const saveFee = () => {
    const n = Number(feeInput);
    if (isNaN(n) || n < 0 || n > 100) {
      toast.error('Fee must be between 0 and 100');
      return;
    }
    setFeePercent(n);
    toast.success(`Platform fee set to ${n}%`);
  };

  const payoutRequestsPanel = (
    <div className="space-y-4">
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

  const financialOverviewPanel = (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label className="text-sm">Filter:</Label>
        <Select
          value={filter}
          onValueChange={(v) => setFilter(v as 'month' | 'year')}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Platform Revenue"
          value={formatBDT(totalRevenue)}
          sub="All-time net earnings from fees"
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label={`Net Profit (${filter === 'month' ? 'Monthly' : 'Yearly'})`}
          value={formatBDT(periodRevenue)}
          sub="Fee earnings in selected period"
          icon={Wallet}
          tone="primary"
        />
        <StatCard
          label="Total Escrow Holding"
          value={formatBDT(totalEscrow)}
          sub="Currently locked buyer funds"
          icon={Lock}
          tone="warning"
        />
        <StatCard
          label="Total Paid Out"
          value={formatBDT(totalPaidOut)}
          sub="Cumulative seller payouts"
          icon={Banknote}
        />
      </div>
    </div>
  );

  const feeSettingsPanel = (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-base">
          Global Marketplace Commission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fee">Platform Fee Percentage</Label>
          <div className="flex items-center gap-2">
            <Input
              id="fee"
              type="number"
              min={0}
              max={100}
              value={feeInput}
              onChange={(e) => setFeeInput(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Applied to every completed order. Common values: 5%, 8%, 10%.
          </p>
        </div>
        <Button onClick={saveFee}>Save Fee</Button>
      </CardContent>
    </Card>
  );

  if (mode === 'payouts') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Payout Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Process and review seller cash-out requests.
          </p>
        </div>
        {payoutRequestsPanel}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Financial Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review platform revenue, escrow holdings, and adjust marketplace
          fees.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="fees">Platform Fee Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {financialOverviewPanel}
        </TabsContent>
        <TabsContent value="fees" className="space-y-4">
          {feeSettingsPanel}
        </TabsContent>
      </Tabs>
    </div>
  );
}
