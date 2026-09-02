import type {
  AuditEntry,
  Dispute,
  Order,
  PayoutRequest,
  Permissions,
  PlatformSettings,
  Report,
  SectionKey,
  User,
} from '@/lib/types';
import { OWNER_CONFIG } from '@/src/config/ownerConfig';

export const ALL_SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'orders', label: 'Order Management' },
  { key: 'activeEscrows', label: 'Active Escrows' }, // 🔥 নতুন যোগ করা হয়েছে
  { key: 'disputes', label: 'Disputes & Reports' },
  { key: 'payouts', label: 'Payout Management' },
  { key: 'finance', label: 'Financial Overview' },
  { key: 'members', label: 'Member Management' },
  { key: 'account', label: 'Account Settings' },
  { key: 'audit', label: 'System Audit Log' },
];

export const AVATAR_COLORS = [
  '#2563eb',
  '#059669',
  '#d97706',
  '#dc2626',
  '#7c3aed',
  '#0891b2',
  '#db2777',
  '#4f46e5',
];

export function fullPermissions(): Permissions {
  return ALL_SECTIONS.reduce(
    (acc, s) => ({ ...acc, [s.key]: true }),
    {} as Permissions
  );
}

const now = Date.now();
const hours = (n: number) => new Date(now + n * 3600000).toISOString();

export function seedOwner(): User {
  return {
    id: 'owner-001',
    name: 'Maruf Hussen',
    email: OWNER_CONFIG.email,
    password: OWNER_CONFIG.password,
    phone: '+8801700000000',
    role: 'owner',
    avatarColor: '#2563eb',
    permissions: fullPermissions(),
    paymentMethods: { bkash: '', nagad: '', bank: '' },
    metrics: { listingsApproved: 0, disputesResolved: 0, withdrawalsProcessed: 0 },
    createdAt: new Date(now - 90 * 86400000).toISOString(),
  };
}

export function seedAdmin(): User {
  return {
    id: 'admin-001',
    name: 'Sadia Rahman',
    email: 'admin@gamehaatbd.com',
    password: 'admin123',
    phone: '+8801711111111',
    role: 'admin',
    avatarColor: '#059669',
    permissions: { 
      ...fullPermissions(), 
      members: false, 
      audit: false 
    },
    paymentMethods: { bkash: '01711111111', nagad: '', bank: '' },
    metrics: { listingsApproved: 42, disputesResolved: 7, withdrawalsProcessed: 18 },
    createdAt: new Date(now - 30 * 86400000).toISOString(),
  };
}

export function seedOperators(): User[] {
  return [
    {
      id: 'op-001',
      name: 'Tanvir Ahmed',
      email: 'tanvir@gamehaatbd.com',
      password: 'op123',
      phone: '+8801822222222',
      role: 'operator',
      avatarColor: '#d97706',
      permissions: {
        dashboard: true,
        orders: true,
        activeEscrows: true, // 🔥 যোগ করা হয়েছে
        disputes: true,
        payouts: false,
        finance: false,
        members: false,
        account: true,
        audit: false,
      },
      paymentMethods: { bkash: '01822222222', nagad: '', bank: '' },
      metrics: { listingsApproved: 15, disputesResolved: 2, withdrawalsProcessed: 0 },
      createdAt: new Date(now - 14 * 86400000).toISOString(),
    },
    {
      id: 'op-002',
      name: 'Nusrat Jahan',
      email: 'nusrat@gamehaatbd.com',
      password: 'op123',
      phone: '+8801833333333',
      role: 'operator',
      avatarColor: '#db2777',
      permissions: {
        dashboard: true,
        orders: true,
        activeEscrows: true, // 🔥 যোগ করা হয়েছে
        disputes: false,
        payouts: true,
        finance: false,
        members: false,
        account: true,
        audit: false,
      },
      paymentMethods: { bkash: '', nagad: '01833333333', bank: '' },
      metrics: { listingsApproved: 8, disputesResolved: 0, withdrawalsProcessed: 12 },
      createdAt: new Date(now - 7 * 86400000).toISOString(),
    },
  ];
}

