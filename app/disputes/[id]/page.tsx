'use client';

import { AppShell } from '@/components/app-shell';
import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Play,
  Users,
  User as UserIcon,
  Store,
  MessageSquare,
  Clock,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useApp } from '@/lib/store';
import { formatBDT, formatDateTime, formatTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Attachment, ChatChannel, DisputeMessage } from '@/lib/types';
import { toast } from 'sonner';

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
}: {
  role: 'Buyer' | 'Seller';
  name: string;
  email: string;
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

function DisputeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { db, addDisputeMessage, resolveDispute } = useApp();
  const [chatChannel, setChatChannel] = React.useState<ChatChannel>('group');

  const id = params?.id as string;
  const orderId = parseInt(id);
  const dispute = db.disputes.find((d) => d.orderId === orderId);

  if (!dispute) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Dispute not found</h2>
          <p className="mt-2 text-muted-foreground">
            Order #{id} does not have an active dispute.
          </p>
          <Button className="mt-4" onClick={() => router.push('/disputes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Disputes
          </Button>
        </div>
      </div>
    );
  }

  const isOpen = dispute.status === 'open';

  const handleSend = (text: string) => {
    addDisputeMessage(dispute.orderId, text, chatChannel);
  };

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/disputes')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Disputes
      </Button>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Dispute #{dispute.orderId}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{dispute.reason}</p>
        </div>
        <Badge
          className={cn(
            'shrink-0 text-sm px-4 py-1.5',
            isOpen
              ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-400'
              : dispute.status === 'resolved_release'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400'
          )}
        >
          {dispute.status === 'open'
            ? 'Open'
            : dispute.status === 'resolved_release'
              ? 'Released to Seller'
              : 'Refunded Buyer'}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <PartyCard role="Buyer" name={dispute.buyerName} email={dispute.buyerEmail} />
        <PartyCard role="Seller" name={dispute.sellerName} email={dispute.sellerEmail} />
      </div>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="rounded-lg border bg-muted/30 p-3 text-sm">
            <span className="text-muted-foreground">Order: </span>
            <span className="font-medium">{dispute.accountTitle}</span>
            <span className="text-muted-foreground"> · {formatBDT(dispute.amount)}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-xs text-muted-foreground">
              {formatDateTime(dispute.createdAt)}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
              <h4 className="mb-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400">
                Buyer Evidence
              </h4>
              <p className="text-sm text-muted-foreground">{dispute.buyerEvidence}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <h4 className="mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Seller Evidence
              </h4>
              <p className="text-sm text-muted-foreground">{dispute.sellerEvidence}</p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-semibold">
              <Eye className="h-3.5 w-3.5" />
              Credential Details
            </h4>
            <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
              {dispute.credentials}
            </pre>
          </div>

          {(dispute.attachments?.length ?? 0) > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">
                Attachments &amp; Screen Recordings
              </h4>
              {dispute.attachments.map((a) => (
                <AttachmentCard key={a.id} a={a} />
              ))}
            </div>
          )}

          {isOpen && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              <Button
                onClick={() => {
                  resolveDispute(dispute.orderId, 'release');
                  toast.success('Funds released to seller');
                }}
              >
                Release to Seller
              </Button>
              <Button
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
                  messages={(dispute.messages ?? []).filter(
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

export default function DisputeDetailPage() {
  return (
    <AppShell>
      <DisputeDetailContent />
    </AppShell>
  );
}
