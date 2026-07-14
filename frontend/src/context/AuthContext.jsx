import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getDashboardPath } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await authAPI.getProfile();
      setUser(data.data);
    } catch {
      localStorage.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Listen for token-expiry events dispatched by the Axios interceptor.
  // We only clear state here — ProtectedRoute handles the redirect to /login.
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
    };
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const register = async (userData) => {
    const { data } = await authAPI.register(userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data.data.user;
  };

  const registerPharmacy = async (formData) => {
    const { data } = await authAPI.registerPharmacy(formData);
    return data;
  };

  const registerDentist = async (userData) => {
    const { data } = await authAPI.registerDentist(userData);
    return data;
  };

  const registerPharmacyUser = async (userData) => {
    const { data } = await authAPI.registerPharmacyUser(userData);
    return data;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      /* ignore */
    }
    localStorage.clear();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    registerPharmacy,
    registerDentist,
    registerPharmacyUser,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDentist: user?.role === 'dentist',
    isPharmacy: user?.role === 'pharmacy',
    isUser: user?.role === 'user' || (!user?.role && !!user),
    getDashboardPath: () => getDashboardPath(user?.role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export default AuthContext;
