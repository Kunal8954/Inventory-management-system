import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiLock, FiEye, FiEyeOff, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

const GOOGLE_CLIENT_ID = '657258323655-g3d9b8cf3ck8ps4tr4bu7dums2ban9e5.apps.googleusercontent.com';

export default function ShopLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Enter your email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const role = (result.user?.role || '').toLowerCase();
      // A staff/admin account that lands here still goes to the right place.
      window.location.assign(role === 'customer' ? '/shop' : '/dashboard');
    } else {
      setError(result.error || 'Invalid email or password.');
    }
  };

  const handleGoogleResponse = async (response) => {
    setError('');
    setLoading(true);
    const result = await loginWithGoogle(response.credential);
    setLoading(false);

    if (result.success) {
      const role = (result.user?.role || '').toLowerCase();
      window.location.assign(role === 'customer' ? '/shop' : '/dashboard');
    } else {
      setError(result.error || 'Google sign-in failed.');
    }
  };

  useEffect(() => {
    const renderButton = () => {
      const container = document.getElementById('google-signin-btn');
      if (!window.google || !container) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
      });
    };

    if (window.google) {
      renderButton();
      return;
    }

    const scriptId = 'google-identity-script';
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener('load', renderButton);
    return () => script.removeEventListener('load', renderButton);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center shadow-soft-md">
              <span className="text-3xl font-bold text-white">🛍️</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">StockPilot Shop</h1>
          <p className="text-slate-600">Sign in to order</p>
        </div>

        <Link
          to="/shop"
          className="flex items-center justify-center gap-2 w-full mb-6 py-3 rounded-xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
        >
          Just want to look around? Browse without an account →
        </Link>

        <div className="bg-white rounded-xl shadow-soft-lg p-8 border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900 mb-6">Welcome Back</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <FiAlertCircle className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Email or Phone Number</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3 text-slate-400 text-lg" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-3 text-slate-400 text-lg" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-accent-600 hover:text-accent-700 font-medium transition">
                Forgot password?
              </Link>
            </div>

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

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          <div className="flex justify-center">
            <div id="google-signin-btn"></div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">New here?</span>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/shop/register"
              className="w-full inline-block bg-slate-100 hover:bg-slate-200 text-slate-900 font-semibold py-2.5 rounded-lg transition"
            >
              Create a Customer Account
            </Link>
          </div>

          <div className="text-center mt-4 pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Store staff?{' '}
              <Link to="/login" className="text-accent-600 hover:text-accent-700 font-semibold transition">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}