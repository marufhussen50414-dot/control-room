'use client';

import * as React from 'react';
import { Gamepad2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  active: SectionKey;
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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Gamepad2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col items-start leading-tight">
              <span className="text-sm">GameHaatBD</span>
              <span className="text-[11px] font-normal text-muted-foreground">
                Control Room
              </span>
            </div>
          </SheetTitle>
        </SheetHeader>

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
                      ? 'bg-primary text-primary-foreground'
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

        <nav className="space-y-1 p-3">
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
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className="h-[1.15rem] w-[1.15rem] shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {badge > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-[11px] font-semibold text-primary">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
