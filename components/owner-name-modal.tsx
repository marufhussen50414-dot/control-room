'use client';

import * as React from 'react';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/lib/store';

export function OwnerNameModal() {
  const { currentUser, db, setOwnerDisplayName } = useApp();
  const [name, setName] = React.useState('');
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (
      currentUser?.role === 'owner' &&
      !db.ownerNameSet &&
      !(currentUser.name && currentUser.name.trim())
    ) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [currentUser, db.ownerNameSet]);

  const submit = () => {
    if (!name.trim()) return;
    setOwnerDisplayName(name.trim());
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Crown className="h-6 w-6" />
          </div>
          <DialogTitle>Welcome, Owner</DialogTitle>
          <DialogDescription>
            This is your first login. Set your display name to personalize the
            Control Room. This will be saved permanently.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="owner-name">Display Name</Label>
          <Input
            id="owner-name"
            placeholder="e.g. Maruf Hussen"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={!name.trim()}>
            Save &amp; Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
