'use client';

import * as React from 'react';
import { Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { mainSiteSupabase } from '@/lib/main-site-supabase';

/**
 * Shown inline (not a separate page) wherever real marketplace data is
 * needed but no admin session exists yet for the main site. Once
 * connected, the parent's useRealOrders() picks up the change via its
 * own onAuthStateChange listener — this component doesn't need to
 * report back explicitly.
 */
export function ConnectLiveSitePrompt() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const submit = async () => {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    setError('');
    const { error: signInError } = await mainSiteSupabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) setError(signInError.message);
  };

  const submitGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: oauthError } = await mainSiteSupabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.href },
    });
    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-4 p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Connect to the live site</h3>
            <p className="text-xs text-muted-foreground">
              Sign in with your real GameHaatBD account to see live orders.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={submitGoogle}
          disabled={googleLoading || loading}
        >
          {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button
          className="w-full"
          onClick={submit}
          disabled={loading || googleLoading}
        >
          {loading ? 'Connecting…' : 'Connect'}
        </Button>
      </CardContent>
    </Card>
  );
}
