import { supabase } from '@/lib/supabase';
import type {
  AuditEntry,
  Dispute,
  Order,
  PayoutRequest,
  Report,
  User,
} from '@/lib/types';

/**
 * Sync layer between local app state (instant UI, always the source of
 * truth for what's rendered) and Supabase (the durable, cross-device
 * store). Every function here is safe to call fire-and-forget: failures
 * are logged to the console and never throw, so a network hiccup never
 * breaks the local UI — it just won't have synced that one change yet.
 */

function logErr(label: string, err: unknown) {
  console.error(`Supabase: ${label}`, err);
}

// ============================================================
// Members (profiles table)
// ============================================================

type ProfileRow = {
  name: string | null;
  email: string;
  phone: string | null;
  password: string | null;
  role: string | null;
  avatar_color: string | null;
  permissions: unknown;
  payment_methods: unknown;
  metrics: unknown;
  created_at: string | null;
};

function rowToUser(row: ProfileRow, fallbackId: string): User {
  return {
    id: fallbackId,
    name: row.name ?? '',
    email: row.email,
    password: row.password ?? '',
    phone: row.phone ?? '',
    role: (row.role as User['role']) || 'operator',
    avatarColor: row.avatar_color ?? '#2563eb',
    permissions:
      (row.permissions as User['permissions']) ?? ({} as User['permissions']),
    paymentMethods: (row.payment_methods as User['paymentMethods']) ?? {
      bkash: '',
      nagad: '',
      bank: '',
    },
    metrics: (row.metrics as User['metrics']) ?? {
      listingsApproved: 0,
      disputesResolved: 0,
      withdrawalsProcessed: 0,
    },
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

function userToRow(u: User) {
  return {
    name: u.name,
    email: u.email,
    phone: u.phone,
    password: u.password,
    role: u.role,
    avatar_color: u.avatarColor,
    permissions: u.permissions,
    payment_methods: u.paymentMethods,
    metrics: u.metrics,
    created_at: u.createdAt,
    updated_at: new Date().toISOString(),
  };
}

/** Fetch every synced member. Returns null on failure (keep local data). */
export async function fetchMembersRemote(): Promise<
  { email: string; user: Omit<User, 'id'> }[] | null
> {
  try {
    const { data, error } = await supabase.from('profiles').select('*');
    if (error || !data) {
      if (error) logErr('failed to fetch members', error);
      return null;
    }
    return (data as ProfileRow[]).map((row) => ({
      email: row.email,
      user: rowToUser(row, ''),
    }));
  } catch (err) {
    logErr('failed to fetch members', err);
    return null;
  }
}

export async function upsertMemberRemote(user: User) {
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert({ ...userToRow(user) }, { onConflict: 'email' });
    if (error) logErr('failed to save member', error);
  } catch (err) {
    logErr('failed to save member', err);
  }
}

export async function deleteMemberRemote(email: string) {
  try {
    const { error } = await supabase.from('profiles').delete().eq('email', email);
    if (error) logErr('failed to delete member', error);
  } catch (err) {
    logErr('failed to delete member', err);
  }
}

/** Quick single-row check used to gate the "set your name" popup. */
export async function fetchProfileName(email: string): Promise<string | null> {
  if (!email) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('email', email)
      .maybeSingle();
    if (error || !data?.name) return null;
    return data.name;
  } catch (err) {
    logErr('failed to fetch profile name', err);
    return null;
  }
}

export async function upsertProfileName(email: string, name: string) {
  if (!email || !name.trim()) return;
  try {
    const { error } = await supabase
      .from('profiles')
      .upsert(
        { email, name: name.trim(), updated_at: new Date().toISOString() },
        { onConflict: 'email' }
      );
    if (error) logErr('failed to save profile name', error);
  } catch (err) {
    logErr('failed to save profile name', err);
  }
}

// ============================================================
// Orders
// ============================================================

type OrderRow = {
  id: number;
  buyer_email: string | null;
  seller_email: string | null;
  account_title: string | null;
  amount: number | null;
  platform_fee: number | null;
  status: string | null;
  escrow_locked: boolean | null;
  escrow_deadline: string | null;
  created_at: string;
};

function rowToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    buyerEmail: row.buyer_email ?? '',
    sellerEmail: row.seller_email ?? '',
    accountTitle: row.account_title ?? '',
    amount: row.amount ?? 0,
    platformFee: row.platform_fee ?? 0,
    status: (row.status as Order['status']) || 'PENDING',
    escrowLocked: !!row.escrow_locked,
    escrowDeadline: row.escrow_deadline ?? new Date().toISOString(),
    createdAt: row.created_at,
  };
}

function orderToRow(o: Order) {
  return {
    id: o.id,
    buyer_email: o.buyerEmail,
    seller_email: o.sellerEmail,
    account_title: o.accountTitle,
    amount: o.amount,
    platform_fee: o.platformFee,
    status: o.status,
    escrow_locked: o.escrowLocked,
    escrow_deadline: o.escrowDeadline,
    created_at: o.createdAt,
  };
}

export async function fetchOrdersRemote(): Promise<Order[] | null> {
  try {
    const { data, error } = await supabase.from('orders').select('*');
    if (error || !data) {
      if (error) logErr('failed to fetch orders', error);
      return null;
    }
    return (data as OrderRow[]).map(rowToOrder);
  } catch (err) {
    logErr('failed to fetch orders', err);
    return null;
  }
}

export async function seedOrdersRemote(orders: Order[]) {
  if (orders.length === 0) return;
  try {
    const { error } = await supabase.from('orders').insert(orders.map(orderToRow));
    if (error) logErr('failed to seed orders', error);
  } catch (err) {
    logErr('failed to seed orders', err);
  }
}

export async function updateOrderRemote(id: number, patch: Partial<Order>) {
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if (patch.escrowLocked !== undefined) row.escrow_locked = patch.escrowLocked;
  if (patch.escrowDeadline) row.escrow_deadline = patch.escrowDeadline;
  if (Object.keys(row).length === 0) return;
  try {
    const { error } = await supabase.from('orders').update(row).eq('id', id);
    if (error) logErr('failed to update order', error);
  } catch (err) {
    logErr('failed to update order', err);
  }
}

// ============================================================
// Disputes
// ============================================================

type DisputeRow = {
  order_id: number;
  title: string | null;
  status: string | null;
  created_at: string;
  buyer_email: string | null;
  buyer_name: string | null;
  seller_email: string | null;
  seller_name: string | null;
  amount: number | null;
  reason: string | null;
  buyer_evidence: string | null;
  seller_evidence: string | null;
  credentials: string | null;
  attachments: unknown;
  messages: unknown;
};

function rowToDispute(row: DisputeRow): Dispute {
  return {
    orderId: row.order_id,
    buyerEmail: row.buyer_email ?? '',
    buyerName: row.buyer_name ?? '',
    sellerEmail: row.seller_email ?? '',
    sellerName: row.seller_name ?? '',
    accountTitle: row.title ?? '',
    amount: row.amount ?? 0,
    reason: row.reason ?? '',
    buyerEvidence: row.buyer_evidence ?? '',
    sellerEvidence: row.seller_evidence ?? '',
    credentials: row.credentials ?? '',
    attachments: Array.isArray(row.attachments)
      ? (row.attachments as Dispute['attachments'])
      : [],
    messages: Array.isArray(row.messages)
      ? (row.messages as Dispute['messages'])
      : [],
    status: (row.status as Dispute['status']) || 'open',
    createdAt: row.created_at,
  };
}

function disputeToRow(d: Dispute) {
  return {
    order_id: d.orderId,
    title: d.accountTitle,
    status: d.status,
    buyer_email: d.buyerEmail,
    buyer_name: d.buyerName,
    seller_email: d.sellerEmail,
    seller_name: d.sellerName,
    amount: d.amount,
    reason: d.reason,
    buyer_evidence: d.buyerEvidence,
    seller_evidence: d.sellerEvidence,
    credentials: d.credentials,
    attachments: d.attachments,
    messages: d.messages,
    created_at: d.createdAt,
  };
}

