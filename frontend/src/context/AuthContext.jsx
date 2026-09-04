import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, authHeader } from '../services/api';
import { TOKEN_KEY } from '../utils/session.js';
import { userCanAccessService } from '../utils/services.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function clearSession() {
    setToken(null);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  async function loadMe(currentToken) {
    if (!currentToken) {
      setUser(null);
      return;
    }
    try {
      const res = await api.get('/api/auth/me', { headers: authHeader(currentToken) });
      setUser(res.data.user);
    } catch (err) {
      if (err?.response?.status === 401) clearSession();
    }
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadMe(token);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    function onUnauthorized() {
      clearSession();
    }
    window.addEventListener('brainwave:unauthorized', onUnauthorized);
    return () => window.removeEventListener('brainwave:unauthorized', onUnauthorized);
  }, []);

  async function login(username, password) {
    const res = await api.post('/api/auth/login', { username, password });
    const nextToken = res.data.token;
    setToken(nextToken);
    localStorage.setItem(TOKEN_KEY, nextToken);
    await loadMe(nextToken);
    return res.data.user;
  }

  async function logout() {
    try {
      if (token) await api.post('/api/auth/logout', {}, { headers: authHeader(token) });
    } catch (_err) {
      // Client logout still proceeds.
    }
    clearSession();
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      logout,
      hasRole: (roleName) => Boolean(user?.roles?.includes(roleName)),
      canAccessService: (service) => userCanAccessService(user, service),
      canAccessAdmin: () => Boolean(user?.permissions?.includes('admin:portal:access')),
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
