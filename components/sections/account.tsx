'use client';

import * as React from 'react';
import { User as UserIcon, Wallet, Lock, Activity, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/lib/store';
import { formatDateTime } from '@/lib/format';
import { toast } from 'sonner';

export function AccountSettings() {
  const { currentUser, updateProfile, changePassword, db } = useApp();
  const [name, setName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [bkash, setBkash] = React.useState('');
  const [nagad, setNagad] = React.useState('');
  const [bank, setBank] = React.useState('');
  const [curPw, setCurPw] = React.useState('');
  const [newPw, setNewPw] = React.useState('');

  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name);
      setPhone(currentUser.phone);
      setBkash(currentUser.paymentMethods.bkash);
      setNagad(currentUser.paymentMethods.nagad);
      setBank(currentUser.paymentMethods.bank);
    }
  }, [currentUser]);

  if (!currentUser) return null;

  const initials = (currentUser.name || currentUser.email)
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const myActions = db.audit
    .filter((a) => a.userId === currentUser.id)
    .slice(0, 8);

  const roleBadge = (role: string) => {
    if (role === 'owner')
      return <Badge className="bg-primary text-primary-foreground">Owner</Badge>;
    if (role === 'admin')
      return <Badge className="bg-emerald-600 text-white">Admin</Badge>;
    return <Badge variant="secondary">Operator</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal profile, payment details, and security.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserIcon className="h-4 w-4 text-primary" />
            Personal Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback
                style={{ backgroundColor: currentUser.avatarColor }}
                className="text-xl font-semibold text-white"
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm text-muted-foreground">
                Avatar uses your initials and a system-assigned color.
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Display Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={currentUser.role === 'owner'}
              />
              {currentUser.role === 'owner' && (
                <p className="text-xs text-muted-foreground">
                  Owner display name is managed at first login.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={currentUser.email} disabled />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Assigned Role</Label>
              <div className="flex h-10 items-center">
                {roleBadge(currentUser.role)}
              </div>
            </div>
          </div>
          <Button
            onClick={() => {
              updateProfile({ name, phone });
              toast.success('Profile updated');
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Payment methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-primary" />
            Payment Method Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>bKash Number</Label>
              <Input
                value={bkash}
                onChange={(e) => setBkash(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Nagad Number</Label>
              <Input
                value={nagad}
                onChange={(e) => setNagad(e.target.value)}
                placeholder="01XXXXXXXXX"
              />
            </div>
            <div className="space-y-2">
              <Label>Bank Details</Label>
              <Input
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Bank - Account No."
              />
            </div>
          </div>
          <Button
            onClick={() => {
              updateProfile({
                paymentMethods: { bkash, nagad, bank },
              });
              toast.success('Payment details saved');
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Payment Details
          </Button>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-primary" />
            Security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input
                type="password"
                value={curPw}
                onChange={(e) => setCurPw(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={() => {
              if (!curPw || !newPw) {
                toast.error('Fill both password fields');
                return;
              }
              const ok = changePassword(curPw, newPw);
              if (ok) {
                toast.success('Password changed');
                setCurPw('');
                setNewPw('');
              } else {
                toast.error('Current password is incorrect');
              }
            }}
          >
            Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Productivity + Recent actions */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Tasks Handled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">
                  {currentUser.metrics.listingsApproved}
                </p>
                <p className="text-xs text-muted-foreground">Listings Approved</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">
                  {currentUser.metrics.disputesResolved}
                </p>
                <p className="text-xs text-muted-foreground">Disputes Resolved</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-2xl font-semibold">
                  {currentUser.metrics.withdrawalsProcessed}
                </p>
                <p className="text-xs text-muted-foreground">Withdrawals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" />
              My Recent Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myActions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No recent actions recorded.
              </p>
            )}
            {myActions.map((a) => (
              <div key={a.id} className="flex gap-3 text-sm">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div>
                  <p className="text-muted-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(a.at)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
