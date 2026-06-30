/**
 * Authentication Context
 * Manages global authentication state and user information
 */

import { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = authService.getToken();
    if (token) {
      const saved = localStorage.getItem('sca_user');
      setUser(saved ? JSON.parse(saved) : null);
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('sca_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authService.logout();
    localStorage.removeItem('sca_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
