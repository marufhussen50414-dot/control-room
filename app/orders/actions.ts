'use server'
import { supabaseAdmin } from '@/lib/supabase'

export async function getOrders() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      price,
      commission_rate,
      commission_amount,
      status,
      created_at,
      listing:listings ( title ),
      buyer:profiles!orders_buyer_id_fkey ( email ),
      seller:profiles!orders_seller_id_fkey ( email )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  // UI-এর জন্য সহজ format করে দিলাম
  return data.map((o: any) => ({
    id: o.id,
    account: o.listing?.title ?? '—',
    buyerEmail: o.buyer?.email ?? o.buyer_id,
    sellerEmail: o.seller?.email ?? o.seller_id,
    amount: o.price,
    fee: o.commission_amount,
    status: o.status,
    createdAt: o.created_at,
  }))
}
