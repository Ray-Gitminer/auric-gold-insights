import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; confirmed: boolean }>;
  updatePassword: (password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [configured, setConfigured] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    setConfigured(Boolean(client));
    if (!client) {
      setLoading(false);
      return;
    }

    void client.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      session,
      user: session?.user ?? null,
      async signIn(email, password) {
        const client = getSupabaseBrowserClient();
        if (!client) return "Supabase is not configured";
        const { error } = await client.auth.signInWithPassword({ email, password });
        return error?.message ?? null;
      },
      async signUp(email, password) {
        const client = getSupabaseBrowserClient();
        if (!client) return { error: "Supabase is not configured", confirmed: false };
        const { data, error } = await client.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        return { error: error?.message ?? null, confirmed: Boolean(data.session) };
      },
      async resetPassword(email) {
        const client = getSupabaseBrowserClient();
        if (!client) return "Supabase is not configured";
        const { error } = await client.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        return error?.message ?? null;
      },
      async updatePassword(password) {
        const client = getSupabaseBrowserClient();
        if (!client) return "Supabase is not configured";
        const { error } = await client.auth.updateUser({ password });
        return error?.message ?? null;
      },
      async signOut() {
        await getSupabaseBrowserClient()?.auth.signOut();
      },
    }),
    [configured, loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
