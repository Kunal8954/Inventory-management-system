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

  const applySession = (res) => {
    const tokenFromRes = res && (res.token || res.accessToken || res.data?.token);
    const userFromRes = normalizeUser(res) || res?.user || res?.data?.user || null;

    if (tokenFromRes) {
      localStorage.setItem('authToken', tokenFromRes);
      setToken(tokenFromRes);
    }
    if (userFromRes) {
      localStorage.setItem('user', JSON.stringify(userFromRes));
      setUser(userFromRes);
    }
    return userFromRes;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authService.login(email, password);

      if (res && res.needsVerification) {
        return { success: false, needsVerification: true, email: res.email || email, error: res.error };
      }

      const userFromRes = applySession(res);

      if (userFromRes) {
        return { success: true, user: userFromRes };
      }

      if (res && res.success && (res.user || res.token)) {
        const u = res.user || (res.data && res.data.user) || null;
        return { success: true, user: u };
      }

      return { success: false, error: res && res.error ? res.error : 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential) => {
    setLoading(true);
    try {
      const res = await authService.loginWithGoogle(credential);
      const userFromRes = applySession(res);

      if (userFromRes) {
        return { success: true, user: userFromRes };
      }

      return { success: false, error: res && res.error ? res.error : 'Google sign-in failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Google sign-in failed' };
    } finally {
      setLoading(false);
    }
  };

  // register: does NOT log the user in anymore. Backend sends an OTP email
  // and the caller (Register page) is responsible for showing the OTP step.
  const register = async (name, email, password, confirmPassword, role) => {
    setLoading(true);
    try {
      if (password !== confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      const res = await authService.register(name, email, password, role);

      if (res && res.success) {
        return { success: true, needsVerification: true, email: res.email || email };
      }

      return { success: false, error: res && res.error ? res.error : 'Registration failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Called after the user enters the OTP they received by email.
  // On success, this logs them in (same effect as login()).
  const verifyOtp = async (email, otp) => {
    setLoading(true);
    try {
      const res = await authService.verifyOtp(email, otp);
      const userFromRes = applySession(res);

      if (userFromRes) {
        return { success: true, user: userFromRes };
      }

      return { success: false, error: res && res.error ? res.error : 'Verification failed' };
    } catch (error) {
      return { success: false, error: error.message || 'Verification failed' };
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await authService.resendOtp(email);
      return res;
    } catch (error) {
      return { success: false, error: error.message || 'Failed to resend OTP' };
    }
  };

  // Step 1 of password reset: request an OTP be sent to the given email.
  const forgotPassword = async (email) => {
    try {
      const res = await authService.forgotPassword(email);
      return res;
    } catch (error) {
      return { success: false, error: error.message || 'Failed to send reset code' };
    }
  };

  // Step 2 of password reset: submit the OTP + new password. Does NOT log the user in —
  // they go back to the login page and sign in with the new password.
  const resetPassword = async (email, otp, newPassword) => {
    try {
      const res = await authService.resetPassword(email, otp, newPassword);
      return res;
    } catch (error) {
      return { success: false, error: error.message || 'Failed to reset password' };
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
    window.location.assign('/login');
  };

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        loginWithGoogle,
        register,
        verifyOtp,
        resendOtp,
        forgotPassword,
        resetPassword,
        logout,
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