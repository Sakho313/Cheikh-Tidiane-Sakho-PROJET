import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from '@/api/auth';
import { clearTokens, getAccessToken, setTokens } from '@/api/client';
import type { LoginPayload, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount, if a token is present, hydrate the profile via /auth/me.
  useEffect(() => {
    let active = true;
    const token = getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        clearTokens();
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await authApi.login(payload);
    setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      logout,
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
