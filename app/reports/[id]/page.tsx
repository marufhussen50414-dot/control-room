'use client';

import { AppShell } from '@/components/app-shell';
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Users,
  User as UserIcon,
  Store,
  ShieldAlert,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/store';
import { formatDateTime, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Attachment, ChatChannel, DisputeMessage, ReportCategory } from '@/lib/types';
import { toast } from 'sonner';

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
          isBuyer ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
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
              isBuyer
                ? 'text-blue-700 dark:text-blue-400'
                : 'text-emerald-700 dark:text-emerald-400'
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
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto pb-3">
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
              className={cn(
                'max-w-[85%] rounded-lg border px-3 py-2 text-sm',
                m.author === 'admin'
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : m.author === 'buyer'
                    ? 'border-blue-200 bg-blue-100 text-blue-900 dark:border-blue-400/30 dark:bg-blue-950/70 dark:text-blue-100'
                    : 'border-emerald-200 bg-emerald-100 text-emerald-900 dark:border-emerald-400/30 dark:bg-emerald-950/70 dark:text-emerald-100'
              )}
            >
              <p className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold opacity-80">
                {m.authorName}
                <span className="font-normal opacity-70">{formatTime(m.at)}</span>
              </p>
              <p className="whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
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

function ReportDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { db, addReportMessage, resolveReport } = useApp();
  const [chatChannel, setChatChannel] = React.useState<ChatChannel>('group');

  const id = params?.id as string;
  const report = db.reports.find((r) => r.id === id);

  if (!report) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Report not found</h2>
          <p className="mt-2 text-muted-foreground">Report {id} does not exist.</p>
          <Button className="mt-4" onClick={() => router.push('/reports')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  const isOpen = report.status === 'open';

  const handleSend = (text: string) => {
    addReportMessage(report.id, text, chatChannel);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/reports')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Reports
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Report {report.id.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {REPORT_CATEGORY_LABEL[report.category]}
          </p>
        </div>
        <Badge
          className={cn(
            'shrink-0 text-sm px-4 py-1.5',
            isOpen
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
              : report.status === 'resolved_warning'
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                : report.status === 'resolved_banned'
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                  : 'bg-muted text-muted-foreground'
          )}
        >
          {report.status === 'open'
            ? 'Open'
            : report.status === 'resolved_warning'
              ? 'Warning Issued'
              : report.status === 'resolved_banned'
                ? 'User Banned'
                : 'Dismissed'}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PartyCard
          role="Buyer"
          name={report.buyerName}
          email={report.buyerEmail}
          highlight={report.reportedBy === 'buyer'}
        />
        <PartyCard
          role="Seller"
          name={report.sellerName}
          email={report.sellerEmail}
          highlight={report.reportedBy === 'seller'}
        />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="rounded-lg border bg-muted/30 p-3">
            <h4 className="mb-1.5 flex items-center gap-2 text-xs font-semibold">
              <ShieldAlert className="h-3.5 w-3.5" />
              Report Details
            </h4>
            <p className="text-sm text-muted-foreground">{report.description}</p>
            {report.orderId && (
              <p className="mt-2 text-xs text-muted-foreground">
                Related Order: #{report.orderId}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDateTime(report.createdAt)}
            </p>
          </div>

          {(report.attachments?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Attachments &amp; Screen Recordings
              </h4>
              {report.attachments.map((a) => (
                <AttachmentCard key={a.id} a={a} />
              ))}
            </div>
          )}

          {isOpen && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  resolveReport(report.id, 'warning');
                  toast.success('Warning issued');
                }}
              >
                Issue Warning
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  resolveReport(report.id, 'banned');
                  toast.success('User banned');
                }}
              >
                Ban User
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  resolveReport(report.id, 'dismissed');
                  toast('Report dismissed');
                }}
              >
                Dismiss
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex h-[520px] flex-col">
        <CardContent className="flex h-full min-h-0 flex-col p-5">
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
            {(['group', 'buyer', 'seller'] as ChatChannel[]).map((ch) => (
              <TabsContent key={ch} value={ch} className="mt-2 min-h-0 flex-1">
                <ChatThread
                  messages={(report.messages ?? []).filter(
                    (m) => m.channel === ch
                  )}
                  emptyLabel={
                    ch === 'group'
                      ? 'No messages yet in the 3-way chat.'
                      : `No private messages with the ${ch} yet. Only you and the ${ch} can see this thread.`
                  }
                  onSend={handleSend}
                  disabled={!isOpen}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ReportDetailPage() {
  return (
    <AppShell title="Report Details">
      <ReportDetailContent />
    </AppShell>
  );
}
