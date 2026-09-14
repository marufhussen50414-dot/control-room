import { NextResponse } from 'next/server'
import { boltAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await boltAdmin
    .from('payment_confirmations')
    .select(
      '*, order:order_id(id, order_number, listing_id, status, workflow_status, seller_id, game_listings(title))'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const buyerIds = Array.from(new Set((data ?? []).map((p: any) => p.buyer_id).filter(Boolean)))
  const { data: buyers } = buyerIds.length
    ? await boltAdmin.from('profiles').select('id, profile_id, full_name, username, phone').in('id', buyerIds)
    : { data: [] as any[] }
  const buyerMap = new Map((buyers ?? []).map((b: any) => [b.id, b]))

  const emailEntries = await Promise.all(
    buyerIds.map(async (uid) => {
      const { data } = await boltAdmin.auth.admin.getUserById(uid as string)
      return [uid, data.user?.email ?? ''] as const
    })
  )
  const emailMap = new Map(emailEntries)

  const result = (data ?? []).map((p: any) => ({
    ...p,
    buyer: buyerMap.has(p.buyer_id) ? { ...buyerMap.get(p.buyer_id), email: emailMap.get(p.buyer_id) ?? '' } : null,
  }))

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const { id, adminTnxId } = await request.json()

  const { data: confirmation, error: fetchErr } = await boltAdmin
    .from('payment_confirmations')
    .select('order_id')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !confirmation) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Not found' }, { status: 404 })
  }

  const { error: confirmErr } = await boltAdmin
    .from('payment_confirmations')
    .update({ admin_tnx_id: adminTnxId, status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', id)
  if (confirmErr) return NextResponse.json({ error: confirmErr.message }, { status: 500 })

  const { error: orderErr } = await boltAdmin
    .from('orders')
    .update({ status: 'paid', workflow_status: 'step1_paid' })
    .eq('id', confirmation.order_id)
  if (orderErr) return NextResponse.json({ error: orderErr.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
