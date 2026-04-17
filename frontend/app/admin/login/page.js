'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogin } from '../../../lib/api';
import { Eye, EyeOff, RefreshCcw, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@snackmaster.com');
  const [password, setPassword] = useState('admin123');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('sm_admin_token');
    if (token) router.replace('/admin');
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin(email, password);
      localStorage.setItem('sm_admin_token', res.data.token);
      localStorage.setItem('sm_admin_user', JSON.stringify(res.data.admin));
      router.push('/admin');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #1A0A00 0%, #2D1500 50%, #1A0A00 100%)' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FF6B00, transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #FFB800, transparent)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🍿</div>
          <h1
            className="text-white text-3xl font-bold"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            SnackMaster
          </h1>
          <p className="text-orange-300 text-sm mt-1 font-medium">Operations Dashboard</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-7 shadow-2xl">
          <h2
            className="text-gray-800 text-xl font-bold mb-1"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Admin Login
          </h2>
          <p className="text-gray-500 text-sm mb-6">Sign in to manage your vending machines</p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@snackmaster.io"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-base input-brand bg-gray-50 transition-all"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 pr-12 text-gray-800 text-base input-brand bg-gray-50 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RefreshCcw size={18} className="animate-spin" /> Signing in...
                </span>
              ) : (
                'Sign In →'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          SnackMaster Operations · snackmaster.io
        </p>
      </div>
    </div>
  );
}
