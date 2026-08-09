import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    setLoading(true);

    // Validate email format
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }

    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    // Note: Backend will verify if user exists and credentials match
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const role = (result.user?.role || '').toLowerCase();
      window.location.assign(role === 'customer' ? '/shop' : '/dashboard');
    } else {
      // If user doesn't exist, show helpful message
      setErrors({
        general: result.error || 'Invalid email or password. Please check your credentials or create an account.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center shadow-soft-md">
              <span className="text-3xl font-bold text-white">📦</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">StockPilot</h1>
          <p className="text-slate-600">Inventory Management System</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-soft-lg p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Welcome Back</h2>

          {/* General Error Message */}
          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3 text-slate-400 text-lg" />
                <input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="user@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition ${
                    errors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                      : 'border-slate-200 focus:border-accent-500 focus:ring-accent-300'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <FiAlertCircle size={14} /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-slate-400 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-10 py-2.5 bg-white border rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 transition ${
                    errors.password
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-300'
                      : 'border-slate-200 focus:border-accent-500 focus:ring-accent-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-start gap-1">
                  <FiAlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me + Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center text-slate-600 hover:text-slate-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 bg-white accent-accent-600" />
                <span className="ml-2 text-sm">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-accent-600 hover:text-accent-700 font-medium transition">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">Don't have an account?</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-slate-600 mb-3">
              Create a new account to get started
            </p>
            <Link
              to="/register"
              className="w-full inline-block bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2.5 rounded-lg transition"
            >
              Create Account
            </Link>
          </div>

          {/* Customer Shop Link */}
          <div className="text-center mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Looking to place an order instead?{' '}
              <Link to="/shop/login" className="text-accent-600 hover:text-accent-700 font-semibold transition">
                Go to the customer shop
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-slate-500 text-sm">
          <p>© 2024 StockPilot. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}