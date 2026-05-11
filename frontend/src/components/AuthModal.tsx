import { useState } from 'react';
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
  const strengthColors = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backdropFilter: 'blur(12px)', background: 'rgba(5,7,20,0.85)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            {/* Card with gradient border */}
            <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-indigo-500/40 via-purple-500/40 to-cyan-400/20">
              <div className="bg-[#0a0d1f] rounded-2xl p-8">
                {/* Close */}
                <button
                  onClick={onClose}
                  className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition text-xl"
                >
                  ✕
                </button>

                {/* Logo */}
                <div className="flex items-center gap-2.5 mb-8">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-400 flex items-center justify-center font-bold text-white text-lg">
                    C
                  </div>
                  <div>
                    <div className="font-bold text-slate-100 text-lg leading-none">Nily AI</div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex rounded-xl bg-slate-900/60 border border-slate-800 p-1 mb-6">
                  {(['login', 'signup'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => { setMode(tab); setError(''); }}
                      className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                        mode === tab
                          ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white'
                          : 'text-slate-400 hover:text-slate-200'
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
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                          Full Name
                        </label>
                        <input
                          type="text"
                          required={mode === 'signup'}
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition text-sm"
                          placeholder="John Smith"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition text-sm"
                      placeholder="you@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition text-sm"
                      placeholder={mode === 'signup' ? 'Min 8 chars, 1 uppercase, 1 number' : '••••••••'}
                    />
                    {mode === 'signup' && form.password && (
                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-0.5 flex-1 rounded-full transition-colors ${
                              i <= strength ? strengthColors[strength] : 'bg-slate-800'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                    >
                      {error}
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                      </>
                    ) : (
                      mode === 'login' ? 'Sign in' : 'Create account'
                    )}
                  </button>
                </form>

                {mode === 'signup' && (
                  <p className="text-center text-slate-600 text-xs mt-4">
                    Free plan · 1 project included
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
