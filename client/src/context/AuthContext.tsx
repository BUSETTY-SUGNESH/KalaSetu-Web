'use client';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, UserRole } from '@/types';

const uuid = () => crypto.randomUUID();

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupPayload {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasMultipleRoles: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  signup: (userData: SignupPayload) => Promise<User>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_USER_KEY = 'authUser';

const getStoredUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return null;
  }
};

const setStoredUser = (user: User | null) => {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(AUTH_USER_KEY);
    return;
  }
  window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string): Promise<User | null> => {
    const { data, error } = await supabase
      .from('User')
      .select('*, wallet:Wallet(*), kyc:Kyc(*)')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return data as unknown as User;
  }, []);

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) {
      setUser(profile);
      setStoredUser(profile);
    }
  }, [fetchProfile]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const cachedUser = getStoredUser();
        if (cachedUser) setUser(cachedUser);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          setStoredUser(null);
          setUser(null);
          return;
        }

        const profile = await fetchProfile(session.user.id);
        if (profile) {
          setUser(profile);
          setStoredUser(profile);
        } else {
          setStoredUser(null);
          setUser(null);
        }
      } catch {
        setStoredUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();

const { data: { subscription } } = supabase.auth.onAuthStateChange(
  async (_event, session) => {
    if (!session?.user?.id) {
      setStoredUser(null);
      setUser(null);
      return;
    }

    let profile = await fetchProfile(session.user.id);

    if (!profile) {
      const now = new Date().toISOString();

      await supabase.from('User').insert({
        id: session.user.id,
        name:
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          'New User',
        email: session.user.email,
        passwordHash: 'SUPABASE_OAUTH',
        role: 'CUSTOMER',
        roles: ['CUSTOMER'],
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      });

      await supabase.from('Wallet').insert({
        id: crypto.randomUUID(),
        userId: session.user.id,
        balance: 0,
        holdBalance: 0,
        updatedAt: now,
      });

      profile = await fetchProfile(session.user.id);
    }

    if (profile) {
      setUser(profile);
      setStoredUser(profile);
    }
  },
);
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);
  const signup = useCallback(async (userData: SignupPayload): Promise<User> => {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: { name: userData.name, role: userData.role },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Signup failed');

    // Create the profile row in the User table
    const role = userData.role;
    const now = new Date().toISOString();
    const { error: insertError } = await supabase.from('User').insert({
      id: data.user.id,
      name: userData.name,
      email: userData.email,
      passwordHash: 'SUPABASE_AUTH',
      role,
      roles: [role],
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    });
    if (insertError) throw new Error(insertError.message);

    // Create Artist profile if signing up as ARTIST
    if (role === 'ARTIST') {
      const { error: artistError } = await supabase.from('Artist').insert({
        id: uuid(),
        userId: data.user.id,
        bio: '',
        specialty: '',
        verificationStatus: 'PENDING',
        trustScore: 0,
        rating: 0,
        totalSales: 0,
      });
      if (artistError) throw new Error(artistError.message);
    }

    // Also create wallet
    const { error: walletError } = await supabase.from('Wallet').insert({
      id: uuid(),
      userId: data.user.id,
      balance: 0,
      holdBalance: 0,
      updatedAt: now,
    });
    if (walletError) throw new Error(walletError.message);

    const profile = await fetchProfile(data.user.id);
    if (!profile) throw new Error('Profile creation failed');
    setUser(profile);
    setStoredUser(profile);
    return profile;
  }, [fetchProfile]);
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Login failed');

  const profile = await fetchProfile(data.user.id);

  if (!profile) throw new Error('Profile not found');

  setUser(profile);
  setStoredUser(profile);

  return profile;
}, [fetchProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setStoredUser(null);
    setUser(null);
  }, []);

  const switchRole = useCallback(async (role: UserRole) => {
    if (!user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('User')
      .update({ role, updatedAt: new Date().toISOString() })
      .eq('id', user.id);
    if (error) throw new Error(error.message);
    const updated = { ...user, role };
    setUser(updated);
    setStoredUser(updated);
  }, [user]);

  const hasRole = useCallback((role: UserRole): boolean => {
    if (!user) return false;
    return user.roles?.includes(role) ?? user.role === role;
  }, [user]);

  const hasMultipleRoles = Boolean(user && user.roles && user.roles.length > 1);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      hasRole,
      hasMultipleRoles,
      login,
      signup,
      logout,
      switchRole,
      refreshProfile,
    }),
    [user, loading, hasRole, hasMultipleRoles, login, signup, logout, switchRole, refreshProfile],
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
