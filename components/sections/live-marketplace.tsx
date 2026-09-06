'use client';

import * as React from 'react';
import {
  Globe,
  Search,
  ShieldCheck,
  Ban,
  BadgeCheck,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { mainSiteSupabase } from '@/lib/main-site-supabase';
import type { MainSiteOrder, MainSiteProfile } from '@/lib/main-site-types';

function formatBDT(n: number) {
  return `৳ ${n.toLocaleString('en-BD')}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-BD', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  paid: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  delivering: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  cancelled: 'bg-muted text-muted-foreground',
  disputed: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
};

// ---------------------------------------------------------------
// Sign-in gate: the owner authenticates with their REAL main-site
// account (Supabase Auth). RLS then recognizes them as admin and
// every read/write below works — no secret key ever touches this app.
// ---------------------------------------------------------------
function SignInGate({ onSignedIn }: { onSignedIn: () => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    const { error: signInError } = await mainSiteSupabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    toast.success('Connected to the live marketplace');
    onSignedIn();
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Connect to Live Marketplace</h3>
            <p className="text-xs text-muted-foreground">
              Sign in with your real GameHaatBD account.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" onClick={submit} disabled={loading}>
          {loading ? 'Connecting…' : 'Connect'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Only an account with admin access on the live site can see or
          change anything here — your permissions are enforced by the
          database itself, not by this panel.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------
// Users tab
// ---------------------------------------------------------------
function LiveUsers() {
  const [users, setUsers] = React.useState<MainSiteProfile[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await mainSiteSupabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(`Failed to load users: ${error.message}`);
      return;
    }
    setUsers((data as MainSiteProfile[]) ?? []);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const toggleBan = async (u: MainSiteProfile) => {
    const { error } = await mainSiteSupabase
      .from('profiles')
      .update({ is_banned: !u.is_banned })
      .eq('id', u.id);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success(u.is_banned ? 'User unbanned' : 'User banned');
    setUsers((prev) =>
      prev.map((p) => (p.id === u.id ? { ...p, is_banned: !p.is_banned } : p))
    );
  };

  const toggleVerified = async (u: MainSiteProfile) => {
    const { error } = await mainSiteSupabase
      .from('profiles')
      .update({ is_verified: !u.is_verified })
      .eq('id', u.id);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success(u.is_verified ? 'Verification removed' : 'User verified');
    setUsers((prev) =>
      prev.map((p) =>
        p.id === u.id ? { ...p, is_verified: !p.is_verified } : p
      )
    );
  };

  const q = query.toLowerCase().trim();
  const filtered = users.filter((u) => {
    if (!q) return true;
    return (
      (u.username ?? '').toLowerCase().includes(q) ||
      u.full_name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by username or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-3">
        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading real users…
          </p>
        )}
        {!loading && filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No users found.
          </p>
        )}
        {filtered.map((u) => (
          <Card key={u.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{u.full_name}</p>
                  {u.username && (
                    <span className="text-xs text-muted-foreground">
                      @{u.username}
                    </span>
                  )}
                  {u.is_verified && (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      Verified
                    </Badge>
                  )}
                  {u.is_banned && (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
                      Banned
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {u.total_sales} sales · {u.total_purchases} purchases ·
                  Trust {u.trust_score} · Joined {formatDate(u.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleVerified(u)}
                >
                  <BadgeCheck className="mr-1.5 h-3.5 w-3.5" />
                  {u.is_verified ? 'Unverify' : 'Verify'}
                </Button>
                <Button
                  size="sm"
                  variant={u.is_banned ? 'outline' : 'destructive'}
                  onClick={() => toggleBan(u)}
                >
                  {u.is_banned ? (
                    <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                  ) : (
                    <Ban className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {u.is_banned ? 'Unban' : 'Ban'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Orders tab
// ---------------------------------------------------------------
function LiveOrders() {
  const [orders, setOrders] = React.useState<MainSiteOrder[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [notesDraft, setNotesDraft] = React.useState<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    const { data, error } = await mainSiteSupabase
      .from('orders')
      .select(
        '*, buyer:buyer_id(username, full_name), seller:seller_id(username, full_name), game_listings(title, game_name)'
      )
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) {
      toast.error(`Failed to load orders: ${error.message}`);
      return;
    }
    setOrders((data as unknown as MainSiteOrder[]) ?? []);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const resolveDispute = async (
    order: MainSiteOrder,
    verdict: 'completed' | 'refunded'
  ) => {
    const { data: userData } = await mainSiteSupabase.auth.getUser();
    const { error } = await mainSiteSupabase
      .from('orders')
      .update({
        status: verdict,
        escrow_released: verdict === 'completed',
        admin_notes: notesDraft[order.id] ?? order.admin_notes,
        resolved_at: new Date().toISOString(),
        resolved_by: userData.user?.id ?? null,
      })
      .eq('id', order.id);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success(
      verdict === 'completed'
        ? 'Order released to seller'
        : 'Order refunded to buyer'
    );
    load();
  };

  const saveNotes = async (order: MainSiteOrder) => {
    const notes = notesDraft[order.id];
    if (notes === undefined) return;
    const { error } = await mainSiteSupabase
      .from('orders')
      .update({ admin_notes: notes })
      .eq('id', order.id);
    if (error) {
      toast.error(`Failed: ${error.message}`);
      return;
    }
    toast.success('Notes saved');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="grid gap-3">
        {loading && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Loading real orders…
          </p>
        )}
        {!loading && orders.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No orders found.
          </p>
        )}
        {orders.map((o) => (
          <Card key={o.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {o.game_listings?.title ?? 'Listing'}{' '}
                    <span className="text-xs text-muted-foreground">
                      ({o.game_listings?.game_name})
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.buyer?.full_name ?? o.buyer_id} (buyer) vs{' '}
                    {o.seller?.full_name ?? o.seller_id} (seller) ·{' '}
                    {formatBDT(o.price)} · {formatDate(o.created_at)}
                  </p>
                </div>
                <Badge
                  className={
                    ORDER_STATUS_STYLE[o.status] ??
                    'bg-muted text-muted-foreground'
                  }
                >
                  {o.status}
                </Badge>
              </div>

              {o.status === 'disputed' && o.dispute_reason && (
                <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 text-sm dark:border-red-500/20 dark:bg-red-500/5">
                  <span className="font-semibold text-red-700 dark:text-red-400">
                    Dispute reason:{' '}
                  </span>
                  <span className="text-muted-foreground">
                    {o.dispute_reason}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs">Admin notes</Label>
                <Textarea
                  rows={2}
                  value={notesDraft[o.id] ?? o.admin_notes ?? ''}
                  onChange={(e) =>
                    setNotesDraft((s) => ({ ...s, [o.id]: e.target.value }))
                  }
                  onBlur={() => saveNotes(o)}
                  placeholder="Internal notes about this order…"
                />
              </div>

              {(o.status === 'disputed' || o.status === 'delivering') && (
                <div className="flex gap-2 border-t pt-3">
                  <Button size="sm" onClick={() => resolveDispute(o, 'completed')}>
                    Release to Seller
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => resolveDispute(o, 'refunded')}
                  >
                    Refund Buyer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------
// Top-level section
// ---------------------------------------------------------------
export function LiveMarketplace() {
  const [signedIn, setSignedIn] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [adminEmail, setAdminEmail] = React.useState('');

  React.useEffect(() => {
    mainSiteSupabase.auth.getUser().then(({ data }) => {
      setSignedIn(!!data.user);
      setAdminEmail(data.user?.email ?? '');
      setChecking(false);
    });
  }, []);

  const disconnect = async () => {
    await mainSiteSupabase.auth.signOut();
    setSignedIn(false);
    toast('Disconnected from live marketplace');
  };

  if (checking) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Checking connection…
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Live Marketplace
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real users and orders from the live GameHaatBD website.
          </p>
        </div>
        {signedIn && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              Connected as {adminEmail}
            </span>
            <Button variant="outline" size="sm" onClick={disconnect}>
              <LogOut className="mr-1.5 h-3.5 w-3.5" />
              Disconnect
            </Button>
          </div>
        )}
      </div>

      {!signedIn ? (
        <SignInGate onSignedIn={() => setSignedIn(true)} />
      ) : (
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-4">
            <LiveUsers />
          </TabsContent>
          <TabsContent value="orders" className="mt-4">
            <LiveOrders />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
