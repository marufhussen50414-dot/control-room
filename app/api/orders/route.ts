import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, listing_id, buyer_id, seller_id, price, commission_amount, status, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const listingIds = [...new Set(orders.map((o) => o.listing_id).filter(Boolean))]
  const userIds = [
    ...new Set(orders.flatMap((o) => [o.buyer_id, o.seller_id]).filter(Boolean)),
  ]

  const [{ data: listings }, { data: profiles }] = await Promise.all([
    listingIds.length
      ? supabaseAdmin.from('listings').select('id, title').in('id', listingIds)
      : Promise.resolve({ data: [] as any[] }),
    userIds.length
      ? supabaseAdmin.from('profiles').select('id, email').in('id', userIds)
      : Promise.resolve({ data: [] as any[] }),
  ])

  const listingMap = new Map((listings ?? []).map((l) => [l.id, l.title]))
  const emailMap = new Map((profiles ?? []).map((p) => [p.id, p.email]))

  const result = orders.map((o) => ({
    id: o.id,
    buyerEmail: emailMap.get(o.buyer_id) ?? '',
    sellerEmail: emailMap.get(o.seller_id) ?? '',
    accountTitle: listingMap.get(o.listing_id) ?? '',
    amount: o.price ?? 0,
    platformFee: o.commission_amount ?? 0,
    status: String(o.status || 'PENDING').toUpperCase(),
    escrowLocked: false,
    escrowDeadline: o.created_at,
    createdAt: o.created_at,
  }))

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const { id, patch } = await request.json()
  const row: Record<string, unknown> = {}
  if (patch?.status) row.status = String(patch.status).toLowerCase()

  const { error } = await supabaseAdmin.from('orders').update(row).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
