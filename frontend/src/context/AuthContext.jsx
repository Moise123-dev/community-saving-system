import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('css_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Verify token on mount
  useEffect(() => {
    const token = localStorage.getItem('css_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('css_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('css_token');
          localStorage.removeItem('css_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // Listen for forced logout (e.g. role mismatch on login page)
  useEffect(() => {
    const handleForceLogout = () => {
      localStorage.removeItem('css_token');
      localStorage.removeItem('css_user');
      setUser(null);
    };
    window.addEventListener('css_logout', handleForceLogout);
    return () => window.removeEventListener('css_logout', handleForceLogout);
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('css_token', res.data.token);
    localStorage.setItem('css_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data; // caller checks role match
  };

  const logout = useCallback(() => {
    localStorage.removeItem('css_token');
    localStorage.removeItem('css_user');
    setUser(null);
  }, []);

  const isManager = user?.role === 'manager';

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, isManager }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
