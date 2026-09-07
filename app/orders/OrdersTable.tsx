// app/orders/OrdersTable.tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { updateOrderStatus } from './actions'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function OrdersTable({ initialOrders }: { initialOrders: any[] }) {
  const [orders, setOrders] = useState(initialOrders)

  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o))
            )
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const handleStatusChange = async (id: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o)))
    await updateOrderStatus(id, newStatus)
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Order ID</th><th>Buyer</th><th>Seller</th><th>Account</th>
          <th>Amount</th><th>Fee</th><th>Status</th><th>Created</th><th>Update</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id}>
            <td>{o.id.slice(0, 8)}</td>
            <td>{o.buyerEmail}</td>
            <td>{o.sellerEmail}</td>
            <td>{o.account}</td>
            <td>৳ {o.amount}</td>
            <td>৳ {o.fee}</td>
            <td>{o.status}</td>
            <td>{new Date(o.createdAt).toLocaleString()}</td>
            <td>
              <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                <option value="pending">Pending</option>
                <option value="verifying">Verifying</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
