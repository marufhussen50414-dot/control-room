'use client';

import * as React from 'react';
import {
  Search,
  Gavel,
  Flag,
  Eye,
  Play,
  Users,
  User as UserIcon,
  Store,
  ShieldAlert,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatCard } from '@/components/stat-card';
import { useApp } from '@/lib/store';
import { formatBDT, formatDateTime, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type {
  Attachment,
  ChatChannel,
  Dispute,
  DisputeMessage,
  Report,
  ReportCategory,
} from '@/lib/types';
import { toast } from 'sonner';

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

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

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

function AttachmentCard({ a }: { a: Attachment }) {
  const [playing, setPlaying] = React.useState(false);
  if (a.kind !== 'recording') return null;
  return (
    <div className="overflow-hidden rounded-lg border bg-muted/30">
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Play className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{a.label}</p>
            <p className="text-[11px] text-muted-foreground">
              Uploaded by {a.uploadedBy}
              {a.durationSec ? ` · ${a.durationSec}s` : ''}
            </p>
          </div>
        </div>
        {!playing && (
          <Button size="sm" variant="outline" onClick={() => setPlaying(true)}>
            <Play className="mr-1.5 h-3 w-3" />
            Play
          </Button>
        )}
      </div>
      {playing && (
        <video
          src={a.url}
          controls
          autoPlay
          className="max-h-64 w-full bg-black"
        />
      )}
    </div>
  );
}

function PartyCard({
  role,
  name,
  email,
  highlight,
}: {
  role: 'Buyer' | 'Seller';
  name: string;
  email: string;
  highlight?: boolean;
}) {
  const isBuyer = role === 'Buyer';
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3',
        isBuyer
          ? 'border-blue-200 bg-blue-50/50 dark:border-blue-500/20 dark:bg-blue-500/5'
          : 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-500/5'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          isBuyer
            ? 'bg-blue-600 text-white'
            : 'bg-emerald-600 text-white'
        )}
      >
        {initials(name || role)}
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {isBuyer ? (
            <UserIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          ) : (
            <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <p
            className={cn(
              'text-xs font-semibold',
              isBuyer ? 'text-blue-700 dark:text-blue-400' : 'text-emerald-700 dark:text-emerald-400'
            )}
          >
            {role}
            {highlight ? ' · Reported' : ''}
          </p>
        </div>
        <p className="truncate text-sm font-medium">{name || 'Unknown'}</p>
        <p className="truncate text-xs text-muted-foreground">{email}</p>
      </div>
    </div>
  );
}

