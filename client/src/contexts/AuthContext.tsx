import React, { createContext, useContext, useState, useCallback } from 'react';

interface User {
  name: string;
  email: string;
  role: string;
  avatar: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TEST_USER: User = {
  name: 'Leo Zhou',
  email: 'leo@meridian.ai',
  role: 'Account Executive',
  avatar: 'https://ui-avatars.com/api/?name=Leo+Zhou&background=4f46e5&color=fff&size=128',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('meridian_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // Simulated auth — accepts test credentials
    if (email === 'leo@meridian.ai' && password === 'demo123') {
      setUser(TEST_USER);
      localStorage.setItem('meridian_user', JSON.stringify(TEST_USER));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('meridian_user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
