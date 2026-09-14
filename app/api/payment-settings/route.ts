import { NextResponse } from 'next/server'
import { boltAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await boltAdmin.from('payment_settings').select('*').eq('id', 1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? { bkash_number: '', nagad_number: '' })
}

export async function PATCH(request: Request) {
  const { bkash_number, nagad_number } = await request.json()
  const { error } = await boltAdmin
    .from('payment_settings')
    .update({ bkash_number, nagad_number, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
