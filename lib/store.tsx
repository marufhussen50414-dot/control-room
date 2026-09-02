'use client';

import * as React from 'react';
import { toast } from 'sonner';
import type {
  AuditEntry,
  ChatChannel,
  Dispute,
  DisputeMessage,
  Order,
  OrderStatus,
  PayoutRequest,
  Permissions,
  PlatformSettings,
  Report,
  Role,
  User,
} from '@/lib/types';
import { uid } from '@/lib/format';
import {
  ALL_SECTIONS,
  AVATAR_COLORS,
  seedAdmin,
  seedAudit,
  seedDisputes,
  seedOrders,
  seedOwner,
  seedOperators,
  seedPayouts,
  seedReports,
  seedSettings,
} from '@/lib/mock-data';
import { OWNER_CONFIG } from '@/src/config/ownerConfig';
import {
  fetchDisputesRemote,
  fetchProfileName,
  seedDisputesRemote,
  updateDisputeRemote,
  upsertProfileName,
} from '@/lib/supabase-sync';

const STORAGE_KEY = 'gamehaatbd_control_room_v2';
const SESSION_KEY = 'gamehaatbd_session_user_id';

type DBShape = {
  users: User[];
  orders: Order[];
  disputes: Dispute[];
  reports: Report[];
  payouts: PayoutRequest[];
  audit: AuditEntry[];
  settings: PlatformSettings;
  ownerNameSet: boolean;
  nextOrderId: number;
  nextPayoutId: number;
};

function freshDB(): DBShape {
  return {
    users: [seedOwner(), seedAdmin(), ...seedOperators()],
    orders: seedOrders(),
    disputes: seedDisputes(),
    reports: seedReports(),
    payouts: seedPayouts(),
    audit: seedAudit(),
    settings: seedSettings(),
    ownerNameSet: true,
    nextOrderId: 10008,
    nextPayoutId: 20004,
  };
}

function loadDB(): DBShape {
  if (typeof window === 'undefined') return freshDB();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const db = freshDB();
      // first run: owner hasn't set display name yet
      db.ownerNameSet = false;
      const owner = db.users.find((u) => u.role === 'owner');
      if (owner) owner.name = '';
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
      return db;
    }
    const parsed = JSON.parse(raw) as Partial<DBShape>;
    // Migrate/guard against older saved sessions with an incompatible shape
    // (e.g. disputes without `attachments`, or missing `reports` entirely).
    const fresh = freshDB();
    const disputesValid =
      Array.isArray(parsed.disputes) &&
      parsed.disputes.every(
        (d) => Array.isArray(d?.attachments) && Array.isArray(d?.messages)
      );
    const reportsValid =
      Array.isArray(parsed.reports) &&
      parsed.reports.every(
        (r) => Array.isArray(r?.attachments) && Array.isArray(r?.messages)
      );
    return {
      ...fresh,
      ...parsed,
      disputes: disputesValid ? parsed.disputes! : fresh.disputes,
      reports: reportsValid ? parsed.reports! : fresh.reports,
    };
  } catch {
    return freshDB();
  }
}

function saveDB(db: DBShape) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

export function emptyPermissions(): Permissions {
  return ALL_SECTIONS.reduce(
    (acc, s) => ({ ...acc, [s.key]: false }),
    {} as Permissions
  );
}

type AppContextType = {
  db: DBShape;
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setOwnerDisplayName: (name: string) => void;
  updateProfile: (patch: Partial<User>) => void;
  changePassword: (current: string, next: string) => boolean;
  addMember: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    permissions: Permissions;
  }) => void;
  updateMember: (id: string, patch: Partial<User>) => void;
  removeMember: (id: string) => void;
  updateOrderStatus: (id: number, status: OrderStatus) => void;
  releaseEscrow: (id: number) => void;
  extendEscrow: (id: number, hours: number) => void;
  addDisputeMessage: (orderId: number, text: string, channel: ChatChannel) => void;
  resolveDispute: (orderId: number, verdict: 'release' | 'refund') => void;
  addReportMessage: (reportId: string, text: string, channel: ChatChannel) => void;
  resolveReport: (
    reportId: string,
    verdict: 'warning' | 'banned' | 'dismissed'
  ) => void;
  approvePayout: (id: number, trxId: string) => void;
  rejectPayout: (id: number) => void;
  setFeePercent: (n: number) => void;
  log: (action: string) => void;
};

