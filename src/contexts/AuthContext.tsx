import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiAuth } from '../api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    apiAuth.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null)) // Not logged in
      .finally(() => setIsLoading(false));
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await apiAuth.logout();
    } finally {
      setUser(null);
      // Optional: clear local state if jumping from synced to offline mode
      // localStorage.clear();
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
