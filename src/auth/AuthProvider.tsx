import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { isCloudEnabled, supabase } from '../data/supabase';

export interface AuthUser {
  id: string;
  email: string;
}

interface AuthValue {
  ready: boolean;
  cloudEnabled: boolean;
  user: AuthUser | null;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

function toUser(session: Session | null): AuthUser | null {
  if (!session?.user) return null;
  return { id: session.user.id, email: session.user.email ?? '' };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isCloudEnabled);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(toUser(data.session));
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(toUser(session)),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    ready,
    cloudEnabled: isCloudEnabled,
    user,
    sendCode: async (email) => {
      const { error } = await supabase!.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
    },
    verifyCode: async (email, code) => {
      const { error } = await supabase!.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
      });
      if (error) throw error;
    },
    signOut: async () => {
      await supabase!.auth.signOut();
    },
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
