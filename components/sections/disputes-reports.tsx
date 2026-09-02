'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Gavel,
  Flag,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/stat-card';
import { useApp } from '@/lib/store';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  Dispute,
  Report,
  ReportCategory,
} from '@/lib/types';

type CaseKind = 'disputes' | 'reports';

type CaseItem =
  | { kind: 'dispute'; id: string; data: Dispute }
  | { kind: 'report'; id: string; data: Report };

const REPORT_CATEGORY_LABEL: Record<ReportCategory, string> = {
  scam: 'Scam / Non-delivery',
  fake_listing: 'Fake Listing',
  abusive_behavior: 'Abusive Behavior',
  account_recovered: 'Account Recovered by Seller',
  other: 'Other',
};

function isOpen(item: CaseItem) {
  return item.kind === 'dispute'
    ? item.data.status === 'open'
    : item.data.status === 'open';
}

function caseTitle(item: CaseItem) {
  return item.kind === 'dispute'
    ? `Order #${item.data.orderId}`
    : `Report ${item.id.toUpperCase()}`;
}

function caseSubtitle(item: CaseItem) {
  if (item.kind === 'dispute') return item.data.reason;
  return REPORT_CATEGORY_LABEL[item.data.category];
}

function statusBadge(item: CaseItem) {
  if (item.kind === 'dispute') {
    const s = item.data.status;
    if (s === 'open')
      return { label: 'Open', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' };
    if (s === 'resolved_release')
      return { label: 'Released to Seller', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' };
    return { label: 'Refunded Buyer', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' };
  }
  const s = item.data.status;
  if (s === 'open')
    return { label: 'Open', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400' };
  if (s === 'resolved_warning')
    return { label: 'Warning Issued', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' };
  if (s === 'resolved_banned')
    return { label: 'User Banned', cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' };
  return { label: 'Dismissed', cls: 'bg-muted text-muted-foreground' };
}

export function DisputesReportsView({
  defaultTab = 'disputes',
}: {
  defaultTab?: CaseKind;
}) {
  const router = useRouter();
  const { db, currentUser } = useApp();
  const [tab, setTab] = React.useState<CaseKind>(defaultTab);
  const [query, setQuery] = React.useState('');

  const disputeItems: CaseItem[] = (db.disputes ?? []).map((d) => ({
    kind: 'dispute',
    id: String(d.orderId),
    data: d,
  }));
  const reportItems: CaseItem[] = (db.reports ?? []).map((r) => ({
    kind: 'report',
    id: r.id,
    data: r,
  }));

  const openDisputes = disputeItems.filter(isOpen).length;
  const openReports = reportItems.filter(isOpen).length;

  const list = (tab === 'disputes' ? disputeItems : reportItems)
    .slice()
    .sort((a, b) => (isOpen(a) === isOpen(b) ? 0 : isOpen(a) ? -1 : 1));

  const q = query.toLowerCase().trim();
  const filtered = list.filter((item) => {
    if (!q) return true;
    const hay =
      item.kind === 'dispute'
        ? `${item.data.orderId} ${item.data.buyerEmail} ${item.data.sellerEmail} ${item.data.buyerName} ${item.data.sellerName}`
        : `${item.id} ${item.data.buyerEmail} ${item.data.sellerEmail} ${item.data.buyerName} ${item.data.sellerName}`;
    return hay.toLowerCase().includes(q);
  });

  const handleItemClick = (item: CaseItem) => {
    if (item.kind === 'dispute') {
      router.push(`/disputes/${item.data.orderId}`);
    } else {
      router.push(`/reports/${item.id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Disputes &amp; Reports
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review evidence, chat with both sides, and make the final call as{' '}
          {currentUser?.name || 'Admin'}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          className="text-left"
          onClick={() => setTab('disputes')}
        >
          <StatCard
            label="Open Disputes"
            value={openDisputes}
            sub={`${disputeItems.length} total`}
            icon={Gavel}
            tone={openDisputes > 0 ? 'warning' : 'default'}
          />
        </button>
        <button
          className="text-left"
          onClick={() => setTab('reports')}
        >
          <StatCard
            label="Open Reports"
            value={openReports}
            sub={`${reportItems.length} total`}
            icon={Flag}
            tone={openReports > 0 ? 'danger' : 'default'}
          />
        </button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as CaseKind)}>
        <TabsList>
          <TabsTrigger value="disputes">
            Disputes
            {openDisputes > 0 && (
              <Badge className="ml-2 h-5 min-w-5 justify-center bg-primary/10 px-1.5 text-primary">
                {openDisputes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="reports">
            Reports
            {openReports > 0 && (
              <Badge className="ml-2 h-5 min-w-5 justify-center bg-primary/10 px-1.5 text-primary">
                {openReports}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                tab === 'disputes'
                  ? 'Search by order ID, buyer or seller…'
                  : 'Search by report ID, buyer or seller…'
              }
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* শুধু লিস্ট - কার্ড ভিউ */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.length === 0 && (
              <Card className="sm:col-span-2 lg:col-span-3">
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No {tab} found.
                </CardContent>
              </Card>
            )}
            {filtered.map((item) => {
              const sb = statusBadge(item);
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="w-full text-left"
                >
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {caseTitle(item)}
                        </span>
                        <Badge className={cn('shrink-0 text-[10px]', sb.cls)}>
                          {sb.label}
                        </Badge>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                        {caseSubtitle(item)}
                      </p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        {item.data.buyerName || item.data.buyerEmail} vs{' '}
                        {item.data.sellerName || item.data.sellerEmail}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatDateTime(item.data.createdAt)}
                      </p>
                      <div className="mt-3 flex items-center justify-end text-xs text-primary">
                        View Details
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
