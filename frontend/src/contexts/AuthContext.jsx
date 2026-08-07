import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  const normalizeUser = (value) => {
    if (!value || typeof value !== 'object') {
      return null;
    }

    if (value.user && typeof value.user === 'object') {
      return value.user;
    }

    if (value.id || value.name || value.email || value.role) {
      return value;
    }

    return null;
  };

  useEffect(() => {
    // On mount, if there's a token try to verify it and fetch user
    let mounted = true;
    const init = async () => {
      const storedToken = localStorage.getItem('authToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (err) {
            // ignore parse errors
            localStorage.removeItem('user');
          }
        }

        try {
          const res = await authService.verifyToken();
          const verifiedUser = normalizeUser(res);
          if (verifiedUser && mounted) {
            const u = verifiedUser;
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
          }
        } catch (err) {
          // Token invalid or network error - clear and redirect handled by api helper on 401
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          setUser(null);
          setToken(null);
        }
      }

      if (mounted) setLoading(false);
    };

    init();
    return () => (mounted = false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);

      // Accept multiple possible response shapes from backend
      const tokenFromRes = res && (res.token || res.accessToken || res.data?.token);
      const userFromRes = normalizeUser(res) || res?.user || res?.data?.user || null;

      if (tokenFromRes) {
        localStorage.setItem('authToken', tokenFromRes);
        setToken(tokenFromRes);
      }

      if (userFromRes) {
        localStorage.setItem('user', JSON.stringify(userFromRes));
        setUser(userFromRes);
        return { success: true, user: userFromRes };
      }

      // If token returned but user not in payload, attempt to verify
      if (tokenFromRes && !userFromRes) {
        try {
          const v = await authService.verifyToken();
          const u = normalizeUser(v) || userFromRes || JSON.parse(localStorage.getItem('user') || 'null');
          if (u) {
            localStorage.setItem('user', JSON.stringify(u));
            setUser(u);
            return { success: true, user: u };
          }
        } catch (err) {
          return { success: false, error: err.message || 'Verification failed' };
        }
      }

      // If backend returned a full success object with user/token at top-level
      if (res && res.success && (res.user || res.token)) {
        const u = res.user || (res.data && res.data.user) || null;
        const t = res.token || (res.data && res.data.token) || null;
        if (t) {
          localStorage.setItem('authToken', t);
          setToken(t);
        }
        if (u) {
          localStorage.setItem('user', JSON.stringify(u));
          setUser(u);
        }
        return { success: true, user: u };
      }

      return { success: false, error: res && res.error ? res.error : 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, confirmPassword) => {
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      const res = await authService.register(name, email, password);

      const tokenFromRes = res && (res.token || res.accessToken || res.data?.token);
      const userFromRes = normalizeUser(res) || res?.user || res?.data?.user || null;

      if (tokenFromRes) {
        localStorage.setItem('authToken', tokenFromRes);
        setToken(tokenFromRes);
      }

      if (userFromRes) {
        localStorage.setItem('user', JSON.stringify(userFromRes));
        setUser(userFromRes);
        return { success: true, user: userFromRes };
      }

      return { success: false, error: res && res.error ? res.error : 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
    // Redirect to login
    window.location.assign('/login');
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, isAuthenticated, login, register, logout }}
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