export function seedOrders(): Order[] {
  const base: Omit<Order, 'id' | 'platformFee'>[] = [
    { buyerEmail: 'buyer1@gmail.com', sellerEmail: 'seller1@gmail.com', accountTitle: 'Garena Free Fire ID (Lv 75)', amount: 4500, status: 'PENDING', escrowLocked: true, escrowDeadline: hours(20), createdAt: hours(-2) },
    { buyerEmail: 'buyer2@gmail.com', sellerEmail: 'seller2@gmail.com', accountTitle: 'PUBG Mobile (Conqueror)', amount: 8200, status: 'VERIFYING', escrowLocked: true, escrowDeadline: hours(8), createdAt: hours(-5) },
    { buyerEmail: 'buyer3@gmail.com', sellerEmail: 'seller3@gmail.com', accountTitle: 'Clash of Clans TH14', amount: 6700, status: 'COMPLETED', escrowLocked: false, escrowDeadline: hours(-12), createdAt: hours(-48) },
    { buyerEmail: 'buyer4@gmail.com', sellerEmail: 'seller4@gmail.com', accountTitle: 'Valorant Account (Diamond)', amount: 12000, status: 'DISPUTED', escrowLocked: true, escrowDeadline: hours(48), createdAt: hours(-10) },
    { buyerEmail: 'buyer5@gmail.com', sellerEmail: 'seller5@gmail.com', accountTitle: 'Mobile Legends Mythic', amount: 5300, status: 'CANCELLED', escrowLocked: false, escrowDeadline: hours(-30), createdAt: hours(-72) },
    { buyerEmail: 'buyer6@gmail.com', sellerEmail: 'seller6@gmail.com', accountTitle: 'Call of Duty Mobile (Legendary)', amount: 9100, status: 'PENDING', escrowLocked: true, escrowDeadline: hours(14), createdAt: hours(-1) },
    { buyerEmail: 'buyer7@gmail.com', sellerEmail: 'seller7@gmail.com', accountTitle: 'Free Fire (Lv 60)', amount: 3200, status: 'COMPLETED', escrowLocked: false, escrowDeadline: hours(-50), createdAt: hours(-96) },
    { buyerEmail: 'buyer8@gmail.com', sellerEmail: 'seller8@gmail.com', accountTitle: 'PUBG Mobile (Crown)', amount: 4800, status: 'VERIFYING', escrowLocked: true, escrowDeadline: hours(6), createdAt: hours(-7) },
  ];
  return base.map((o, i) => ({
    ...o,
    id: 10000 + i,
    platformFee: Math.round(o.amount * 0.08),
  }));
}

const SAMPLE_RECORDING =
  'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

export function seedDisputes(): Dispute[] {
  return [
    {
      orderId: 10003,
      buyerEmail: 'buyer4@gmail.com',
      buyerName: 'Rakib Hasan',
      sellerEmail: 'seller4@gmail.com',
      sellerName: 'Imran Kabir',
      accountTitle: 'Valorant Account (Diamond)',
      amount: 12000,
      reason: 'Account locked after handover',
      buyerEvidence:
        'Screen recording showing the account gets locked right after login. The seller did not provide the recovery email as promised.',
      sellerEvidence:
        'Buyer changed the password and email before reporting. Original credentials were working at handover time.',
      credentials:
        'Email: valorantseller@gmail.com\nPassword: s3llerp@ss\nRecovery: sellerbackup@gmail.com',
      attachments: [
        {
          id: 'att1',
          kind: 'recording',
          label: 'Login attempt — account locked',
          url: SAMPLE_RECORDING,
          durationSec: 46,
          uploadedBy: 'buyer',
        },
      ],
      messages: [
        { id: 'm1', channel: 'group', author: 'buyer', authorName: 'Rakib Hasan', text: 'The account is locked. I want a refund.', at: hours(-9) },
        { id: 'm2', channel: 'group', author: 'seller', authorName: 'Imran Kabir', text: 'I gave working credentials. Buyer changed them.', at: hours(-8) },
        { id: 'm3', channel: 'group', author: 'admin', authorName: 'Sadia Rahman', text: 'Reviewing evidence from both sides.', at: hours(-7) },
        { id: 'm4', channel: 'buyer', author: 'admin', authorName: 'Sadia Rahman', text: 'Can you send the exact time you tried logging in?', at: hours(-6) },
        { id: 'm5', channel: 'buyer', author: 'buyer', authorName: 'Rakib Hasan', text: 'Around 9:40 PM last night, right after payment.', at: hours(-6) },
        { id: 'm6', channel: 'seller', author: 'admin', authorName: 'Sadia Rahman', text: 'Did you change the password after the sale?', at: hours(-5) },
        { id: 'm7', channel: 'seller', author: 'seller', authorName: 'Imran Kabir', text: 'No, I handed it over as-is. Buyer must have 2FA issues.', at: hours(-5) },
      ],
      status: 'open',
      createdAt: hours(-10),
    },
  ];
}

