import { api } from './api';

// Real auth service used by AuthContext
export const authService = {
	async login(email, password) {
		try {
			const data = await api.post('/auth/login', { email, password }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Login failed' };
		}
	},

	async register(name, email, password) {
		try {
			const data = await api.post('/auth/register', { name, email, password }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Registration failed' };
		}
	},

	async verifyToken() {
		try {
			const data = await api.get('/auth/verify');
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Verification failed' };
		}
	},

	async logout() {
		try {
			// Optionally call backend logout endpoint
			// await api.post('/auth/logout');
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	},
};

export default authService;