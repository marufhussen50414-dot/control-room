// app/orders/page.tsx
import { getOrders } from './actions'
import OrdersTable from './OrdersTable'

export default async function OrdersPage() {
  const orders = await getOrders()
  return <OrdersTable initialOrders={orders} />
}
