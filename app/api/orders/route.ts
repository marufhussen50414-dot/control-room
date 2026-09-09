import { NextResponse } from 'next/server'
import { boltAdmin } from '@/lib/supabase'

export async function GET() {
  const { data: orders, error } = await boltAdmin
    .from('orders')
    .select(
      '*, buyer:buyer_id(username, full_name, phone, whatsapp), seller:seller_id(username, full_name, phone, whatsapp), game_listings(title, game_name)'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const userIds = Array.from(
    new Set((orders ?? []).flatMap((o: any) => [o.buyer_id, o.seller_id]).filter(Boolean))
  )

  const emailEntries = await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await boltAdmin.auth.admin.getUserById(uid as string)
      return [uid, data.user?.email ?? ''] as const
    })
  )
  const emailMap = new Map(emailEntries)

  const result = (orders ?? []).map((o: any) => ({
    ...o,
    buyer: o.buyer ? { ...o.buyer, email: emailMap.get(o.buyer_id) ?? '' } : null,
    seller: o.seller ? { ...o.seller, email: emailMap.get(o.seller_id) ?? '' } : null,
  }))

  return NextResponse.json(result)
}

export async function PATCH(request: Request) {
  const { id, patch } = await request.json()
  const { error } = await boltAdmin.from('orders').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
