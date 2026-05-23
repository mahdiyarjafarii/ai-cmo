import { useState } from 'react';
import logoUrl from '../assets/logo.png';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../services/authApi';
import { useAuthStore } from '../store/authStore';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const setUser = useAuthStore((s) => s.setUser);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } =
        mode === 'login'
          ? await authApi.login({ email: form.email, password: form.password })
          : await authApi.register(form);
      setUser(data.user);
      onSuccess();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        (mode === 'login' ? 'Invalid email or password' : 'Registration failed');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = (pw: string) => {
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Z]/.test(pw)) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    return s;
  };

  const strength = passwordStrength(form.password);
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-400', 'bg-blue-500', 'bg-green-500'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
          >
            {/* Top accent */}
            <div className="h-1 bg-gradient-to-r from-[#fc6423] to-[#fb923c]" />

            <div className="p-8">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100"
              >
                ✕
              </button>

              {/* Logo */}
              <div className="flex items-center gap-2.5 mb-8">
                <img src={logoUrl} alt="logo" className="w-9 h-9 object-contain" />
                <div className="font-bold text-gray-900 text-lg leading-none">Nily AI</div>
              </div>

              {/* Tabs */}
              <div className="flex rounded-xl bg-gray-100 border border-gray-200 p-1 mb-6">
                {(['login', 'signup'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setMode(tab); setError(''); }}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                      mode === tab
                        ? 'bg-[#fc6423] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab === 'login' ? 'Sign in' : 'Sign up'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <AnimatePresence mode="wait">
                  {mode === 'signup' && (
                    <motion.div
                      key="name"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Full Name</label>
                      <input
                        type="text"
                        required={mode === 'signup'}
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#fc6423] focus:ring-1 focus:ring-[#fc6423]/30 transition text-sm"
                        placeholder="John Smith"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Email</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#fc6423] focus:ring-1 focus:ring-[#fc6423]/30 transition text-sm"
                    placeholder="you@company.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#fc6423] focus:ring-1 focus:ring-[#fc6423]/30 transition text-sm"
                    placeholder={mode === 'signup' ? 'Min 8 chars, 1 uppercase, 1 number' : '••••••••'}
                  />
                  {mode === 'signup' && form.password && (
                    <div className="mt-2 flex gap-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`h-0.5 flex-1 rounded-full transition-colors ${i <= strength ? strengthColors[strength] : 'bg-gray-200'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#fc6423] hover:bg-[#e55a1c] disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-sm shadow-[#fc6423]/20"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                    </>
                  ) : (
                    mode === 'login' ? 'Sign in' : 'Create account'
                  )}
                </button>
              </form>

              {mode === 'signup' && (
                <p className="text-center text-gray-400 text-xs mt-4">
                  Free plan · 1 project included
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
