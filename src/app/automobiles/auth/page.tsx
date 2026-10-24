'use client';

import { Building2, LogIn, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  getSupabaseClient,
  isSupabaseConfigured,
  missingSupabaseClientKeys,
} from '@/utils/supabase/client';
import { GWALIOR_POLICE_STATIONS } from '@/lib/gwalior-police-stations';

const getSupabaseMissingKeyMessage = () => {
  if (missingSupabaseClientKeys.length === 0) {
    return 'Supabase is not configured.';
  }

  return `Supabase is not configured. Missing client keys: ${missingSupabaseClientKeys.join(', ')}`;
};

export default function AutomobilesAuthPage() {
  const router = useRouter();

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginStationId, setLoginStationId] = useState('');

  const [signupStationId, setSignupStationId] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const stations = GWALIOR_POLICE_STATIONS.slice().sort((a, b) => a.name.localeCompare(b.name));

  const onLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      setError(getSupabaseMissingKeyMessage());
      return;
    }

    if (!loginStationId) {
      setError('Please select your police station for login.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(getSupabaseMissingKeyMessage());
      return;
    }

    try {
      setLoading(true);
      const { data: credentials, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (signInError) throw signInError;

      const { data: accountDoc, error: accountError } = await supabase
        .from('automobile_station_accounts')
        .select('station_id')
        .eq('id', credentials.user.id)
        .maybeSingle();

      if (accountError) throw accountError;

      if (accountDoc?.station_id !== loginStationId) {
        await supabase.auth.signOut();
        setError(
          'Selected station does not match this account. Please choose the correct station.'
        );
        return;
      }

      router.push('/automobiles');
    } catch (loginError) {
      const message =
        loginError instanceof Error && /email not confirmed/i.test(loginError.message)
          ? 'Please confirm your email address before logging in.'
          : loginError instanceof Error
            ? loginError.message
            : 'Unable to log in.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isSupabaseConfigured) {
      setError(getSupabaseMissingKeyMessage());
      return;
    }

    const selectedStation = stations.find((station) => station.id === signupStationId);
    if (!selectedStation) {
      setError('Please select a police station.');
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(getSupabaseMissingKeyMessage());
      return;
    }

    try {
      setLoading(true);

      const { data: existing, error: lookupError } = await supabase
        .from('automobile_station_accounts')
        .select('id')
        .eq('station_id', selectedStation.id)
        .limit(1);

      if (lookupError) throw lookupError;

      if (existing && existing.length > 0) {
        setError('An account for this station already exists. Please log in instead.');
        return;
      }

      const { data: created, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail.trim(),
        password: signupPassword,
        options: { data: { name: selectedStation.name } },
      });

      if (signUpError) throw signUpError;
      if (!created.user) throw new Error('Unable to create account.');

      const nowIso = new Date().toISOString();
      const { error: accountError } = await supabase.from('automobile_station_accounts').upsert(
        {
          id: created.user.id,
          email: created.user.email ?? signupEmail.trim(),
          station_id: selectedStation.id,
          station_name: selectedStation.name,
          role: 'STATION',
          created_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: 'id' }
      );

      if (accountError) throw accountError;

      const { error: fleetError } = await supabase.from('station_fleet').upsert(
        {
          station_id: selectedStation.id,
          station_name: selectedStation.name,
          available_by_type: {
            PATROL_CAR: 20,
            MOTORCYCLE: 12,
            VAN: 6,
            HEAVY: 4,
          },
          updated_at: nowIso,
        },
        { onConflict: 'station_id', ignoreDuplicates: true }
      );

      if (fleetError) throw fleetError;

      if (!created.session) {
        setSuccess('Station account created. Confirm your email address, then log in.');
        return;
      }

      setSuccess('Station account created successfully. Redirecting...');
      router.push('/automobiles');
    } catch (signupError) {
      const message =
        signupError instanceof Error ? signupError.message : 'Unable to create account.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      id="maincontent"
      className="container-wide flex min-h-[85vh] items-center justify-center py-10"
    >
      <section className="card-elevated w-full max-w-xl rounded-3xl border border-border p-6 md:p-8">
        <header className="mb-6 space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Automobiles Station Access
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in or create a station account linked to a Gwalior police station.
          </p>
        </header>

        <Tabs defaultValue="login" className="space-y-4">
          <TabsList className="grid h-auto w-full grid-cols-2 rounded-xl bg-muted p-1">
            <TabsTrigger value="login" className="gap-2">
              <LogIn className="h-4 w-4" aria-hidden />
              Login
            </TabsTrigger>
            <TabsTrigger value="signup" className="gap-2">
              <UserPlus className="h-4 w-4" aria-hidden />
              Sign up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <form onSubmit={onLogin} className="space-y-4" noValidate>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Police Station</span>
                <div className="relative">
                  <Building2
                    className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  <select
                    className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground"
                    value={loginStationId}
                    onChange={(event) => setLoginStationId(event.target.value)}
                    aria-label="Select police station for login"
                    required
                  >
                    <option value="">Select station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Email</span>
                <Input
                  type="email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  placeholder="station.account@domain.com"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Password</span>
                <Input
                  type="password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
              </label>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={onSignup} className="space-y-4" noValidate>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Police Station</span>
                <div className="relative">
                  <Building2
                    className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground"
                    aria-hidden
                  />
                  <select
                    className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground"
                    value={signupStationId}
                    onChange={(event) => setSignupStationId(event.target.value)}
                    aria-label="Select police station"
                    required
                  >
                    <option value="">Select station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Email</span>
                <Input
                  type="email"
                  value={signupEmail}
                  onChange={(event) => setSignupEmail(event.target.value)}
                  placeholder="station.account@domain.com"
                  required
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-sm font-medium text-foreground">Password</span>
                <Input
                  type="password"
                  value={signupPassword}
                  onChange={(event) => setSignupPassword(event.target.value)}
                  minLength={6}
                  required
                />
              </label>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create station account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error ? (
          <p
            className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        {success ? (
          <p
            className="mt-4 rounded-lg border border-emerald-300/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
            role="status"
            aria-live="polite"
          >
            {success}
          </p>
        ) : null}

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Back to{' '}
          <Link
            href="/automobiles"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            automobiles dashboard
          </Link>
        </p>
      </section>
    </main>
  );
}
