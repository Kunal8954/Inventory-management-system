import { api } from './api';

export const authService = {
	async login(email, password) {
		try {
			const data = await api.post('/auth/login', { email, password }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Login failed' };
		}
	},

	async register(name, email, password, role) {
		try {
			const data = await api.post('/auth/register', { name, email, password, role }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Registration failed' };
		}
	},

	async verifyOtp(email, otp) {
		try {
			const data = await api.post('/auth/verify-otp', { email, otp }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Verification failed' };
		}
	},

	async resendOtp(email) {
		try {
			const data = await api.post('/auth/resend-otp', { email }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Failed to resend OTP' };
		}
	},

	async forgotPassword(email) {
		try {
			const data = await api.post('/auth/forgot-password', { email }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Failed to send reset code' };
		}
	},

	async resetPassword(email, otp, newPassword) {
		try {
			const data = await api.post('/auth/reset-password', { email, otp, new_password: newPassword }, { auth: false });
			return data;
		} catch (error) {
			return { success: false, error: error.message || 'Failed to reset password' };
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
			localStorage.removeItem('authToken');
			localStorage.removeItem('user');
			return { success: true };
		} catch (error) {
			return { success: false, error: error.message };
		}
	},
};

export default authService;