import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5000/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // const data = await response.json();
      
      // Mock login - remove when backend is ready
      const mockUser = {
        id: '1',
        name: 'John Doe',
        email: email,
        role: 'admin',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'
      };
      const mockToken = 'mock_jwt_token_' + Date.now();
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', mockToken);
      
      setUser(mockUser);
      setToken(mockToken);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
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

      // TODO: Replace with actual API call
      // const response = await fetch('http://localhost:5000/api/auth/register', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password })
      // });
      // const data = await response.json();

      // Mock registration - remove when backend is ready
      const mockUser = {
        id: '1',
        name: name,
        email: email,
        role: 'user',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
      };
      const mockToken = 'mock_jwt_token_' + Date.now();
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('authToken', mockToken);
      
      setUser(mockUser);
      setToken(mockToken);
      return { success: true, user: mockUser };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setToken(null);
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
        register,
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
