import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('id, buyer_email, seller_email, account_title, amount, platform_fee, status, escrow_locked, escrow_deadline, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (data ?? []).map((o) => ({
    id: o.id,
    buyerEmail: o.buyer_email ?? '',
    sellerEmail: o.seller_email ?? '',
    accountTitle: o.account_title ?? '',
    amount: o.amount ?? 0,
    platformFee: o.platform_fee ?? 0,
    status: o.status ?? 'PENDING',
    escrowLocked: o.escrow_locked ?? false,
    escrowDeadline: o.escrow_deadline,
    createdAt: o.created_at,
  }))

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const { id, patch } = await request.json()
  const row: Record<string, unknown> = {}
  if (patch?.status) row.status = patch.status

  const { error } = await supabaseAdmin.from('orders').update(row).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
