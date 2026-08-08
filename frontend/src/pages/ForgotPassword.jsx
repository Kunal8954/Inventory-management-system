import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLoader, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';

export default function ForgotPassword() {
  const [step, setStep] = useState('request'); // 'request' | 'reset' | 'done'
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Enter your email address');
      return;
    }

    setLoading(true);
    const result = await forgotPassword(email);
    setLoading(false);

    // Backend always returns success (doesn't reveal whether the email is registered) —
    // so we always move to the next step here too.
    if (result.success) {
      setInfo(`If ${email} is registered, a reset code has been sent to it.`);
      setStep('reset');
    } else {
      setError(result.error || 'Something went wrong. Please try again.');
    }
  };

  const handleResend = async () => {
    setError('');
    setInfo('');
    setResending(true);
    const result = await forgotPassword(email);
    setResending(false);

    if (result.success) {
      setInfo('A new code has been sent, if that email is registered.');
    } else {
      setError(result.error || 'Failed to resend code');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (result.success) {
      setStep('done');
    } else {
      setError(result.error || 'Failed to reset password. The code may be invalid or expired.');
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-400 to-accent-600 rounded-lg flex items-center justify-center shadow-soft-md">
              <span className="text-3xl font-bold text-white">📦</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">StockPilot</h1>
          <p className="text-slate-600">
            {step === 'request' && 'Reset your password'}
            {step === 'reset' && 'Enter code and new password'}
            {step === 'done' && 'Password reset'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-soft-lg p-8 border border-slate-200">
          {step === 'request' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Forgot your password?</h2>
              <p className="text-sm text-slate-500 mb-6">
                Enter your email and we'll send you a 6-digit code to reset it.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleRequestCode} className="space-y-4">
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <FiMail className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-300 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-accent-600 hover:bg-accent-700 disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      Sending code...
                    </>
                  ) : (
                    'Send Reset Code'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-slate-600 text-sm">
                <Link to="/login" className="text-accent-600 hover:text-accent-700 font-semibold transition">
                  Back to sign in
                </Link>
              </div>
            </>
          )}

          {step === 'reset' && (
            <>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Enter code and new password</h2>
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

              <form onSubmit={handleResetPassword} className="space-y-4">
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

                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
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
                  <label className="block text-slate-700 text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <FiLock className="absolute left-3 top-3 text-slate-400 text-lg" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {confirmPassword && (
                    <div className="mt-2 flex items-center gap-2">
                      {newPassword === confirmPassword ? (
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
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
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

          {step === 'done' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <FiCheck className="text-green-600 text-2xl" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2 text-center">Password reset</h2>
              <p className="text-sm text-slate-500 mb-6 text-center">
                Your password has been changed. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-accent-600 hover:bg-accent-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                Go to Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}