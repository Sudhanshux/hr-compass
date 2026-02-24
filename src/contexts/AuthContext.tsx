import { authService } from '@/services/auth.service';
import React, { createContext, useContext, useState, useCallback } from 'react';
import { User, UserRole } from '@/types/models';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('hrms_user');
    return stored ? JSON.parse(stored) : null;
  });

const login = useCallback(
  async (email: string, password: string): Promise<boolean> => {
    try {
      const loginData = await authService.login({ email, password });

      // Save token
      localStorage.setItem('hrms_token', loginData.token);

      // Create user object
      const loggedInUser: User = {
        id: loginData.id,
        employeeId: loginData.employeeId,
        email: loginData.email,
        name: loginData.email.split('@')[0],
        role: loginData.roles.includes('ROLE_ADMIN')
          ? 'admin'
          : loginData.roles.includes('ROLE_MANAGER')
          ? 'manager'
          : 'employee',
      };

      setUser(loggedInUser);
      localStorage.setItem('hrms_user', JSON.stringify(loggedInUser));

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  },
  []
);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_token'); // ✅ also remove token
  }, []);

  const switchRole = useCallback(
    (role: UserRole) => {
      if (user) {
        const updated = { ...user, role };
        setUser(updated);
        localStorage.setItem('hrms_user', JSON.stringify(updated));
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