export async function fetchDisputesRemote(): Promise<Dispute[] | null> {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) {
      if (error) logErr('failed to fetch disputes', error);
      return null;
    }
    return (data as DisputeRow[]).map(rowToDispute);
  } catch (err) {
    logErr('failed to fetch disputes', err);
    return null;
  }
}

export async function seedDisputesRemote(disputes: Dispute[]) {
  if (disputes.length === 0) return;
  try {
    const { error } = await supabase.from('disputes').insert(disputes.map(disputeToRow));
    if (error) logErr('failed to seed disputes', error);
  } catch (err) {
    logErr('failed to seed disputes', err);
  }
}

export async function updateDisputeRemote(
  orderId: number,
  patch: { messages?: Dispute['messages']; status?: Dispute['status'] }
) {
  const row: Record<string, unknown> = {};
  if (patch.messages) row.messages = patch.messages;
  if (patch.status) row.status = patch.status;
  if (Object.keys(row).length === 0) return;
  try {
    const { error } = await supabase.from('disputes').update(row).eq('order_id', orderId);
    if (error) logErr('failed to update dispute', error);
  } catch (err) {
    logErr('failed to update dispute', err);
  }
}

// ============================================================
// Reports
// ============================================================

type ReportRow = {
  id: string;
  order_id: number | null;
  reported_by: string | null;
  buyer_email: string | null;
  buyer_name: string | null;
  seller_email: string | null;
  seller_name: string | null;
  category: string | null;
  description: string | null;
  attachments: unknown;
  messages: unknown;
  status: string | null;
  created_at: string;
};

function rowToReport(row: ReportRow): Report {
  return {
    id: row.id,
    orderId: row.order_id ?? undefined,
    reportedBy: (row.reported_by as Report['reportedBy']) || 'buyer',
    buyerEmail: row.buyer_email ?? '',
    buyerName: row.buyer_name ?? '',
    sellerEmail: row.seller_email ?? '',
    sellerName: row.seller_name ?? '',
    category: (row.category as Report['category']) || 'other',
    description: row.description ?? '',
    attachments: Array.isArray(row.attachments)
      ? (row.attachments as Report['attachments'])
      : [],
    messages: Array.isArray(row.messages) ? (row.messages as Report['messages']) : [],
    status: (row.status as Report['status']) || 'open',
    createdAt: row.created_at,
  };
}

function reportToRow(r: Report) {
  return {
    id: r.id,
    order_id: r.orderId ?? null,
    reported_by: r.reportedBy,
    buyer_email: r.buyerEmail,
    buyer_name: r.buyerName,
    seller_email: r.sellerEmail,
    seller_name: r.sellerName,
    category: r.category,
    description: r.description,
    attachments: r.attachments,
    messages: r.messages,
    status: r.status,
    created_at: r.createdAt,
  };
}

export async function fetchReportsRemote(): Promise<Report[] | null> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) {
      if (error) logErr('failed to fetch reports', error);
      return null;
    }
    return (data as ReportRow[]).map(rowToReport);
  } catch (err) {
    logErr('failed to fetch reports', err);
    return null;
  }
}

export async function seedReportsRemote(reports: Report[]) {
  if (reports.length === 0) return;
  try {
    const { error } = await supabase.from('reports').insert(reports.map(reportToRow));
    if (error) logErr('failed to seed reports', error);
  } catch (err) {
    logErr('failed to seed reports', err);
  }
}

export async function updateReportRemote(
  reportId: string,
  patch: { messages?: Report['messages']; status?: Report['status'] }
) {
  const row: Record<string, unknown> = {};
  if (patch.messages) row.messages = patch.messages;
  if (patch.status) row.status = patch.status;
  if (Object.keys(row).length === 0) return;
  try {
    const { error } = await supabase.from('reports').update(row).eq('id', reportId);
    if (error) logErr('failed to update report', error);
  } catch (err) {
    logErr('failed to update report', err);
  }
}

// ============================================================
// Payouts
// ============================================================

type PayoutRow = {
  id: number;
  seller_email: string | null;
  amount: number | null;
  method: string | null;
  destination: string | null;
  status: string | null;
  trx_id: string | null;
  created_at: string;
};

