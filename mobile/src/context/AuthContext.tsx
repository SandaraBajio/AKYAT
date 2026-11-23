import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, notificationsService, type AppUser } from "../services";

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

/** Wrap the app once. Read the signed-in user anywhere with `useAuth()`. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    return authService.onAuthChange((user) => {
      setState({ user, loading: false });
      if (user) void notificationsService.registerDevice(user.uid);
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
