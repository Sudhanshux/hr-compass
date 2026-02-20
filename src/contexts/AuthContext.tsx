import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/models';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const dummyUsers: Record<string, User> = {
  'admin@hrms.com': { id: '1', email: 'admin@hrms.com', name: 'Admin User', role: 'admin' },
  'manager@hrms.com': { id: '2', email: 'manager@hrms.com', name: 'Manager User', role: 'manager' },
  'employee@hrms.com': { id: '3', email: 'employee@hrms.com', name: 'Employee User', role: 'employee' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('hrms_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback((email: string, _password: string) => {
    const found = dummyUsers[email];
    if (found) {
      setUser(found);
      localStorage.setItem('hrms_user', JSON.stringify(found));
      return true;
    }
    // Accept any email with password "password"
    if (_password === 'password') {
      const newUser: User = { id: Date.now().toString(), email, name: email.split('@')[0], role: 'employee' };
      setUser(newUser);
      localStorage.setItem('hrms_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hrms_user');
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    if (user) {
      const updated = { ...user, role };
      setUser(updated);
      localStorage.setItem('hrms_user', JSON.stringify(updated));
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
