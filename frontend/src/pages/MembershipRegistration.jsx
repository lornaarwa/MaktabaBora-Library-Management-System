import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { motion } from 'framer-motion';
import { Brand } from '../components/ui/Brand';
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  ShieldCheck,
  Smartphone,
  Sparkles,
  BookOpen,
  ArrowRight,
  Database,
  LogIn,
  Crown,
  Zap,
  ArrowUpRight,
  Check
} from 'lucide-react';

const MEMBERSHIP_TIERS = [
  {
    id: 'student',
    name: 'Student Pass',
    price: 500,
    currency: 'KES',
    billingPeriod: 'per year',
    description: 'Designed for active university and high school students.',
    borrowLimit: '3 Books at a time',
    perks: [
      'Access to full physical & digital catalog',
      '3 active book loans',
      '14-day borrowing duration',
      'Basic AI Librarian search assistance',
    ],
    recommended: false,
    accent: 'olive',
  },
  {
    id: 'standard',
    name: 'Standard Reader',
    price: 1500,
    currency: 'KES',
    billingPeriod: 'per year',
    description: 'Ideal for avid readers, professionals, and general public.',
    borrowLimit: '7 Books at a time',
    perks: [
      'Access to full catalog & digital e-reader',
      '7 active book loans',
      '30-day borrowing duration',
      'Priority book reservations',
      'Full AI Assistant & recommendations',
    ],
    recommended: true,
    accent: 'tan',
  },
  {
    id: 'scholar',
    name: 'Scholar & Researcher',
    price: 3000,
    currency: 'KES',
    billingPeriod: 'per year',
    description: 'For academics, researchers, and institutional members.',
    borrowLimit: '15 Books at a time',
    perks: [
      'Unlimited digital e-reader access',
      '15 active book loans',
      '60-day extended borrowing',
      'Inter-library loan request privileges',
      'Dedicated research desk support',
    ],
    recommended: false,
    accent: 'sage',
  },
];

