'use client';

import * as React from 'react';
import { MoreHorizontal, Plus, Crown, Shield, UserCog, Trash2, KeyRound, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useApp, emptyPermissions } from '@/lib/store';
import { ALL_SECTIONS } from '@/lib/mock-data';
import type { Permissions, Role, User } from '@/lib/types';
import { toast } from 'sonner';

export function Members() {
  const { db, currentUser, addMember, updateMember, removeMember } = useApp();
  const [addOpen, setAddOpen] = React.useState(false);
  const [editTarget, setEditTarget] = React.useState<User | null>(null);
  const [pwTarget, setPwTarget] = React.useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<User | null>(null);

  if (!currentUser || currentUser.role !== 'owner') {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          You do not have permission to access Member Management.
        </CardContent>
      </Card>
    );
  }

  const owner = db.users.find((u) => u.role === 'owner')!;
  const admin = db.users.find((u) => u.role === 'admin');
  const operators = db.users.filter((u) => u.role === 'operator');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Member Management &amp; Access Control
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff roles and granular section permissions.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Member
        </Button>
      </div>

      {/* Owner card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <Avatar className="h-14 w-14">
            <AvatarFallback
              style={{ backgroundColor: owner.avatarColor }}
              className="text-lg font-semibold text-white"
            >
              <Crown className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">
                {owner.name || 'Owner (name not set)'}
              </h3>
              <Badge className="bg-primary text-primary-foreground">Owner</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{owner.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Super Admin · Permanent full control · Cannot be deleted
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin slot */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Shield className="h-4 w-4" />
          Admin (1 slot)
        </h2>
        {admin ? (
          <MemberRow
            user={admin}
            onEdit={setEditTarget}
            onPw={setPwTarget}
            onDelete={setDeleteTarget}
          />
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              No admin assigned. Add one using the button above.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Operators */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <UserCog className="h-4 w-4" />
          Operators ({operators.length})
        </h2>
        <div className="space-y-3">
          {operators.map((op) => (
            <MemberRow
              key={op.id}
              user={op}
              onEdit={setEditTarget}
              onPw={setPwTarget}
              onDelete={setDeleteTarget}
            />
          ))}
          {operators.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No operators yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AddMemberDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addMember}
        adminExists={!!admin}
      />
      <EditMemberDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={updateMember}
      />
      <ChangePasswordDialog
        target={pwTarget}
        onClose={() => setPwTarget(null)}
        onSave={updateMember}
      />
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this member from the Control Room.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  removeMember(deleteTarget.id);
                  toast.success(`${deleteTarget.name} removed`);
                }
                setDeleteTarget(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberRow({
  user,
  onEdit,
  onPw,
  onDelete,
}: {
  user: User;
  onEdit: (u: User) => void;
  onPw: (u: User) => void;
  onDelete?: (u: User) => void;
}) {
  const initials = user.name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const enabledSections = ALL_SECTIONS.filter((s) => user.permissions[s.key]);

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <Avatar className="h-11 w-11">
          <AvatarFallback
            style={{ backgroundColor: user.avatarColor }}
            className="text-sm font-semibold text-white"
          >
            {initials || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <Badge
              className={
                user.role === 'admin'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-secondary text-secondary-foreground'
              }
            >
              {user.role === 'admin' ? 'Admin' : 'Operator'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <div className="mt-1.5 flex flex-wrap gap-1">
            {enabledSections.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No sections assigned
              </span>
            ) : (
              enabledSections.map((s) => (
                <span
                  key={s.key}
                  className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  {s.label}
                </span>
              ))
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Permissions
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onPw(user)}>
              <KeyRound className="mr-2 h-4 w-4" />
              Change Password
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Member
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

function AddMemberDialog({
  open,
  onOpenChange,
  onAdd,
  adminExists,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onAdd: (data: {
    name: string;
    email: string;
    password: string;
    role: Role;
    permissions: Permissions;
  }) => void;
  adminExists: boolean;
}) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<Role>('operator');
  const [perms, setPerms] = React.useState<Permissions>({
    ...emptyPermissions(),
    dashboard: true,
    account: true,
  });

  const reset = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('operator');
    setPerms({ ...emptyPermissions(), dashboard: true, account: true });
  };

  const submit = () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      toast.error('Please fill all fields');
      return;
    }
    // Dashboard and Account Settings are mandatory for every member,
    // regardless of what's toggled in the (hidden) rest of the form.
    const finalPerms: Permissions = { ...perms, dashboard: true, account: true };
    onAdd({ name: name.trim(), email: email.trim(), password, role, permissions: finalPerms });
    toast.success(`${name.trim()} added as ${role}`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Member</DialogTitle>
          <DialogDescription>
            Create a new staff account with specific section access.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Member Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={role}
                onValueChange={(v) => setRole(v as Role)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="admin" disabled={adminExists}>
                    Admin {adminExists ? '(slot filled)' : ''}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Section Permissions</Label>
            <p className="text-xs text-muted-foreground">
              Toggling off a section hides it from this member&apos;s sidebar.
            </p>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
              {ALL_SECTIONS.filter(
                (s) =>
                  s.key !== 'members' &&
                  s.key !== 'audit' &&
                  s.key !== 'dashboard' &&
                  s.key !== 'account'
              ).map((s) => (
                <label
                  key={s.key}
                  className="flex items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={perms[s.key]}
                    onCheckedChange={(c) =>
                      setPerms((p) => ({ ...p, [s.key]: !!c }))
                    }
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit}>Add Member</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDialog({
  target,
  onClose,
  onSave,
}: {
  target: User | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<User>) => void;
}) {
  const [name, setName] = React.useState('');
  const [perms, setPerms] = React.useState<Permissions>(emptyPermissions());

  React.useEffect(() => {
    if (target) {
      setName(target.name);
      setPerms(target.permissions);
    }
  }, [target]);

  if (!target) return null;

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {target.name}</DialogTitle>
          <DialogDescription>
            Update name and section permissions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Display Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Section Permissions</Label>
            <div className="grid grid-cols-2 gap-2 rounded-lg border p-3">
              {ALL_SECTIONS.filter(
                (s) =>
                  s.key !== 'members' &&
                  s.key !== 'audit' &&
                  s.key !== 'dashboard' &&
                  s.key !== 'account'
              ).map((s) => (
                <label key={s.key} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={perms[s.key]}
                    onCheckedChange={(c) =>
                      setPerms((p) => ({ ...p, [s.key]: !!c }))
                    }
                  />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(target.id, {
                name,
                permissions: { ...perms, dashboard: true, account: true },
              });
              toast.success(`${name} updated`);
              onClose();
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangePasswordDialog({
  target,
  onClose,
  onSave,
}: {
  target: User | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<User>) => void;
}) {
  const [pw, setPw] = React.useState('');

  React.useEffect(() => {
    if (target) setPw('');
  }, [target]);

  if (!target) return null;

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change Password — {target.name}</DialogTitle>
          <DialogDescription>
            Set a new password for this member.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={!pw.trim()}
            onClick={() => {
              onSave(target.id, { password: pw });
              toast.success('Password changed');
              onClose();
            }}
          >
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
