import type { SectionKey } from '@/lib/types';
import {
  LayoutDashboard,
  Package,
  Gavel,
  Wallet,
  BarChart3,
  Users,
  Settings,
  ScrollText,
  Lock, // 🔥 Lock আইকন ইম্পোর্ট করুন
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const NAV_ITEMS: {
  key: SectionKey;
  label: string;
  icon: LucideIcon;
  ownerOnly?: boolean;
}[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'orders', label: 'Order Management', icon: Package },
  { key: 'activeEscrows', label: 'Active Escrows', icon: Lock }, // 🔥 এই লাইনটি যোগ করুন
  { key: 'disputes', label: 'Disputes & Reports', icon: Gavel },
  { key: 'payouts', label: 'Payout Management', icon: Wallet },
  { key: 'finance', label: 'Financial Overview', icon: BarChart3 },
  { key: 'members', label: 'Member Management', icon: Users, ownerOnly: true },
  { key: 'account', label: 'Account Settings', icon: Settings },
  { key: 'audit', label: 'System Audit Log', icon: ScrollText },
];
