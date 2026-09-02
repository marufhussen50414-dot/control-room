'use client';

import * as React from 'react';
import { Gamepad2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from '@/lib/nav';
import type { SectionKey } from '@/lib/types';
import { useApp } from '@/lib/store';

export function MobileSidebar({
  open,
  onOpenChange,
  active,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  active: SectionKey | null; // 🔥 null সাপোর্ট যোগ করা হয়েছে
  onSelect: (key: SectionKey) => void;
}) {
  const { currentUser, db } = useApp();
  if (!currentUser) return null;

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && currentUser.role !== 'owner') return false;
    return currentUser.permissions[item.key];
  });

  const accountItem = visibleItems.find((item) => item.key === 'account');
  const mainItems = visibleItems.filter((item) => item.key !== 'account');

  const disputeCount =
    (db.disputes ?? []).filter((d) => d.status === 'open').length +
    (db.reports ?? []).filter((r) => r.status === 'open').length;
  const pendingPayouts = db.payouts.filter((p) => p.status === 'pending').length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 flex-col border-r bg-card shadow-lg">
        <div className="flex h-16 items-center justify-between border-b px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold">GameHaatBD</span>
              <span className="text-[11px] text-muted-foreground">Control Room</span>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {accountItem && (
          <div className="border-b p-3">
            {(() => {
              const Icon = accountItem.icon;
              const isActive = active === accountItem.key;
              return (
                <button
                  onClick={() => {
                    onSelect(accountItem.key);
                    onOpenChange(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                  <span className="flex-1 text-left">{accountItem.label}</span>
                </button>
              );
            })()}
          </div>
        )}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {mainItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.key;
            const badge =
              item.key === 'disputes'
                ? disputeCount
                : item.key === 'payouts'
                  ? pendingPayouts
                  : 0;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelect(item.key);
                  onOpenChange(false);
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span
                    className={cn(
                      'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold',
                      isActive
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-primary/10 text-primary'
                    )}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t p-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] font-medium text-muted-foreground">
              Signed in as
            </p>
            <p className="mt-0.5 truncate text-sm font-semibold">
              {currentUser.name || 'Unnamed'}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
