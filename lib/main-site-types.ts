// Types matching the MAIN marketplace website's real `profiles` and
// `orders` tables exactly (confirmed directly from its live schema —
// see the admin-access-migration.sql conversation). Keep these in sync
// with that schema if it changes.

export type MainSiteProfile = {
  id: string;
  username: string | null;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  trust_score: number;
  total_sales: number;
  total_purchases: number;
  is_verified: boolean;
  is_banned: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  location: string | null;
  discord: string | null;
  whatsapp: string | null;
  preferred_payment: string | null;
  bkash_number: string | null;
  nagad_number: string | null;
  is_online: boolean;
  last_seen: string;
  response_rate: number;
  total_earnings: number;
  items_sold: number;
};

export type MainSiteOrderStatus =
  | 'pending'
  | 'paid'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export type MainSiteOrder = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  price: number;
  commission_rate: number;
  commission_amount: number;
  seller_amount: number;
  payment_method: 'bkash' | 'nagad' | 'card';
  payment_number: string | null;
  status: MainSiteOrderStatus;
  escrow_released: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // Escrow / delivery / dispute columns added by admin-access-migration.sql
  delivery_password: string | null;
  delivery_video_url: string | null;
  delivered_at: string | null;
  buyer_confirm_deadline: string | null;
  buyer_video_url: string | null;
  dispute_reason: string | null;
  dispute_opened_at: string | null;
  admin_notes: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  // Buyer/Seller roadmap progress. One shared value — see lib/workflow.ts.
  // Nullable so existing rows created before this column existed still load.
  workflow_status: string | null;
  // Set automatically the moment workflow_status becomes 'step5_released'.
  // Drives the 72-hour "still visible on the main site" grace window.
  workflow_completed_at: string | null;
  // Fixed, permanent, human-friendly order code (10 chars). Generated once
  // by a DB trigger on insert — never regenerated, always unique.
  order_number: string;
  // Joined in via foreign-table select, not a real column.
  buyer?: { username: string | null; full_name: string; phone: string | null; whatsapp: string | null; email?: string } | null;
  seller?: { username: string | null; full_name: string; phone: string | null; whatsapp: string | null; email?: string } | null;
  game_listings?: { title: string; game_name: string } | null;
};
