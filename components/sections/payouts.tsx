'use client';

import * as React from 'react';
import { TrendingUp, Wallet, Lock, Banknote } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { StatCard } from '@/components/stat-card';
import { useApp } from '@/lib/store';
import { formatBDT } from '@/lib/format';
import { toast } from 'sonner';

export function PayoutFinance() {
  const { db, setFeePercent } = useApp();
  const [feeInput, setFeeInput] = React.useState(String(db.settings.feePercent));
  const [filter, setFilter] = React.useState<'month' | 'year'>('month');

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

  const saveFee = () => {
    const n = Number(feeInput);
    if (isNaN(n) || n < 0 || n > 100) {
      toast.error('Fee must be between 0 and 100');
      return;
    }
    setFeePercent(n);
    toast.success(`Platform fee set to ${n}%`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Financial Overview
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review platform revenue, escrow holdings, and adjust marketplace fees.
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Financial Overview</TabsTrigger>
          <TabsTrigger value="fees">Platform Fee Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