function ChatThread({
  messages,
  emptyLabel,
  onSend,
  disabled,
}: {
  messages: DisputeMessage[];
  emptyLabel: string;
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [text, setText] = React.useState('');
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pb-3">
        {messages.length === 0 && (
          <p className="py-8 text-center text-xs text-muted-foreground">
            {emptyLabel}
          </p>
        )}
        {messages.map((m) => (
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
              <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold opacity-80">
                {m.authorName}
                <span className="font-normal opacity-70">
                  {formatTime(m.at)}
                </span>
              </p>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {!disabled && (
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
    </div>
  );
}

export function DisputesReportsView({
  defaultTab = 'disputes',
}: {
  defaultTab?: CaseKind;
}) {
  const {
    db,
    currentUser,
    addDisputeMessage,
    resolveDispute,
    addReportMessage,
    resolveReport,
  } = useApp();

  const [tab, setTab] = React.useState<CaseKind>(defaultTab);
  const [query, setQuery] = React.useState('');
  const [chatChannel, setChatChannel] = React.useState<ChatChannel>('group');

  const disputeItems: CaseItem[] = db.disputes.map((d) => ({
    kind: 'dispute',
    id: String(d.orderId),
    data: d,
  }));
  const reportItems: CaseItem[] = db.reports.map((r) => ({
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

  const [selectedId, setSelectedId] = React.useState<string | null>(
    filtered[0]?.id ?? null
  );

  React.useEffect(() => {
    setChatChannel('group');
    if (!filtered.find((i) => i.id === selectedId)) {
      setSelectedId(filtered[0]?.id ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const selected = filtered.find((i) => i.id === selectedId) ?? null;

  const handleSend = (text: string) => {
    if (!selected) return;
    if (selected.kind === 'dispute') {
      addDisputeMessage(selected.data.orderId, text, chatChannel);
    } else {
      addReportMessage(selected.data.id, text, chatChannel);
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
          onClick={() => {
            setTab('disputes');
            setSelectedId(disputeItems[0]?.id ?? null);
          }}
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
          onClick={() => {
            setTab('reports');
            setSelectedId(reportItems[0]?.id ?? null);
          }}
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

          <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
            {/* List */}
            <div className="space-y-2 lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto lg:pr-1">
              {filtered.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No {tab} found.
                  </CardContent>
                </Card>
              )}
              {filtered.map((item) => {
                const sb = statusBadge(item);
                const active = item.id === selectedId;
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      active
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">
                        {caseTitle(item)}
                      </span>
                      <Badge className={cn('shrink-0 text-[10px]', sb.cls)}>
                        {sb.label}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {caseSubtitle(item)}
                    </p>
                    <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
                      {item.data.buyerName || item.data.buyerEmail} vs{' '}
                      {item.data.sellerName || item.data.sellerEmail}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Detail */}
            <div>
              {!selected ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    Select a {tab === 'disputes' ? 'dispute' : 'report'} to
                    view details.
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 xl:grid-cols-3">
                  <Card className="xl:col-span-2">
                    <CardContent className="space-y-5 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h3 className="font-semibold">
                            {caseTitle(selected)}
                          </h3>
                          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(selected.data.createdAt)}
                          </p>
                        </div>
                        <Badge className={statusBadge(selected).cls}>
                          {statusBadge(selected).label}
                        </Badge>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <PartyCard
                          role="Buyer"
                          name={selected.data.buyerName}
                          email={selected.data.buyerEmail}
                          highlight={
                            selected.kind === 'report' &&
                            (selected.data as Report).reportedBy === 'buyer'
                          }
                        />
                        <PartyCard
                          role="Seller"
                          name={selected.data.sellerName}
                          email={selected.data.sellerEmail}
                          highlight={
                            selected.kind === 'report' &&
                            (selected.data as Report).reportedBy === 'seller'
                          }
                        />
                      </div>

                      {selected.kind === 'dispute' ? (
                        <>
                          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                            <span className="text-muted-foreground">
                              Order:{' '}
                            </span>
                            <span className="font-medium">
                              {selected.data.accountTitle}
                            </span>
                            <span className="text-muted-foreground">
                              {' '}
                              · {formatBDT(selected.data.amount)}
                            </span>
                          </div>
                          <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
                              <h4 className="mb-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                                Buyer Evidence
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {selected.data.buyerEvidence}
                              </p>
                            </div>
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                              <h4 className="mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                Seller Evidence
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {selected.data.sellerEvidence}
                              </p>
                            </div>
                          </div>
                          <div className="rounded-lg border bg-muted/30 p-3">
                            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold">
                              <Eye className="h-3.5 w-3.5" />
                              Credential Details
                            </h4>
                            <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                              {selected.data.credentials}
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="rounded-lg border bg-muted/30 p-3">
                          <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {REPORT_CATEGORY_LABEL[selected.data.category]}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {selected.data.description}
                          </p>
                        </div>
                      )}

                      {selected.data.attachments.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold text-muted-foreground">
                            Attachments &amp; Screen Recordings
                          </h4>
                          {selected.data.attachments.map((a) => (
                            <AttachmentCard key={a.id} a={a} />
                          ))}
                        </div>
                      )}

                      {isOpen(selected) && (
                        <div className="flex flex-wrap gap-2 border-t pt-4">
                          {selected.kind === 'dispute' ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => {
                                  resolveDispute(
                                    selected.data.orderId,
                                    'release'
                                  );
                                  toast.success(
                                    'Funds released to seller'
                                  );
                                }}
                              >
                                Release to Seller
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  resolveDispute(
                                    selected.data.orderId,
                                    'refund'
                                  );
                                  toast.success('Buyer refunded');
                                }}
                              >
                                Refund Buyer
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  resolveReport(selected.data.id, 'warning');
                                  toast.success('Warning issued');
                                }}
                              >
                                Issue Warning
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  resolveReport(selected.data.id, 'banned');
                                  toast.success('User banned');
                                }}
                              >
                                Ban User
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  resolveReport(
                                    selected.data.id,
                                    'dismissed'
                                  );
                                  toast('Report dismissed');
                                }}
                              >
                                Dismiss
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="flex h-full flex-col p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        Mediation Chat
                      </h3>
                      <Tabs
                        value={chatChannel}
                        onValueChange={(v) => setChatChannel(v as ChatChannel)}
                        className="flex min-h-0 flex-1 flex-col"
                      >
                        <TabsList className="w-full">
                          <TabsTrigger value="group" className="flex-1">
                            <Users className="mr-1.5 h-3.5 w-3.5" />
                            3-Way
                          </TabsTrigger>
                          <TabsTrigger value="buyer" className="flex-1">
                            <UserIcon className="mr-1.5 h-3.5 w-3.5" />
                            Buyer
                          </TabsTrigger>
                          <TabsTrigger value="seller" className="flex-1">
                            <Store className="mr-1.5 h-3.5 w-3.5" />
                            Seller
                          </TabsTrigger>
                        </TabsList>
                        {(['group', 'buyer', 'seller'] as ChatChannel[]).map(
                          (ch) => (
                            <TabsContent
                              key={ch}
                              value={ch}
                              className="mt-2 min-h-0 flex-1"
                            >
                              <ChatThread
                                messages={selected.data.messages.filter(
                                  (m) => m.channel === ch
                                )}
                                emptyLabel={
                                  ch === 'group'
                                    ? 'No messages yet in the 3-way chat.'
                                    : `No private messages with the ${ch} yet. Only you and the ${ch} can see this thread.`
                                }
                                onSend={handleSend}
                                disabled={!isOpen(selected)}
                              />
                            </TabsContent>
                          )
                        )}
                      </Tabs>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