const AppContext = React.createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = React.useState(false);
  const [db, setDb] = React.useState<DBShape>(() => freshDB());
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const local = loadDB();
    setDb(local);
    setCurrentUserId(localStorage.getItem(SESSION_KEY));

    // Cross-device owner name: check Supabase `profiles` before revealing
    // the UI, so the "set your name" popup never flashes if another
    // device already saved one for this email.
    (async () => {
      const owner = local.users.find((u) => u.role === 'owner');
      if (owner) {
        const remoteName = await fetchProfileName(owner.email);
        if (remoteName && remoteName.trim()) {
          setDb((prev) => {
            const next = {
              ...prev,
              ownerNameSet: true,
              users: prev.users.map((u) =>
                u.id === owner.id ? { ...u, name: remoteName } : u
              ),
            };
            saveDB(next);
            return next;
          });
        }
      }
      setHydrated(true);
    })();

    // Disputes: source of truth becomes Supabase once it has data; on a
    // brand-new empty table, push the local mock disputes up once.
    (async () => {
      const remoteDisputes = await fetchDisputesRemote();
      if (remoteDisputes === null) return; // fetch failed, keep local data
      if (remoteDisputes.length > 0) {
        setDb((prev) => {
          const next = { ...prev, disputes: remoteDisputes };
          saveDB(next);
          return next;
        });
      } else {
        seedDisputesRemote(local.disputes);
      }
    })();
  }, []);

  const currentUser = React.useMemo(
    () => db.users.find((u) => u.id === currentUserId) ?? null,
    [db.users, currentUserId]
  );

  const persist = React.useCallback((next: DBShape) => {
    setDb(next);
    saveDB(next);
  }, []);

  const log = React.useCallback(
    (action: string, actingUser: User | null, nextDb?: DBShape) => {
      const entry: AuditEntry = {
        id: uid(),
        userId: actingUser?.id ?? 'system',
        userName: actingUser?.name ?? 'System',
        action,
        at: new Date().toISOString(),
      };
      const target = nextDb ?? db;
      const updated = { ...target, audit: [entry, ...target.audit] };
      setDb(updated);
      saveDB(updated);
    },
    [db]
  );

  const login = React.useCallback(
    (email: string, password: string) => {
      const user = db.users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );
      if (!user || user.password !== password) return false;
      localStorage.setItem(SESSION_KEY, user.id);
      setCurrentUserId(user.id);
      return true;
    },
    [db.users]
  );

  const logout = React.useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUserId(null);
  }, []);

  const setOwnerDisplayName = React.useCallback(
    (name: string) => {
      const next = { ...db };
      next.users = db.users.map((u) =>
        u.role === 'owner' ? { ...u, name } : u
      );
      next.ownerNameSet = true;
      persist(next);
      log('Set owner display name', currentUser ?? null, next);
      const owner = next.users.find((u) => u.role === 'owner');
      if (owner) upsertProfileName(owner.email, name);
    },
    [db, persist, log, currentUser]
  );

  const updateProfile = React.useCallback(
    (patch: Partial<User>) => {
      if (!currentUser) return;
      const next = {
        ...db,
        users: db.users.map((u) =>
          u.id === currentUser.id ? { ...u, ...patch } : u
        ),
      };
      persist(next);
      if (patch.name && patch.name.trim()) {
        upsertProfileName(currentUser.email, patch.name.trim());
      }
    },
    [db, currentUser, persist]
  );

  const changePassword = React.useCallback(
    (current: string, next: string) => {
      if (!currentUser || currentUser.password !== current) return false;
      const updated = {
        ...db,
        users: db.users.map((u) =>
          u.id === currentUser.id ? { ...u, password: next } : u
        ),
      };
      persist(updated);
      log('Changed account password', currentUser, updated);
      return true;
    },
    [db, currentUser, persist, log]
  );

  const addMember = React.useCallback(
    (data: {
      name: string;
      email: string;
      password: string;
      role: Role;
      permissions: Permissions;
    }) => {
      const newUser: User = {
        id: uid(),
        name: data.name,
        email: data.email,
        password: data.password,
        phone: '',
        role: data.role,
        avatarColor:
          AVATAR_COLORS[db.users.length % AVATAR_COLORS.length],
        permissions: data.permissions,
        paymentMethods: { bkash: '', nagad: '', bank: '' },
        metrics: {
          listingsApproved: 0,
          disputesResolved: 0,
          withdrawalsProcessed: 0,
        },
        createdAt: new Date().toISOString(),
      };
      const next = { ...db, users: [...db.users, newUser] };
      persist(next);
      log(`Added ${data.role} "${data.name}"`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const updateMember = React.useCallback(
    (id: string, patch: Partial<User>) => {
      const next = {
        ...db,
        users: db.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      };
      persist(next);
      log(`Updated member "${patch.name ?? id}"`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const removeMember = React.useCallback(
    (id: string) => {
      const target = db.users.find((u) => u.id === id);
      if (!target || target.role === 'owner') return;
      const next = { ...db, users: db.users.filter((u) => u.id !== id) };
      persist(next);
      log(`Removed member "${target.name}"`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const updateOrderStatus = React.useCallback(
    (id: number, status: OrderStatus) => {
      const next = {
        ...db,
        orders: db.orders.map((o) =>
          o.id === id ? { ...o, status } : o
        ),
      };
      persist(next);
      log(`Order #${id} status set to ${status}`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const releaseEscrow = React.useCallback(
    (id: number) => {
      const order = db.orders.find((o) => o.id === id);
      if (!order) return;
      const next = {
        ...db,
        orders: db.orders.map((o) =>
          o.id === id
            ? { ...o, escrowLocked: false, status: 'COMPLETED' as OrderStatus }
            : o
        ),
      };
      persist(next);
      log(`Released escrow for Order #${id}`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const extendEscrow = React.useCallback(
    (id: number, hrs: number) => {
      const next = {
        ...db,
        orders: db.orders.map((o) =>
          o.id === id
            ? {
                ...o,
                escrowDeadline: new Date(
                  new Date(o.escrowDeadline).getTime() + hrs * 3600000
                ).toISOString(),
              }
            : o
        ),
      };
      persist(next);
      log(`Extended escrow for Order #${id} by ${hrs}h`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const addDisputeMessage = React.useCallback(
    (orderId: number, text: string, channel: ChatChannel) => {
      if (!currentUser || !text.trim()) return;
      const msg: DisputeMessage = {
        id: uid(),
        author: 'admin',
        authorName: currentUser.name,
        text: text.trim(),
        at: new Date().toISOString(),
        channel,
      };
      let updatedMessages: DisputeMessage[] = [];
      const next = {
        ...db,
        disputes: db.disputes.map((d) => {
          if (d.orderId !== orderId) return d;
          updatedMessages = [...d.messages, msg];
          return { ...d, messages: updatedMessages };
        }),
      };
      persist(next);
      log(`Sent ${channel} message on Dispute #${orderId}`, currentUser, next);
      updateDisputeRemote(orderId, { messages: updatedMessages });
    },
    [db, currentUser, persist, log]
  );

  const addReportMessage = React.useCallback(
    (reportId: string, text: string, channel: ChatChannel) => {
      if (!currentUser || !text.trim()) return;
      const msg: DisputeMessage = {
        id: uid(),
        author: 'admin',
        authorName: currentUser.name,
        text: text.trim(),
        at: new Date().toISOString(),
        channel,
      };
      const next = {
        ...db,
        reports: db.reports.map((r) =>
          r.id === reportId ? { ...r, messages: [...r.messages, msg] } : r
        ),
      };
      persist(next);
      log(`Sent ${channel} message on Report ${reportId}`, currentUser, next);
    },
    [db, currentUser, persist, log]
  );

  const resolveReport = React.useCallback(
    (reportId: string, verdict: 'warning' | 'banned' | 'dismissed') => {
      const next = {
        ...db,
        reports: db.reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: (verdict === 'warning'
                  ? 'resolved_warning'
                  : verdict === 'banned'
                    ? 'resolved_banned'
                    : 'dismissed') as Report['status'],
              }
            : r
        ),
      };
      persist(next);
      log(`Report ${reportId} verdict: ${verdict}`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const resolveDispute = React.useCallback(
    (orderId: number, verdict: 'release' | 'refund') => {
      const status =
        verdict === 'release'
          ? ('resolved_release' as const)
          : ('resolved_refund' as const);
      const next = {
        ...db,
        disputes: db.disputes.map((d) =>
          d.orderId === orderId ? { ...d, status } : d
        ),
        orders: db.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status:
                  verdict === 'release'
                    ? ('COMPLETED' as OrderStatus)
                    : ('CANCELLED' as OrderStatus),
                escrowLocked: false,
              }
            : o
        ),
      };
      persist(next);
      log(
        `Dispute #${orderId} verdict: ${verdict === 'release' ? 'Release to Seller' : 'Refund Buyer'}`,
        currentUser,
        next
      );
      updateDisputeRemote(orderId, { status });
    },
    [db, persist, log, currentUser]
  );

  const approvePayout = React.useCallback(
    (id: number, trxId: string) => {
      const next = {
        ...db,
        payouts: db.payouts.map((p) =>
          p.id === id
            ? { ...p, status: 'approved' as const, trxId }
            : p
        ),
        users: db.users.map((u) =>
          u.id === currentUser?.id
            ? {
                ...u,
                metrics: {
                  ...u.metrics,
                  withdrawalsProcessed: u.metrics.withdrawalsProcessed + 1,
                },
              }
            : u
        ),
      };
      persist(next);
      log(`Approved Payout #${id} (TrxID: ${trxId})`, currentUser, next);
    },
    [db, currentUser, persist, log]
  );

  const rejectPayout = React.useCallback(
    (id: number) => {
      const next = {
        ...db,
        payouts: db.payouts.map((p) =>
          p.id === id ? { ...p, status: 'rejected' as const } : p
        ),
      };
      persist(next);
      log(`Rejected Payout #${id}`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const setFeePercent = React.useCallback(
    (n: number) => {
      const next = { ...db, settings: { feePercent: n } };
      persist(next);
      log(`Platform fee set to ${n}%`, currentUser, next);
    },
    [db, persist, log, currentUser]
  );

  const value: AppContextType = {
    db,
    currentUser,
    login,
    logout,
    setOwnerDisplayName,
    updateProfile,
    changePassword,
    addMember,
    updateMember,
    removeMember,
    updateOrderStatus,
    releaseEscrow,
    extendEscrow,
    addDisputeMessage,
    resolveDispute,
    addReportMessage,
    resolveReport,
    approvePayout,
    rejectPayout,
    setFeePercent,
    log: (action: string) => log(action, currentUser),
  };

  return (
    <AppContext.Provider value={value}>
      {hydrated ? children : null}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = React.useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { OWNER_CONFIG };