export function seedReports(): Report[] {
  return [
    {
      id: 'r1',
      orderId: 10005,
      reportedBy: 'buyer',
      buyerEmail: 'buyer5@gmail.com',
      buyerName: 'Farhan Sarker',
      sellerEmail: 'seller5@gmail.com',
      sellerName: 'Jahid Islam',
      category: 'scam',
      description:
        'Seller took payment outside escrow and never delivered the Mobile Legends Mythic account.',
      attachments: [
        {
          id: 'att2',
          kind: 'recording',
          label: 'Chat screen recording with seller',
          url: SAMPLE_RECORDING,
          durationSec: 32,
          uploadedBy: 'buyer',
        },
      ],
      messages: [
        { id: 'rm1', channel: 'group', author: 'buyer', authorName: 'Farhan Sarker', text: 'This seller scammed me, please ban him.', at: hours(-70) },
        { id: 'rm2', channel: 'buyer', author: 'admin', authorName: 'Sadia Rahman', text: 'We are investigating this report. Can you share the payment proof?', at: hours(-69) },
      ],
      status: 'open',
      createdAt: hours(-71),
    },
    {
      id: 'r2',
      reportedBy: 'seller',
      buyerEmail: 'buyer2@gmail.com',
      buyerName: 'Sabbir Rahman',
      sellerEmail: 'seller2@gmail.com',
      sellerName: 'Mehedi Hasan',
      category: 'abusive_behavior',
      description:
        'Buyer sent abusive and threatening messages after a normal price negotiation.',
      attachments: [],
      messages: [
        { id: 'rm3', channel: 'group', author: 'seller', authorName: 'Mehedi Hasan', text: 'Buyer is threatening me over chat, screenshots attached to my evidence.', at: hours(-3) },
      ],
      status: 'open',
      createdAt: hours(-3),
    },
  ];
}

export function seedPayouts(): PayoutRequest[] {
  return [
    { id: 20001, sellerEmail: 'seller3@gmail.com', amount: 6164, method: 'bKash', destination: '01733333333', status: 'pending', trxId: '', createdAt: hours(-20) },
    { id: 20002, sellerEmail: 'seller7@gmail.com', amount: 2944, method: 'Nagad', destination: '01844444444', status: 'pending', trxId: '', createdAt: hours(-5) },
    { id: 20003, sellerEmail: 'seller1@gmail.com', amount: 12400, method: 'Bank', destination: 'City Bank - 1234567890', status: 'approved', trxId: 'TRX8X2K9P', createdAt: hours(-100) },
  ];
}

export function seedAudit(): AuditEntry[] {
  return [
    { id: 'a1', userId: 'admin-001', userName: 'Sadia Rahman', action: 'Approved Listing #10004', at: hours(-6) },
    { id: 'a2', userId: 'op-001', userName: 'Tanvir Ahmed', action: 'Resolved Dispute on Order #10003', at: hours(-12) },
    { id: 'a3', userId: 'op-002', userName: 'Nusrat Jahan', action: 'Processed Payout #20003 (৳12,400)', at: hours(-100) },
    { id: 'a4', userId: 'owner-001', userName: 'Maruf Hussen', action: 'Adjusted platform fee to 8%', at: hours(-200) },
  ];
}

export function seedSettings(): PlatformSettings {
  return { feePercent: 8 };
}
