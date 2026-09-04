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
  fullPermissions,
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
  checkMemberExists,
  deleteMemberRemote,
  fetchAuditRemote,
  fetchDisputesRemote,
  fetchMembersRemote,
  fetchOrdersRemote,
  fetchPayoutsRemote,
  fetchReportsRemote,
  fetchSettingsRemote,
  insertAuditRemote,
  seedAuditRemote,
  seedDisputesRemote,
  seedOrdersRemote,
  seedPayoutsRemote,
  seedReportsRemote,
  updateDisputeRemote,
  updateOrderRemote,
  updatePayoutRemote,
  updateReportRemote,
  updateSettingsRemote,
  upsertMemberRemote,
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

    // Members / profiles: merge remote rows (by email) into the local user
    // list before revealing the UI, so the "set your name" popup and every
    // member's saved details are already correct on a brand-new device.
    // A remote row may still be missing fields from before full member
    // sync existed (e.g. only `name` was ever saved) — an empty/absent
    // remote value must never overwrite a real local one.
    (async () => {
      const remoteMembers = await fetchMembersRemote();
      if (remoteMembers) {
        const seedByEmail = new Map(
          [seedOwner(), seedAdmin(), ...seedOperators()].map((u) => [
            u.email,
            u,
          ])
        );
        const byEmail = new Map(remoteMembers.map((m) => [m.email, m.user]));
        const mergedUsers = local.users
          // A locally cached member who's neither a fixed seed account
          // nor present in the (successfully fetched) remote list was
          // removed on another device — drop them here too.
          .filter((u) => seedByEmail.has(u.email) || byEmail.has(u.email))
          .map((u) => {
            const remote = byEmail.get(u.email);
            if (!remote) return u;
            byEmail.delete(u.email);
            // Merge permissions key-by-key: a remote object saved before a
            // newer section existed (e.g. "activeEscrows") must never erase
            // that key locally — only keys it actually specifies win.
            const mergedPermissions: Permissions = { ...u.permissions };
            if (remote.permissions) {
              for (const key of Object.keys(remote.permissions) as Array<
                keyof Permissions
              >) {
                if (typeof remote.permissions[key] === 'boolean') {
                  mergedPermissions[key] = remote.permissions[key];
                }
              }
            }
            return {
              ...u,
              name: remote.name || u.name,
              phone: remote.phone || u.phone,
              password: remote.password || u.password,
              role: remote.role || u.role,
              avatarColor: remote.avatarColor || u.avatarColor,
              permissions: mergedPermissions,
              paymentMethods: remote.paymentMethods || u.paymentMethods,
              metrics: remote.metrics || u.metrics,
              createdAt: remote.createdAt || u.createdAt,
            };
          });
        // Safety net: a known seeded account (owner/admin/operators) must
        // never have its identity fields corrupted by an incomplete
        // remote row — e.g. an old row saved before `role` was synced
        // defaults to 'operator', which would silently demote the owner.
        // For these fixed accounts, the seed is the source of truth for
        // role (and password, if it somehow ended up blank). This MUST
        // run before the "owner keeps full permissions" check below, or
        // that check would still be looking at the corrupted role.
        for (const u of mergedUsers) {
          const seed = seedByEmail.get(u.email);
          if (!seed) continue;
          if (u.role !== seed.role) u.role = seed.role;
          if (!u.password) u.password = seed.password;
        }
        // Safety net: the owner account must always keep full access, no
        // matter what a synced permissions object says — new sections
        // added later must never end up hidden from the owner.
        for (const u of mergedUsers) {
          if (u.role === 'owner') {
            u.permissions = fullPermissions();
          }
        }
        // Members added on another device that aren't in the local seed list.
        byEmail.forEach((remote, email) => {
          mergedUsers.push({ ...remote, id: `remote-${email}` });
        });
        const owner = mergedUsers.find((u) => u.role === 'owner');
        const ownerNameSet = !!(owner?.name && owner.name.trim());

        setDb((prev) => {
          const next = { ...prev, users: mergedUsers, ownerNameSet };
          saveDB(next);
          return next;
        });

        if (remoteMembers.length === 0) {
          // Brand-new profiles table: push the local seed members up once.
          local.users.forEach((u) => upsertMemberRemote(u));
        }
      }
      setHydrated(true);
    })();

    // Orders
    (async () => {
      const remote = await fetchOrdersRemote();
      if (remote === null) return;
      if (remote.length > 0) {
        setDb((prev) => {
          const next = { ...prev, orders: remote };
          saveDB(next);
          return next;
        });
      } else {
        seedOrdersRemote(local.orders);
      }
    })();

    // Disputes
    (async () => {
      const remote = await fetchDisputesRemote();
      if (remote === null) return;
      if (remote.length > 0) {
        setDb((prev) => {
          const next = { ...prev, disputes: remote };
          saveDB(next);
          return next;
        });
      } else {
        seedDisputesRemote(local.disputes);
      }
    })();

    // Reports
    (async () => {
      const remote = await fetchReportsRemote();
      if (remote === null) return;
      if (remote.length > 0) {
        setDb((prev) => {
          const next = { ...prev, reports: remote };
          saveDB(next);
          return next;
        });
      } else {
        seedReportsRemote(local.reports);
      }
    })();

    // Payouts
    (async () => {
      const remote = await fetchPayoutsRemote();
      if (remote === null) return;
      if (remote.length > 0) {
        setDb((prev) => {
          const next = { ...prev, payouts: remote };
          saveDB(next);
          return next;
        });
      } else {
        seedPayoutsRemote(local.payouts);
      }
    })();

    // Audit log
    (async () => {
      const remote = await fetchAuditRemote();
      if (remote === null) return;
      if (remote.length > 0) {
        setDb((prev) => {
          const next = { ...prev, audit: remote };
          saveDB(next);
          return next;
        });
      } else {
        seedAuditRemote(local.audit);
      }
    })();

    // Settings
    (async () => {
      const remote = await fetchSettingsRemote();
      if (remote === null) return;
      setDb((prev) => {
        const next = { ...prev, settings: { feePercent: remote.feePercent } };
        saveDB(next);
        return next;
      });
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
      insertAuditRemote(entry);
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

  // If this member (never the owner, who can't be removed) gets deleted
  // from another device while they're actively using the app, sign them
  // out as soon as we notice — not just on their next page load.
  React.useEffect(() => {
    if (!currentUser || currentUser.role === 'owner') return;
    const email = currentUser.email;
    const interval = setInterval(async () => {
      const exists = await checkMemberExists(email);
      if (exists === false) {
        logout();
        toast.error('Your account access was removed. You have been signed out.');
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [currentUser, logout]);

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
      // Always sync the owner with full permissions — the owner must
      // never end up locked out of a section by stale synced data.
      if (owner) upsertMemberRemote({ ...owner, permissions: fullPermissions() });
    },
    [db, persist, log, currentUser]
  );

  const updateProfile = React.useCallback(
    (patch: Partial<User>) => {
      if (!currentUser) return;
      const updatedUser = { ...currentUser, ...patch };
      const next = {
        ...db,
        users: db.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
      };
      persist(next);
      upsertMemberRemote(
        updatedUser.role === 'owner'
          ? { ...updatedUser, permissions: fullPermissions() }
          : updatedUser
      );
    },
    [db, currentUser, persist]
  );

  const changePassword = React.useCallback(
    (current: string, next: string) => {
      if (!currentUser || currentUser.password !== current) return false;
      const updatedUser = { ...currentUser, password: next };
      const updated = {
        ...db,
        users: db.users.map((u) => (u.id === currentUser.id ? updatedUser : u)),
      };
      persist(updated);
      log('Changed account password', currentUser, updated);
      upsertMemberRemote(updatedUser);
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
      upsertMemberRemote(newUser);
    },
    [db, persist, log, currentUser]
  );

  const updateMember = React.useCallback(
    (id: string, patch: Partial<User>) => {
      const target = db.users.find((u) => u.id === id);
      const updatedUser = target ? { ...target, ...patch } : null;
      const next = {
        ...db,
        users: db.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
      };
      persist(next);
      log(`Updated member "${patch.name ?? id}"`, currentUser, next);
      if (updatedUser) upsertMemberRemote(updatedUser);
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
      deleteMemberRemote(target.email);
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
      updateOrderRemote(id, { status });
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
      updateOrderRemote(id, { escrowLocked: false, status: 'COMPLETED' });
    },
    [db, persist, log, currentUser]
  );

  const extendEscrow = React.useCallback(
    (id: number, hrs: number) => {
      let newDeadline = '';
      const next = {
        ...db,
        orders: db.orders.map((o) => {
          if (o.id !== id) return o;
          newDeadline = new Date(
            new Date(o.escrowDeadline).getTime() + hrs * 3600000
          ).toISOString();
          return { ...o, escrowDeadline: newDeadline };
        }),
      };
      persist(next);
      log(`Extended escrow for Order #${id} by ${hrs}h`, currentUser, next);
      if (newDeadline) updateOrderRemote(id, { escrowDeadline: newDeadline });
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
      let updatedMessages: DisputeMessage[] = [];
      const next = {
        ...db,
        reports: db.reports.map((r) => {
          if (r.id !== reportId) return r;
          updatedMessages = [...r.messages, msg];
          return { ...r, messages: updatedMessages };
        }),
      };
      persist(next);
      log(`Sent ${channel} message on Report ${reportId}`, currentUser, next);
      updateReportRemote(reportId, { messages: updatedMessages });
    },
    [db, currentUser, persist, log]
  );

  const resolveReport = React.useCallback(
    (reportId: string, verdict: 'warning' | 'banned' | 'dismissed') => {
      const status = (
        verdict === 'warning'
          ? 'resolved_warning'
          : verdict === 'banned'
            ? 'resolved_banned'
            : 'dismissed'
      ) as Report['status'];
      const next = {
        ...db,
        reports: db.reports.map((r) =>
          r.id === reportId ? { ...r, status } : r
        ),
      };
      persist(next);
      log(`Report ${reportId} verdict: ${verdict}`, currentUser, next);
      updateReportRemote(reportId, { status });
    },
    [db, persist, log, currentUser]
  );

  const resolveDispute = React.useCallback(
    (orderId: number, verdict: 'release' | 'refund') => {
      const status =
        verdict === 'release'
          ? ('resolved_release' as const)
          : ('resolved_refund' as const);
      const orderStatus: OrderStatus =
        verdict === 'release' ? 'COMPLETED' : 'CANCELLED';
      const next = {
        ...db,
        disputes: db.disputes.map((d) =>
          d.orderId === orderId ? { ...d, status } : d
        ),
        orders: db.orders.map((o) =>
          o.id === orderId
            ? { ...o, status: orderStatus, escrowLocked: false }
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
      updateOrderRemote(orderId, { status: orderStatus, escrowLocked: false });
    },
    [db, persist, log, currentUser]
  );

  const approvePayout = React.useCallback(
    (id: number, trxId: string) => {
      let updatedUser: User | null = null;
      const next = {
        ...db,
        payouts: db.payouts.map((p) =>
          p.id === id
            ? { ...p, status: 'approved' as const, trxId }
            : p
        ),
        users: db.users.map((u) => {
          if (u.id !== currentUser?.id) return u;
          updatedUser = {
            ...u,
            metrics: {
              ...u.metrics,
              withdrawalsProcessed: u.metrics.withdrawalsProcessed + 1,
            },
          };
          return updatedUser;
        }),
      };
      persist(next);
      log(`Approved Payout #${id} (TrxID: ${trxId})`, currentUser, next);
      updatePayoutRemote(id, { status: 'approved', trxId });
      if (updatedUser) upsertMemberRemote(updatedUser);
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
      updatePayoutRemote(id, { status: 'rejected' });
    },
    [db, persist, log, currentUser]
  );

  const setFeePercent = React.useCallback(
    (n: number) => {
      const next = { ...db, settings: { feePercent: n } };
      persist(next);
      log(`Platform fee set to ${n}%`, currentUser, next);
      updateSettingsRemote(n);
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

