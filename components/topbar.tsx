'use client';

import * as React from 'react';
import { LogOut, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/theme-toggle';
import { useApp } from '@/lib/store';
import { NAV_ITEMS } from '@/lib/nav';
import type { SectionKey } from '@/lib/types';
import { cn } from '@/lib/utils';

function roleBadge(role: string) {
  if (role === 'owner')
    return (
      <Badge className="bg-primary text-primary-foreground">Owner</Badge>
    );
  if (role === 'admin')
    return (
      <Badge className="bg-emerald-600 text-white">Admin</Badge>
    );
  return (
    <Badge variant="secondary">Operator</Badge>
  );
}

export function Topbar({
  active,
  onSelect,
  onOpenMobile,
}: {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
  onOpenMobile: () => void;
}) {
  const { currentUser, logout, db } = useApp();
  if (!currentUser) return null;

  const activeLabel =
    NAV_ITEMS.find((n) => n.key === active)?.label ?? 'Dashboard';
  const initials = (currentUser.name || currentUser.email)
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.ownerOnly && currentUser.role !== 'owner') return false;
    return currentUser.permissions[item.key];
  });

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur lg:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMobile}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex flex-col">
        <h2 className="text-base font-semibold leading-tight">
          {activeLabel}
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">
          GameHaatBD Control Room
        </p>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback
                  style={{ backgroundColor: currentUser.avatarColor }}
                  className="text-xs font-semibold text-white"
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start leading-tight sm:flex">
                <span className="text-sm font-medium">
                  {currentUser.name || 'Set your name'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {currentUser.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-1">
                <span>{currentUser.name || 'Unnamed'}</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {currentUser.email}
                </span>
                <div className="mt-1">{roleBadge(currentUser.role)}</div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {visibleItems.map((item) => (
              <DropdownMenuItem
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={cn(
                  active === item.key && 'bg-accent text-accent-foreground'
                )}
              >
                {item.label}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
