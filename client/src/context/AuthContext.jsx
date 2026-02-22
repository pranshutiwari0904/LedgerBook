import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ledgerbook_auth';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const boot = async () => {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        setIsInitializing(false);
        return;
      }

      try {
        const parsed = JSON.parse(raw);
        if (!parsed.token) {
          throw new Error('Invalid saved auth');
        }

        const meResponse = await authApi.me(parsed.token);
        setToken(parsed.token);
        setUser(meResponse.user);
      } catch (_error) {
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setIsInitializing(false);
      }
    };

    boot();
  }, []);

  const persistSession = (nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken }));
  };

  const login = async (payload) => {
    const response = await authApi.login(payload);
    persistSession(response.token, response.user);
    return response;
  };

  const register = async (payload) => {
    const response = await authApi.register(payload);
    persistSession(response.token, response.user);
    return response;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isInitializing,
      login,
      register,
      logout
    }),
    [token, user, isInitializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
