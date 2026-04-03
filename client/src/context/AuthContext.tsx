'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { getApiErrorMessage, refreshAccessToken } from '@/lib/api';
import { clearAccessToken, getAccessToken, setAccessToken } from '@/lib/authToken';
import { User } from '@/types';

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: 'BUYER' | 'ARTIST';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (userData: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_USER_KEY = 'authUser';

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

const setStoredUser = (user: User | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!user) {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const res = await api.get('/users/profile');
    setUser(res.data);
    setStoredUser(res.data);
  }, []);

  const bootstrapAuth = useCallback(async () => {
    try {
      const cachedUser = getStoredUser();
      if (cachedUser) {
        setUser(cachedUser);
      }

      let accessToken = getAccessToken();
      if (!accessToken) {
        accessToken = await refreshAccessToken();
      }

      if (!accessToken) {
        setStoredUser(null);
        setUser(null);
        return;
      }

      await refreshProfile();
    } catch {
      clearAccessToken();
      setStoredUser(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [refreshProfile]);

  useEffect(() => {
    void bootstrapAuth();
  }, [bootstrapAuth]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      const res = await api.post<{ accessToken: string; user: User }>('/auth/login', credentials);
      const { accessToken, user: authUser } = res.data;
      setAccessToken(accessToken);
      setUser(authUser);
      setStoredUser(authUser);

      try {
        await refreshProfile();
      } catch {
      }
      return authUser;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [refreshProfile]);

  const signup = useCallback(async (userData: SignupPayload) => {
    try {
      const res = await api.post<{ accessToken: string; user: User }>('/auth/signup', userData);
      const { accessToken, user: authUser } = res.data;
      setAccessToken(accessToken);
      setUser(authUser);
      setStoredUser(authUser);

      try {
        await refreshProfile();
      } catch {
      }
      return authUser;
    } catch (err) {
      throw new Error(getApiErrorMessage(err));
    }
  }, [refreshProfile]);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setStoredUser(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      refreshProfile,
    }),
    [user, loading, login, signup, logout, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
