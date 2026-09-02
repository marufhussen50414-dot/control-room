export type Role = 'owner' | 'admin' | 'operator';

export type SectionKey =
  | 'dashboard'
  | 'orders'
  | 'activeEscrows' // 🔥 নতুন যোগ করা হয়েছে
  | 'disputes'
  | 'payouts'
  | 'finance'
  | 'members'
  | 'account'
  | 'audit';

export type Permissions = Record<SectionKey, boolean>;

export type PaymentMethods = {
  bkash: string;
  nagad: string;
  bank: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  role: Role;
  avatarColor: string;
  permissions: Permissions;
  paymentMethods: PaymentMethods;
  metrics: {
    listingsApproved: number;
    disputesResolved: number;
    withdrawalsProcessed: number;
  };
  createdAt: string;
};

export type OrderStatus =
  | 'PENDING'
  | 'VERIFYING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'DISPUTED';

export type Order = {
  id: number;
  buyerEmail: string;
  sellerEmail: string;
  accountTitle: string;
  amount: number;
  platformFee: number;
  status: OrderStatus;
  escrowLocked: boolean;
  escrowDeadline: string;
  createdAt: string;
};

export type ChatChannel = 'group' | 'buyer' | 'seller';

export type DisputeMessage = {
  id: string;
  author: 'buyer' | 'seller' | 'admin';
  authorName: string;
  text: string;
  at: string;
  channel: ChatChannel;
};

export type Attachment = {
  id: string;
  kind: 'recording' | 'image' | 'file';
  label: string;
  url: string;
  durationSec?: number;
  uploadedBy: 'buyer' | 'seller';
};

export type Dispute = {
  orderId: number;
  buyerEmail: string;
  buyerName: string;
  sellerEmail: string;
  sellerName: string;
  accountTitle: string;
  amount: number;
  reason: string;
  buyerEvidence: string;
  sellerEvidence: string;
  credentials: string;
  attachments: Attachment[];
  messages: DisputeMessage[];
  status: 'open' | 'resolved_release' | 'resolved_refund';
  createdAt: string;
};

export type ReportCategory =
  | 'scam'
  | 'fake_listing'
  | 'abusive_behavior'
  | 'account_recovered'
  | 'other';

export type Report = {
  id: string;
  orderId?: number;
  reportedBy: 'buyer' | 'seller';
  buyerEmail: string;
  buyerName: string;
  sellerEmail: string;
  sellerName: string;
  category: ReportCategory;
  description: string;
  attachments: Attachment[];
  messages: DisputeMessage[];
  status: 'open' | 'resolved_warning' | 'resolved_banned' | 'dismissed';
  createdAt: string;
};

export type PayoutRequest = {
  id: number;
  sellerEmail: string;
  amount: number;
  method: 'bKash' | 'Nagad' | 'Bank';
  destination: string;
  status: 'pending' | 'approved' | 'rejected';
  trxId: string;
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  userId: string;
  userName: string;
  action: string;
  at: string;
};

export type PlatformSettings = {
  feePercent: number;
};
