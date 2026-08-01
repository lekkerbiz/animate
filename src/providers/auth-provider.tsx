import type { Session } from '@supabase/supabase-js';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { supabase } from '@/lib/supabase';
import type { Caregiver } from '@/types/database';

type AuthState = {
  session: Session | null;
  /** Fila de caregivers del usuario; null si aún no pertenece a ningún hogar */
  caregiver: Caregiver | null;
  /** true mientras se resuelve la sesión inicial o el caregiver tras un cambio de sesión */
  loading: boolean;
  refreshCaregiver: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCaregiver = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setCaregiver(null);
      return;
    }
    const { data } = await supabase
      .from('caregivers')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    setCaregiver(data ?? null);
  }, []);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      await loadCaregiver(data.session?.user.id);
      if (active) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      await loadCaregiver(next?.user.id);
      if (active) setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadCaregiver]);

  const refreshCaregiver = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadCaregiver(data.session?.user.id);
  }, [loadCaregiver]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, caregiver, loading, refreshCaregiver, signOut }),
    [session, caregiver, loading, refreshCaregiver, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