function rowToPayout(row: PayoutRow): PayoutRequest {
  return {
    id: row.id,
    sellerEmail: row.seller_email ?? '',
    amount: row.amount ?? 0,
    method: (row.method as PayoutRequest['method']) || 'bKash',
    destination: row.destination ?? '',
    status: (row.status as PayoutRequest['status']) || 'pending',
    trxId: row.trx_id ?? '',
    createdAt: row.created_at,
  };
}

function payoutToRow(p: PayoutRequest) {
  return {
    id: p.id,
    seller_email: p.sellerEmail,
    amount: p.amount,
    method: p.method,
    destination: p.destination,
    status: p.status,
    trx_id: p.trxId,
    created_at: p.createdAt,
  };
}

export async function fetchPayoutsRemote(): Promise<PayoutRequest[] | null> {
  try {
    const { data, error } = await supabase.from('payouts').select('*');
    if (error || !data) {
      if (error) logErr('failed to fetch payouts', error);
      return null;
    }
    return (data as PayoutRow[]).map(rowToPayout);
  } catch (err) {
    logErr('failed to fetch payouts', err);
    return null;
  }
}

export async function seedPayoutsRemote(payouts: PayoutRequest[]) {
  if (payouts.length === 0) return;
  try {
    const { error } = await supabase.from('payouts').insert(payouts.map(payoutToRow));
    if (error) logErr('failed to seed payouts', error);
  } catch (err) {
    logErr('failed to seed payouts', err);
  }
}

export async function updatePayoutRemote(id: number, patch: Partial<PayoutRequest>) {
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if (patch.trxId !== undefined) row.trx_id = patch.trxId;
  if (Object.keys(row).length === 0) return;
  try {
    const { error } = await supabase.from('payouts').update(row).eq('id', id);
    if (error) logErr('failed to update payout', error);
  } catch (err) {
    logErr('failed to update payout', err);
  }
}

// ============================================================
// Audit log
// ============================================================

type AuditRow = {
  id: string;
  user_id: string | null;
  user_name: string | null;
  action: string | null;
  at: string;
};

function rowToAudit(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    userId: row.user_id ?? 'system',
    userName: row.user_name ?? 'System',
    action: row.action ?? '',
    at: row.at,
  };
}

function auditToRow(e: AuditEntry) {
  return {
    id: e.id,
    user_id: e.userId,
    user_name: e.userName,
    action: e.action,
    at: e.at,
  };
}

export async function fetchAuditRemote(): Promise<AuditEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('at', { ascending: false })
      .limit(500);
    if (error || !data) {
      if (error) logErr('failed to fetch audit log', error);
      return null;
    }
    return (data as AuditRow[]).map(rowToAudit);
  } catch (err) {
    logErr('failed to fetch audit log', err);
    return null;
  }
}

export async function seedAuditRemote(entries: AuditEntry[]) {
  if (entries.length === 0) return;
  try {
    const { error } = await supabase.from('audit_log').insert(entries.map(auditToRow));
    if (error) logErr('failed to seed audit log', error);
  } catch (err) {
    logErr('failed to seed audit log', err);
  }
}

export async function insertAuditRemote(entry: AuditEntry) {
  try {
    const { error } = await supabase.from('audit_log').insert(auditToRow(entry));
    if (error) logErr('failed to save audit entry', error);
  } catch (err) {
    logErr('failed to save audit entry', err);
  }
}

// ============================================================
// Settings (single row, id = 1)
// ============================================================

export async function fetchSettingsRemote(): Promise<{ feePercent: number } | null> {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('fee_percent')
      .eq('id', 1)
      .maybeSingle();
    if (error || !data) {
      if (error) logErr('failed to fetch settings', error);
      return null;
    }
    return { feePercent: data.fee_percent ?? 5 };
  } catch (err) {
    logErr('failed to fetch settings', err);
    return null;
  }
}

export async function updateSettingsRemote(feePercent: number) {
  try {
    const { error } = await supabase
      .from('settings')
      .upsert({ id: 1, fee_percent: feePercent }, { onConflict: 'id' });
    if (error) logErr('failed to update settings', error);
  } catch (err) {
    logErr('failed to update settings', err);
  }
}