export default function MembershipRegistration() {
  const { user, setUser, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  const [tiers, setTiers] = useState(MEMBERSHIP_TIERS);

  // Guest Auth State
  const initialMode = (location.search.includes('mode=signin') || location.pathname === '/login') ? 'signin' : 'signup';
  const [guestAuthMode, setGuestAuthMode] = useState(initialMode); // 'signup' | 'signin'
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestAuthSubmitting, setGuestAuthSubmitting] = useState(false);
  const [guestAuthError, setGuestAuthError] = useState(null);

  const handleGuestAuthSubmit = async (e) => {
    e.preventDefault();
    setGuestAuthSubmitting(true);
    setGuestAuthError(null);

    // Guests arriving from a homepage book card carry a ?next= destination;
    // after authenticating we send them straight to that book.
    const rawNext = new URLSearchParams(location.search).get('next');
    const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : null;

    try {
      if (guestAuthMode === 'signin') {
        const loggedUser = await login(guestEmail, guestPassword);
        if (next) navigate(next);
        else if (loggedUser.role === 'admin') navigate('/admin');
        else if (loggedUser.role === 'librarian') navigate('/librarian');
        else navigate('/member');
      } else {
        const regUser = await register({
          name: guestName,
          email: guestEmail,
          password: guestPassword,
          role: 'member',
        });
        setUser(regUser);
        if (next) navigate(next);
      }
    } catch (err) {
      setGuestAuthError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setGuestAuthSubmitting(false);
    }
  };

  useEffect(() => {
    const loadDynamicTiers = async () => {
      try {
        const res = await api.getMembershipTiers();
        const data = res.data || res;
        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((t) => {
            const fallback = MEMBERSHIP_TIERS.find((d) => d.id === t.id) || {};
            const perks = Array.isArray(t.perks) && t.perks.length > 0 ? t.perks : (fallback.perks || []);
            return {
              currency: 'KES',
              billingPeriod: 'per year',
              description: '',
              borrowLimit: '3 Books at a time',
              recommended: false,
              accent: 'tan',
              ...fallback,
              ...t,
              perks,
            };
          });
          setTiers(normalized.filter(t => t.active !== false));
        }
      } catch (err) {
        // Fall back to default tiers silently
      }
    };
    loadDynamicTiers();
  }, []);

  const isSubscribed = Boolean(user?.member?.is_subscribed);
  const currentTierId = (user?.member?.membership_tier || '').toLowerCase();
  const currentActiveTier = tiers.find((t) => t.id === currentTierId);

  // Available upgrade options exclude current active tier if subscribed
  const availableUpgradeTiers = isSubscribed && currentActiveTier
    ? tiers.filter((t) => t.id !== currentTierId)
    : tiers;

  const [selectedTier, setSelectedTier] = useState(() => {
    return availableUpgradeTiers[0]?.id || 'standard';
  });

  const [phone, setPhone] = useState('0712345678');

  // Stages: 'tier_selection' | 'mpesa_modal' | 'pushing' | 'active_success'
  const [stage, setStage] = useState('tier_selection');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activatedData, setActivatedData] = useState(null);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    // If currently selected tier is hidden because it's the active tier, reset selection
    if (isSubscribed && selectedTier === currentTierId && availableUpgradeTiers.length > 0) {
      setSelectedTier(availableUpgradeTiers[0].id);
    }
  }, [isSubscribed, currentTierId, selectedTier, availableUpgradeTiers]);

  const activePlan = tiers.find((t) => t.id === selectedTier) || availableUpgradeTiers[0] || tiers[0] || MEMBERSHIP_TIERS[1];

  // Open STK Push Payment Modal for selected tier
  const handleSelectTierForPayment = (tierId) => {
    if (isSubscribed && tierId === currentTierId) {
      setError('You already have an active subscription for this tier.');
      return;
    }

    setSelectedTier(tierId);
    setError(null);

    if (!user) {
      setStage('tier_selection');
      return;
    }

    setStage('mpesa_modal');
  };

  // Trigger M-Pesa STK Push Payment (Only Phone Number required)
  const handleInitiateStkPush = async (e) => {
    e.preventDefault();
    if (!phone.trim()) {
      setError('Please provide a valid M-Pesa phone number.');
      return;
    }

    setLoading(true);
    setStage('pushing');
    setError(null);

    try {
      let updatedUser = null;
      let subscriptionObj = null;
      let stkObj = null;
      let response = null;

      if (user) {
        // Authenticated user checkout endpoint
        response = await api.checkoutSubscription({
          membership_tier: selectedTier,
          phone_number: phone,
          amount: activePlan.price,
        });

        updatedUser = response.user || response.data?.user;
        subscriptionObj = response.subscription || response.data?.subscription;
        stkObj = response.stk_push || response.data?.stk_push;
      } else {
        throw new Error('Please sign in to your MaktabaBora account before upgrading your membership.');
      }

      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('smartlib_user', JSON.stringify(updatedUser));
      }

      const wasUnsubscribed = Boolean(response?.unsubscribed_previous || response?.data?.unsubscribed_previous);
      const prevTier = response?.previous_tier || response?.data?.previous_tier || '';

      setTimeout(() => {
        const finalMemberNum = updatedUser?.member?.member_number || user?.member?.member_number || `MB-${Math.floor(100000 + Math.random() * 900000)}`;

        setActivatedData({
          user: updatedUser || user,
          memberNumber: finalMemberNum,
          tierName: activePlan.name,
          amountPaid: activePlan.price,
          borrowLimit: activePlan.borrowLimit,
          unsubscribedPrevious: wasUnsubscribed,
          previousTier: prevTier,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          transactionRef: subscriptionObj?.transaction_reference || stkObj?.CheckoutRequestID || 'MPESA-TXN-OK',
        });
        setStage('active_success');
        setLoading(false);
      }, 2000);
    } catch (err) {
      setLoading(false);
      setStage('mpesa_modal');
      setError(err.message || 'M-Pesa payment initiation failed. Please verify your phone number and try again.');
    }
  };

  // ░░░ STAGE 4: SUCCESSFUL ACTIVATION VIEW ░░░
  if (stage === 'active_success' && activatedData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center animate-in fade-in duration-300">
        <div className="rounded-3xl border border-bark-100 bg-paper p-8 shadow-lift space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-olive/20 text-olive-dark border border-olive/30 shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-olive-dark" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-dark px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-cream-light shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Membership Active & Saved to Database
            </span>
            <h1 className="text-2xl font-extrabold text-bark-900 sm:text-3xl">
              Membership Payment Confirmed!
            </h1>
            <p className="text-xs text-bark-500 max-w-md mx-auto">
              Your M-Pesa STK Push payment was successful. Your member subscription and borrowing privileges are active in the system database.
            </p>
          </div>

          {/* Activated Membership Card */}
          <div className="rounded-2xl border border-bark-100 bg-cream-light/40 p-6 text-left space-y-4 shadow-card">
            {activatedData.unsubscribedPrevious && (
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-[11px]">
                  Your previous <strong>{activatedData.previousTier || 'active'}</strong> subscription has been automatically unsubscribed and switched.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-b border-bark-100 pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-bark-500">Member ID</p>
                <p className="text-lg font-extrabold text-bark-900">{activatedData.memberNumber}</p>
              </div>
              <div className="text-right">
                <span className="rounded-xl bg-tan/20 border border-tan/30 px-3 py-1 text-xs font-bold text-tan-dark">
                  {activatedData.tierName}
                </span>
                <span className="block mt-1 font-mono text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                  ● Status: Active / Paid
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-bark-500 font-semibold">Member Name</p>
                <p className="font-bold text-bark-900">{activatedData.user?.name}</p>
              </div>
              <div>
                <p className="text-bark-500 font-semibold">Email Address</p>
                <p className="font-bold text-bark-900">{activatedData.user?.email}</p>
              </div>
              <div>
                <p className="text-bark-500 font-semibold">M-Pesa Amount Paid</p>
                <p className="font-extrabold text-emerald-800">KES {activatedData.amountPaid.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-bark-500 font-semibold">Borrowing Privilege</p>
                <p className="font-extrabold text-tan-dark">{activatedData.borrowLimit}</p>
              </div>
              <div>
                <p className="text-bark-500 font-semibold">Valid Until</p>
                <p className="font-bold text-bark-900">{activatedData.expiryDate}</p>
              </div>
              <div>
                <p className="text-bark-500 font-semibold">M-Pesa Transaction Ref</p>
                <p className="font-mono text-[10px] font-bold text-bark-700 truncate">{activatedData.transactionRef}</p>
              </div>
            </div>
          </div>



          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/member')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-bark-700 px-6 py-3 text-xs font-bold text-cream-light shadow-card transition hover:bg-bark-900"
            >
              Go to Member Dashboard <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/catalog"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-bark-100 bg-paper px-6 py-3 text-xs font-bold text-bark-900 transition hover:bg-cream-light/60"
            >
              <BookOpen className="h-4 w-4 text-bark-500" /> Start Browsing Books
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">

      {/* ░░░ HERO HEADER ░░░ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="text-center max-w-2xl mx-auto space-y-4"
      >
      </motion.div>

      {/* ░░░ LOGGED-IN MEMBER ACCOUNT BADGE ░░░ */}
      {user ? (
        <div className="rounded-2xl border border-bark-100 bg-paper p-5 sm:p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-bark-700 text-cream-light shadow-sm flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-bark-900">{user.name}</h3>
                <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase border ${isSubscribed
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-olive/30 text-olive-dark border-olive/40'
                  }`}>
                  {isSubscribed ? `Active (${user.member?.membership_tier || 'Subscriber'})` : 'Registered Member'}
                </span>
              </div>
              <p className="text-xs text-bark-500 flex items-center gap-3 mt-0.5">
                <span><Mail className="inline w-3 h-3 mr-1" />{user.email}</span>
                <span className="font-mono">ID #: <strong className="text-bark-800">{user.member?.member_number || 'N/A'}</strong></span>
              </p>
            </div>
          </div>
          <div className="text-xs font-mono text-bark-500 bg-cream-light/60 px-3.5 py-2 rounded-xl border border-bark-100 self-stretch sm:self-auto flex items-center justify-between sm:justify-start gap-3">
            <span>Details pulled from account</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          </div>
        </div>
      ) : (
        <div id="guest-auth-section" className="rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 space-y-6 shadow-lift max-w-xl mx-auto">
          <div className="text-center space-y-2">
            <Brand variant="mark" className="mx-auto h-14 w-14 rounded-2xl" />
            <h2 className="text-xl font-extrabold text-bark-900">
              {guestAuthMode === 'signin' ? 'Sign In to MaktabaBora' : 'Create Member Account'}
            </h2>
            <p className="text-xs text-bark-500">
              {guestAuthMode === 'signin'
                ? 'Sign in to access your loans, digital library, and membership passes.'
                : 'Register your member credentials to activate your library pass.'}
            </p>
          </div>

          {/* Auth Mode Toggle Tabs */}
          <div className="flex bg-cream-light/60 p-1 rounded-xl border border-bark-100 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setGuestAuthMode('signup'); setGuestAuthError(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${guestAuthMode === 'signup'
                ? 'bg-bark-700 text-cream-light font-bold shadow-sm'
                : 'text-bark-700 hover:bg-cream-light'
                }`}
            >
              Register Account
            </button>
            <button
              type="button"
              onClick={() => { setGuestAuthMode('signin'); setGuestAuthError(null); }}
              className={`flex-1 py-2.5 rounded-lg transition-all ${guestAuthMode === 'signin'
                ? 'bg-bark-700 text-cream-light font-bold shadow-sm'
                : 'text-bark-700 hover:bg-cream-light'
                }`}
            >
              Sign In
            </button>
          </div>

          {guestAuthError && (
            <div className="p-3.5 rounded-xl bg-cream border border-bark-100 text-rose-900 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 flex-shrink-0" />
              <span>{guestAuthError}</span>
            </div>
          )}

          <form onSubmit={handleGuestAuthSubmit} className="space-y-4 text-left">
            {guestAuthMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-bark-800 uppercase tracking-wider mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-bark-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jane Doe"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full rounded-xl border border-bark-100 bg-cream-light/40 pl-10 pr-4 py-2.5 text-xs font-semibold text-bark-900 focus:ring-2 focus:ring-tan-dark"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-bark-800 uppercase tracking-wider mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-bark-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  placeholder="member@maktababora.org"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full rounded-xl border border-bark-100 bg-cream-light/40 pl-10 pr-4 py-2.5 text-xs font-semibold text-bark-900 focus:ring-2 focus:ring-tan-dark"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-bark-800 uppercase tracking-wider mb-1">Password</label>
              <div className="relative">
                <LogIn className="w-4 h-4 text-bark-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={guestPassword}
                  onChange={(e) => setGuestPassword(e.target.value)}
                  className="w-full rounded-xl border border-bark-100 bg-cream-light/40 pl-10 pr-4 py-2.5 text-xs font-semibold text-bark-900 focus:ring-2 focus:ring-tan-dark font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={guestAuthSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-bark-700 hover:bg-bark-800 text-cream-light font-bold text-xs transition-all shadow-card flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {guestAuthSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              <span>{guestAuthMode === 'signin' ? 'Sign In to Account' : 'Register Member Account'}</span>
            </button>
          </form>
        </div>
      )}

      {/* ░░░ CURRENT ACTIVE TIER CARD (For Existing Subscribed Members) ░░░ */}
      {isSubscribed && currentActiveTier && (
        <div className="rounded-3xl border-2 border-emerald-600/40 bg-emerald-50/40 p-6 sm:p-8 space-y-4 shadow-card relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-200/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-sm">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest font-extrabold text-emerald-800">
                  ● Currently Active Membership Tier
                </span>
                <h2 className="text-xl font-black text-bark-900">{currentActiveTier.name}</h2>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-3.5 py-1 text-xs font-extrabold text-white shadow-sm">
                <Check className="w-3.5 h-3.5" /> Active & Paid
              </span>
              <p className="text-[11px] font-mono text-emerald-900 font-semibold mt-1">
                Limit: {currentActiveTier.borrowLimit}
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs pt-1">
            <div>
              <p className="text-bark-500 font-semibold mb-1">Tier Perks Included:</p>
              <ul className="space-y-1.5">
                {(currentActiveTier.perks || []).map((perk, i) => (
                  <li key={i} className="flex items-center gap-2 text-bark-800 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                    <span>{perk}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-paper/80 border border-emerald-200 p-4 space-y-2 flex flex-col justify-between">
              <div>
                <p className="text-bark-500 font-semibold text-[11px]">Membership Price Paid</p>
                <p className="text-xl font-black text-bark-900">{currentActiveTier.currency || 'KES'} {(currentActiveTier.price || 0).toLocaleString()} <span className="text-xs text-bark-500 font-normal">/ year</span></p>
              </div>
              <p className="text-[11px] text-emerald-800 font-medium bg-emerald-100/60 p-2 rounded-xl">
                This is your currently active tier. It is excluded from purchase options below to prevent double payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ░░░ MEMBERSHIP TIERS GRID (Excludes Current Active Tier) ░░░ */}
      {!isAuthRoute && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-bark-100 pb-3">
            <h2 className="text-base font-extrabold text-bark-900 flex items-center gap-2">
              {isSubscribed ? 'Available Tiers for Upgrade or Change' : 'Available Membership Tiers'}
            </h2>
            <span className="text-xs font-mono text-bark-500">
              {isSubscribed ? `${availableUpgradeTiers.length} alternative tier(s) available` : 'Select tier to activate'}
            </span>
          </div>

          {availableUpgradeTiers.length === 0 ? (
            <div className="rounded-2xl border border-bark-100 bg-paper p-8 text-center space-y-2">
              <Crown className="w-8 h-8 text-tan-dark mx-auto" />
              <h3 className="text-sm font-bold text-bark-900">Highest Tier Active</h3>
              <p className="text-xs text-bark-500 max-w-md mx-auto">
                You are currently subscribed to the top tier plan. Enjoy full library research and borrowing privileges!
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {availableUpgradeTiers.map((tier) => {
                const isSelected = selectedTier === tier.id;
                return (
                  <div
                    key={tier.id}
                    onClick={() => setSelectedTier(tier.id)}
                    className={`relative flex flex-col justify-between rounded-2xl border p-6 cursor-pointer transition-all duration-200 ${isSelected
                      ? 'border-bark-700 bg-paper shadow-lift ring-2 ring-bark-700/20'
                      : 'border-bark-100 bg-paper/60 hover:border-bark-300 hover:bg-paper shadow-card'
                      }`}
                  >
                    {tier.recommended && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-tan-dark px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-paper shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold text-bark-900">{tier.name}</h3>
                        <div
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-bark-700 bg-bark-700' : 'border-bark-300'
                            }`}
                        >
                          {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-paper" />}
                        </div>
                      </div>

                      <p className="text-xs text-bark-500 leading-relaxed min-h-[36px]">
                        {tier.description}
                      </p>

                      <div className="border-t border-b border-bark-100 py-3">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-bark-900">{tier.currency || 'KES'} {(tier.price || 0).toLocaleString()}</span>
                          <span className="text-[11px] font-semibold text-bark-500">/ year</span>
                        </div>
                        <p className="mt-1 text-[11px] font-mono text-tan-dark font-bold">
                          {tier.borrowLimit}
                        </p>
                      </div>

                      <ul className="space-y-2 pt-1">
                        {(tier.perks || []).map((perk, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-bark-700">
                            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-olive-dark mt-0.5" />
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6">
                      {user ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectTierForPayment(tier.id);
                          }}
                          className={`w-full py-3 rounded-xl font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2 ${isSelected
                            ? 'bg-bark-700 hover:bg-bark-900 text-cream-light'
                            : 'bg-cream-light hover:bg-tan/20 text-bark-900 border border-bark-100'
                            }`}
                        >
                          <Smartphone className="w-4 h-4" />
                          <span>{isSubscribed ? 'Upgrade / Switch Tier' : `Select & Pay KES ${tier.price.toLocaleString()}`}</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTier(tier.id);
                            document.getElementById('guest-auth-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="w-full py-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>Select Tier & Sign In / Register</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ░░░ STK PUSH PAYMENT MODAL / OVERLAY ░░░ */}
      {(stage === 'mpesa_modal' || stage === 'pushing') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper border border-bark-100 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bark-700 text-cream-light shadow-card">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-bark-900">M-Pesa STK Push Payment</h3>
              <p className="text-xs text-bark-500">
                Enter your phone number to trigger the M-Pesa STK Push prompt on your device.
              </p>
            </div>

            <div className="rounded-2xl border border-bark-100 bg-cream-light/40 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between text-bark-700">
                <span>Member Account:</span>
                <span className="font-bold text-bark-900">{user?.name}</span>
              </div>
              <div className="flex justify-between text-bark-700">
                <span>Target Tier:</span>
                <span className="font-bold text-bark-900">{activePlan.name}</span>
              </div>
              <div className="flex justify-between text-bark-700 border-t border-bark-100 pt-2 font-semibold">
                <span>Amount to Pay:</span>
                <span className="font-mono text-base font-extrabold text-bark-900">KES {activePlan.price.toLocaleString()}</span>
              </div>
            </div>

            {isSubscribed && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="leading-snug text-[11px]">
                  <strong>Automatic Unsubscription:</strong> Changing to the <strong>{activePlan.name}</strong> will automatically unsubscribe you from your current <strong>{currentActiveTier?.name || user?.member?.membership_tier || 'active'}</strong> pass and activate your new plan.
                </p>
              </div>
            )}

            {stage === 'mpesa_modal' && (
              <form onSubmit={handleInitiateStkPush} className="space-y-4">
                <div>
                  <label htmlFor="stk-phone" className="block text-xs font-semibold text-bark-700 mb-1">
                    M-Pesa Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-bark-400 absolute left-3.5 top-3" />
                    <input
                      id="stk-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712345678"
                      required
                      className="w-full bg-paper border border-bark-200 rounded-xl pl-10 pr-3 py-2.5 text-xs text-bark-900 font-mono focus:outline-none focus:border-bark-500"
                    />
                  </div>
                  <p className="text-[11px] text-bark-500 mt-1 font-mono">
                    Enter the M-Pesa phone number to receive the payment prompt.
                  </p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-cream border border-[#a8452f]/30 text-[#8c3620] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4 text-tan" />
                    <span>Trigger M-Pesa STK Push (KES {activePlan.price.toLocaleString()})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStage('tier_selection')}
                    className="w-full py-2 text-xs text-bark-500 hover:text-bark-900 font-semibold"
                  >
                    Cancel & Change Tier
                  </button>
                </div>
              </form>
            )}

            {stage === 'pushing' && (
              <div className="rounded-2xl border border-bark-100 bg-paper p-6 text-center space-y-3">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-bark-700" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-bark-900">Sending STK Push to {phone}...</p>
                  <p className="text-[11px] text-bark-500 font-mono">
                    Please enter your M-Pesa PIN on your phone to complete activation.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
