'use client';

import * as React from 'react';
import {
  Lock,
  Package,
  Gavel,
  Eye,
  Users,
  BadgeCheck,
  DollarSign,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/stat-card';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useApp } from '@/lib/store';
import { formatBDT, formatDateTime, formatNumber } from '@/lib/format';

export function Dashboard() {
  const { db, currentUser } = useApp();
  if (!currentUser) return null;

  const activeEscrow = db.orders
    .filter((o) => o.escrowLocked)
    .reduce((s, o) => s + o.amount, 0);
  const pendingOrders = db.orders.filter(
    (o) => o.status === 'PENDING' || o.status === 'VERIFYING'
  ).length;
  const activeDisputes = db.disputes.filter(
    (d) => d.status === 'open'
  ).length;
  const totalListings = db.orders.length;
  const pendingApproval = db.orders.filter((o) => o.status === 'PENDING').length;

  const totalUsers = 1840;
  const activeSellers = 312;
  const verifiedSellers = 198;

  const dailyRevenue = db.orders
    .filter(
      (o) =>
        o.status === 'COMPLETED' &&
        Date.now() - new Date(o.createdAt).getTime() < 86400000
    )
    .reduce((s, o) => s + o.platformFee, 0);
  const processedPayouts = db.payouts
    .filter((p) => p.status === 'approved')
    .reduce((s, p) => s + p.amount, 0);

  const recentOrders = [...db.orders].slice(0, 5);
  const recentAudit = db.audit.slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          GameHaatBD Control Room · {currentUser.name || 'Owner'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time overview of marketplace operations, escrow, and staff
          activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Active Escrow Holding"
          value={formatBDT(activeEscrow)}
          sub="Funds locked pending deal completion"
          icon={Lock}
          tone="primary"
        />
        <StatCard
          label="Pending Orders"
          value={formatNumber(pendingOrders)}
          sub="Awaiting verification or handover"
          icon={Package}
          tone="warning"
        />
        <StatCard
          label="Active Disputes"
          value={formatNumber(activeDisputes)}
          sub="Open cases needing staff intervention"
          icon={Gavel}
          tone="danger"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Listed Accounts & Reviews"
          value={formatNumber(totalListings)}
          sub={`${pendingApproval} pending approval`}
          icon={Eye}
        />
        <StatCard
          label="Total Users & Sellers"
          value={formatNumber(totalUsers)}
          sub={`${activeSellers} active · ${verifiedSellers} verified`}
          icon={Users}
          tone="success"
        />
        <StatCard
          label="Quick Financial Summary"
          value={formatBDT(dailyRevenue)}
          sub={`${formatBDT(processedPayouts)} payouts processed`}
          icon={DollarSign}
          tone="success"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y text-left text-xs text-muted-foreground">
                    <th className="px-6 py-2 font-medium">Order</th>
                    <th className="px-6 py-2 font-medium">Account</th>
                    <th className="px-6 py-2 font-medium">Amount</th>
                    <th className="px-6 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="px-6 py-3 font-medium">#{o.id}</td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {o.accountTitle}
                      </td>
                      <td className="px-6 py-3">{formatBDT(o.amount)}</td>
                      <td className="px-6 py-3">
                        <OrderStatusBadge status={o.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              Recent Staff Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAudit.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="truncate">
                    <span className="font-medium">{a.userName}</span>{' '}
                    <span className="text-muted-foreground">{a.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(a.at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active Sellers"
          value={formatNumber(activeSellers)}
          icon={TrendingUp}
        />
        <StatCard
          label="Verified Sellers"
          value={formatNumber(verifiedSellers)}
          icon={BadgeCheck}
          tone="success"
        />
        <StatCard
          label="Total Registered Users"
          value={formatNumber(totalUsers)}
          icon={Users}
        />
      </div>
    </div>
  );
}
