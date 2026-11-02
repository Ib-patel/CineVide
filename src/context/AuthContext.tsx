"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiSend } from "@/lib/api-client";
import type { SessionUser } from "@/types";

type AuthStatus = "loading" | "ready";

interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  /** triggered after a successful sign-out so consumers can reset guest state */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    apiGet<{ user: SessionUser | null }>("/api/auth/me").then((result) => {
      if (cancelled) return;
      setUser(result.ok ? result.data.user : null);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signOut = useCallback(async () => {
    await apiSend("DELETE", "/api/auth");
    setUser(null);
    router.push("/");
    router.refresh();
  }, [router]);

  const value = useMemo(() => ({ user, status, signOut }), [user, status, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
