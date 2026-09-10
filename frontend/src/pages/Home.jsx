import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LogIn,
  UserPlus,
  Mail,
  KeyRound,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Sun,
  Moon
} from 'lucide-react';
import { Brand } from '../components/ui/Brand';
import { cn } from '../lib/utils';

export default function Home() {
  const { user, login, register } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const intendedPath = () => {
    const next = new URLSearchParams(location.search).get('next');
    return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
  };

  const [mode, setMode] = useState(() => {
    const initialMode = new URLSearchParams(location.search).get('mode');
    return initialMode === 'register' || initialMode === 'signup' ? 'register' : 'login';
  });

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect authenticated users to their respective dashboard
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'librarian') navigate('/librarian', { replace: true });
      else navigate('/member', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const next = intendedPath();
      if (mode === 'login') {
        const authenticatedUser = await login(email, password, rememberMe);
        if (next) navigate(next, { replace: true });
        else if (authenticatedUser.role === 'admin') navigate('/admin', { replace: true });
        else if (authenticatedUser.role === 'librarian') navigate('/librarian', { replace: true });
        else navigate('/member', { replace: true });
      } else {
        const newUser = await register({ name, email, password, role: 'member' });
        if (next) navigate(next, { replace: true });
        else if (newUser.role === 'admin') navigate('/admin', { replace: true });
        else if (newUser.role === 'librarian') navigate('/librarian', { replace: true });
        else navigate('/member', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-bark-900">
      
      {/* Simple Top Navigation Header */}
      <header className="sticky top-0 z-30 border-b border-bark-100 dark:border-bark-800 bg-paper/95 px-4 py-4 sm:px-8 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Brand variant="mark" className="h-9 w-9 rounded-xl shadow-sm" />
            <span className="text-base font-extrabold tracking-tight text-bark-900">
              Maktaba<span className="text-tan-dark">Bora</span>
            </span>
          </div>

          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-xl border border-bark-100 bg-cream-light/40 hover:bg-cream dark:bg-bark-800 dark:border-bark-700 text-bark-700 dark:text-cream-light transition shadow-sm"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle dark mode"
          >
            {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-bark-700" />}
          </button>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-6">
          
          {/* Direct Title & Clear CTA Prompt */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-bark-900 tracking-tight">
              {mode === 'login' ? 'Sign In to Your Account' : 'Create a New Account'}
            </h1>
            <p className="text-xs sm:text-sm text-bark-600">
              {mode === 'login'
                ? 'Enter your email and password to access the library.'
                : 'Fill in your details below to register as a library member.'}
            </p>
          </div>

          {/* Clean 2-Option Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-cream-light/60 dark:bg-bark-800 border border-bark-100 dark:border-bark-700 rounded-2xl shadow-sm">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition focus:outline-none',
                mode === 'login'
                  ? 'bg-bark-700 text-cream-light shadow-sm'
                  : 'text-bark-700 hover:bg-paper dark:text-bark-300 dark:hover:bg-bark-700'
              )}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={cn(
                'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition focus:outline-none',
                mode === 'register'
                  ? 'bg-bark-700 text-cream-light shadow-sm'
                  : 'text-bark-700 hover:bg-paper dark:text-bark-300 dark:hover:bg-bark-700'
              )}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register</span>
            </button>
          </div>

          {/* Form Card */}
          <div className="bg-paper dark:bg-bark-900 border border-bark-100 dark:border-bark-800 rounded-2xl p-6 sm:p-8 shadow-card space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {mode === 'register' && (
                <div>
                  <label htmlFor="auth-name" className="block text-xs font-semibold text-bark-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-bark-500 absolute left-3.5 top-3.5" />
                    <input
                      id="auth-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Jane Doe"
                      required
                      className="w-full bg-paper dark:bg-bark-800 border border-bark-200 dark:border-bark-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-bark-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-bark-500 absolute left-3.5 top-3.5" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    className="w-full bg-paper dark:bg-bark-800 border border-bark-200 dark:border-bark-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-semibold text-bark-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-bark-500 absolute left-3.5 top-3.5" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-paper dark:bg-bark-800 border border-bark-200 dark:border-bark-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 focus:ring-2 focus:ring-tan-dark/50"
                  />
                </div>
              </div>

              {mode === 'login' && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-bark-700 font-medium">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-bark-300 text-bark-700 focus:ring-tan-dark"
                    />
                    <span>Remember me</span>
                  </label>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-cream-light" />
                ) : mode === 'login' ? (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

          </div>

          {/* Clean switch toggle hint */}
          <p className="text-center text-xs text-bark-700">
            {mode === 'login' ? (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(null); }}
                  className="font-bold text-tan-dark hover:text-bark-900 underline transition"
                >
                  Register here
                </button>
              </>
            ) : (
              <>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="font-bold text-tan-dark hover:text-bark-900 underline transition"
                >
                  Sign in here
                </button>
              </>
            )}
          </p>

        </div>
      </main>

    </div>
  );
}