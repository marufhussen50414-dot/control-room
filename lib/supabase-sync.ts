// ============================================================
// Orders — এখন এটা ব্যবহার হয় না (Order Management পেজ সরাসরি
// useRealOrders() দিয়ে bolt-website-এর real data আনে)। Dashboard ও
// Active Escrows এখনো local demo data দেখায়, তাই এখানে কিছু sync
// করার দরকার নেই — শুধু local seeded data-ই থাকবে।
// ============================================================

export async function fetchOrdersRemote(): Promise<Order[] | null> {
  return null;
}

export async function seedOrdersRemote(_orders: Order[]) {
  // no-op
}

export async function updateOrderRemote(_id: number, _patch: Partial<Order>) {
  // no-op — Order Management পেজ status আপডেট এখন সরাসরি
  // useRealOrders().updateStatus() দিয়ে হয়, এই ফাংশনটা আর ব্যবহার হয় না
}
