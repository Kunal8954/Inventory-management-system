const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const authService = {
  async login(email, password) {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/auth/login`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password })
      // });
      // return response.json();

      // Mock implementation
      return {
        success: true,
        user: {
          id: '1',
          name: 'John Doe',
          email: email,
          role: 'admin'
        },
        token: 'mock_jwt_token_' + Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async register(name, email, password) {
    try {
      // TODO: Replace with actual API call when backend is ready
      // const response = await fetch(`${API_BASE_URL}/auth/register`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ name, email, password })
      // });
      // return response.json();

      // Mock implementation
      return {
        success: true,
        user: {
          id: '1',
          name: name,
          email: email,
          role: 'user'
        },
        token: 'mock_jwt_token_' + Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  async verifyToken(token) {
    try {
      // TODO: Verify token with backend
      // const response = await fetch(`${API_BASE_URL}/auth/verify`, {
      //   headers: { 'Authorization': `Bearer ${token}` }
      // });
      // return response.json();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async logout() {
    try {
      // TODO: Call logout endpoint if needed
      // await fetch(`${API_BASE_URL}/auth/logout`, {
      //   method: 'POST',
      //   headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` }
      // });
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
