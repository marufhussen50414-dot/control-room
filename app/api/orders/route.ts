import { NextResponse } from 'next/server'
import { boltAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await boltAdmin
    .from('orders')
    .select(
      '*, buyer:buyer_id(username, full_name), seller:seller_id(username, full_name), game_listings(title, game_name)'
    )
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const { id, patch } = await request.json()
  const { error } = await boltAdmin.from('orders').update(patch).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
