import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiLoader, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { registerCustomer } from '../services/shopService';

export default function ShopRegister() {
  const [step, setStep] = useState('form'); // 'form' | 'otp'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { verifyOtp, resendOtp } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await registerCustomer(formData.name, formData.email, formData.password, formData.phone);
    setLoading(false);

    if (result.success) {
      setInfo(`We've sent a 6-digit code to ${result.email}. Enter it below to finish creating your account.`);
      setStep('otp');
    } else {
      setError(result.error || 'Registration failed. Please try again.');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }

    setLoading(true);
    const result = await verifyOtp(formData.email, otp);
    setLoading(false);

    if (result.success) {
      navigate('/shop');
    } else {
      setError(result.error || 'Verification failed. Please check the code and try again.');
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    const result = await resendOtp(formData.email);
    setResending(false);

    if (result.success) {
      setInfo('A new code has been sent to your email.');
    } else {
      setError(result.error || 'Failed to resend code');
    }
  };

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
          <p className="text-slate-600">{step === 'form' ? 'Create your account' : 'Verify your email'}</p>
        </div>

        <div className="bg-white rounded-xl shadow-soft-lg p-8 border border-slate-200">
          {step === 'form' ? (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-6">Sign up to order</h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Full Name</label>
                  <div className="relative">
                    <FiUser className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Phone (optional)</label>
                  <div className="relative">
                    <FiPhone className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="9876543210"
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
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

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {formData.confirmPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <FiCheck className="text-green-600" size={16} />
                          <span className="text-xs text-green-600 font-medium">Passwords match</span>
                        </>
                      ) : (
                        <span className="text-xs text-red-600 font-medium">Passwords do not match</span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-slate-600 text-sm">
                Already have an account?{' '}
                <Link to="/shop/login" className="text-accent-600 hover:text-accent-700 font-semibold transition">
                  Sign in here
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Enter verification code</h2>
              <p className="text-sm text-slate-500 mb-6">
                Sent to <span className="font-medium text-slate-700">{formData.email}</span>
              </p>

              {info && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-700 text-sm">{info}</p>
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">6-digit code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full text-center tracking-[0.5em] text-lg font-semibold pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-300 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Continue'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-slate-600 text-sm">
                Didn't get the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-accent-600 hover:text-accent-700 font-semibold transition disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}