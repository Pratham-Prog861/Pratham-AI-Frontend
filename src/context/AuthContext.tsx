import { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  username: string | null;
  login: (username: string) => void;
  logout: () => void;
  isLoggedIn: boolean;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('username'));

  const login = (username: string) => {
    localStorage.setItem('username', username);
    setUsername(username);
    setIsLoggedIn(true);
  };

  const logout = () => {
    localStorage.removeItem('username');
    setUsername(null);
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ 
      username, 
      login, 
      logout, 
      isLoggedIn 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};