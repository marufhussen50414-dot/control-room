import { supabase } from '@/lib/supabase';
import type { Dispute } from '@/lib/types';

/**
 * Thin sync layer between the app's local state (still the source of
 * truth for instant UI updates) and Supabase (the durable, cross-device
 * store for `profiles` and `disputes`). Every function here is safe to
 * call fire-and-forget: failures are logged to the console and never
 * throw, so a network hiccup never breaks the local UI.
 */

// ---------- profiles ----------

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
    console.error('Supabase: failed to fetch profile', err);
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
    if (error) console.error('Supabase: failed to save profile', error);
  } catch (err) {
    console.error('Supabase: failed to save profile', err);
  }
}

// ---------- disputes ----------

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

/** Returns null on any failure (table missing columns, network, etc). */
export async function fetchDisputesRemote(): Promise<Dispute[] | null> {
  try {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error || !data) {
      if (error) console.error('Supabase: failed to fetch disputes', error);
      return null;
    }
    return (data as DisputeRow[]).map(rowToDispute);
  } catch (err) {
    console.error('Supabase: failed to fetch disputes', err);
    return null;
  }
}

/** One-time seed: pushes local mock disputes into an empty remote table. */
export async function seedDisputesRemote(disputes: Dispute[]) {
  if (disputes.length === 0) return;
  try {
    const { error } = await supabase
      .from('disputes')
      .insert(disputes.map(disputeToRow));
    if (error) console.error('Supabase: failed to seed disputes', error);
  } catch (err) {
    console.error('Supabase: failed to seed disputes', err);
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
    const { error } = await supabase
      .from('disputes')
      .update(row)
      .eq('order_id', orderId);
    if (error) console.error('Supabase: failed to update dispute', error);
  } catch (err) {
    console.error('Supabase: failed to update dispute', err);
  }
}
