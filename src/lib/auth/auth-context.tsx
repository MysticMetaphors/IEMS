import * as auth from "@/db/auth/auth";
import { errorMessage } from "@/lib/utils/error-message";
import { createContext, ReactNode, use, useCallback, useEffect, useMemo, useState } from "react";

type AuthContextValue = {
  /** null until the saved session has been read from the database. */
  state: auth.AuthState | null;
  /** Set when the saved session could not be read. */
  loadError: string | null;
  /** Reads the session again, e.g. after the database was reset. */
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (input: { name: string; email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<auth.AuthState | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoadError(null);
      setState(await auth.getAuthState());
    } catch (error) {
      setLoadError(errorMessage(error));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      loadError,
      refresh,
      signIn: async (email, password) => {
        const user = await auth.signIn(email, password);
        setState({ user, hasAccount: true });
      },
      register: async (input) => {
        const user = await auth.registerAccount(input);
        setState({ user, hasAccount: true });
      },
      signOut: async () => {
        await auth.signOut();
        setState({ user: null, hasAccount: true });
      },
    }),
    [state, loadError, refresh],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = use(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
