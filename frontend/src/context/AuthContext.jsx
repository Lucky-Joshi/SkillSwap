import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../services/auth';
import { API_BASE } from '../utils/constants';

const AuthContext = createContext(null);

const TOKEN_KEY = 'skillswap_token';
const USER_KEY = 'skillswap_user';

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || null);
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY)) || null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!!token);

  const storeAuth = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await authService.login({ email, password });
      storeAuth(res.token, res.user);
      toast.success(`Welcome back, ${res.user.name.split(' ')[0]}!`);
      return res.user;
    },
    [storeAuth]
  );

  const register = useCallback(
    async (payload) => {
      const res = await authService.register(payload);
      storeAuth(res.token, res.user);
      return res;
    },
    [storeAuth]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const refresh = useCallback(async () => {
    if (!token) return null;
    const res = await authService.me();
    updateUser(res.user);
    return res.user;
  }, [token, updateUser]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    authService
      .me()
      .then((res) => {
        if (!cancelled) updateUser(res.user);
      })
      .catch(() => {
        if (!cancelled) {
          logout();
          toast.error('Session expired. Please log in again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = useMemo(
    () => ({ token, user, loading, login, register, logout, updateUser, refresh }),
    [token, user, loading, login, register, logout, updateUser, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { TOKEN_KEY };
