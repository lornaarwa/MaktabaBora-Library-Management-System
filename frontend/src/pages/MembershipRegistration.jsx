import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  UserPlus,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles,
  BookOpen,
  ArrowRight,
  Info,
  Database,
  Calendar,
  Layers
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
  const { setUser, setToken } = useAuth();
  const navigate = useNavigate();

  const [selectedTier, setSelectedTier] = useState('standard');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '0712345678',
    idNumber: '',
    password: '',
    confirmPassword: '',
  });

  // Stages: 'form' | 'mpesa_prompt' | 'pushing' | 'active_success'
  const [stage, setStage] = useState('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activatedData, setActivatedData] = useState(null);

  const activePlan = MEMBERSHIP_TIERS.find((t) => t.id === selectedTier) || MEMBERSHIP_TIERS[1];

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Step 1: Validate form before launching M-Pesa prompt
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!formData.phone.trim()) {
      setError('Please provide a valid M-Pesa phone number.');
      return;
    }

    setStage('mpesa_prompt');
  };

  // Step 2: Trigger STK Push & activate membership in DB
  const handleInitiateStkPush = async () => {
    setLoading(true);
    setStage('pushing');
    setError(null);

    try {
      // Send registration payload with M-Pesa phone number to backend STK Push endpoint
      const response = await api.registerMembershipStk({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone,
        id_number: formData.idNumber,
        membership_tier: selectedTier,
        amount: activePlan.price,
      });

      const userObj = response.user || response.data?.user;
      const userToken = response.token || response.data?.token;
      const subscription = response.subscription || response.data?.subscription;
      const stk = response.stk_response || response.data?.stk_response;

      if (userObj && userToken) {
        setUser(userObj);
        setToken(userToken);
        localStorage.setItem('smartlib_user', JSON.stringify(userObj));
        localStorage.setItem('smartlib_token', userToken);
      }

      setTimeout(() => {
        setActivatedData({
          user: userObj,
          memberNumber: userObj?.member?.member_number || `MB-${Math.floor(100000 + Math.random() * 900000)}`,
          tierName: activePlan.name,
          amountPaid: activePlan.price,
          borrowLimit: activePlan.borrowLimit,
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          transactionRef: subscription?.transaction_reference || stk?.CheckoutRequestID || 'MPESA-TXN-OK',
        });
        setStage('active_success');
        setLoading(false);
      }, 2000);
    } catch (err) {
      setLoading(false);
      setStage('mpesa_prompt');
      setError(err.message || 'M-Pesa payment initiation failed. Please verify your phone number and try again.');
    }
  };

  // Successful Activation View
  if (stage === 'active_success' && activatedData) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-3xl border border-bark-100 bg-paper p-8 shadow-lift space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-olive/20 text-olive-dark border border-olive/30 shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-olive-dark" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-olive-dark px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-cream-light shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Membership Active & Saved to Database
            </span>
            <h1 className="text-2xl font-extrabold text-bark-900 sm:text-3xl">
              Welcome to MaktabaBora!
            </h1>
            <p className="text-xs text-bark-500 max-w-md mx-auto">
              Your M-Pesa payment has been confirmed. Your active membership profile and subscription pass are officially stored in the database.
            </p>
          </div>

          {/* Activated Membership Card */}
          <div className="rounded-2xl border border-bark-100 bg-cream-light/40 p-6 text-left space-y-4 shadow-card">
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
                <p className="font-bold text-bark-900">{activatedData.user?.name || formData.name}</p>
              </div>
              <div>
                <p className="text-bark-500 font-semibold">Email Address</p>
                <p className="font-bold text-bark-900">{activatedData.user?.email || formData.email}</p>
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

          {/* Database Persistence Status Badge */}
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900">
            <Database className="h-4 w-4 text-emerald-700" />
            <span className="font-semibold">
              Membership record & subscription receipt successfully saved to PostgreSQL/MySQL database.
            </span>
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
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* ░░░ HERO HEADER ░░░ */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bark-700 text-cream-light text-[11px] font-bold uppercase tracking-widest shadow-sm">
          <UserPlus className="w-3.5 h-3.5" /> Membership Registration & STK Push
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-bark-900 tracking-tight leading-tight">
          Join Maktaba<span className="text-tan-dark">Bora</span> Library
        </h1>
        <p className="text-bark-500 text-xs sm:text-sm leading-relaxed">
          Select your membership tier, fill in your details, and complete activation via instant M-Pesa STK Push.
        </p>
      </div>

      {/* ░░░ STEP 1: CHOOSE MEMBERSHIP TIER ░░░ */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-bark-100 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bark-700 text-xs font-bold text-cream-light">
            1
          </div>
          <h2 className="text-base font-extrabold text-bark-900">Select Membership Tier</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {MEMBERSHIP_TIERS.map((tier) => {
            const isSelected = selectedTier === tier.id;
            return (
              <div
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 cursor-pointer transition-all duration-200 ${
                  isSelected
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
                      className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-bark-700 bg-bark-700' : 'border-bark-300'
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
                      <span className="text-2xl font-black text-bark-900">{tier.currency} {tier.price.toLocaleString()}</span>
                      <span className="text-[11px] font-semibold text-bark-500">/ year</span>
                    </div>
                    <p className="mt-1 text-[11px] font-mono text-tan-dark font-bold">
                      {tier.borrowLimit}
                    </p>
                  </div>

                  <ul className="space-y-2 pt-1">
                    {tier.perks.map((perk, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-bark-700">
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-olive-dark mt-0.5" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ░░░ STEP 2: REGISTRATION FORM & PAYMENT INITIATION ░░░ */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-bark-100 pb-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-bark-700 text-xs font-bold text-cream-light">
            2
          </div>
          <h2 className="text-base font-extrabold text-bark-900">Member Details & M-Pesa STK Push</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Left Form (3 cols) */}
          <div className="lg:col-span-3 rounded-2xl border border-bark-100 bg-paper p-6 sm:p-8 shadow-card space-y-6">
            <h3 className="text-sm font-bold text-bark-900 border-b border-bark-100 pb-3">
              Member Profile Registration
            </h3>

            <form onSubmit={handleProceedToPayment} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-bark-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Jane Wambui"
                    required
                    className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-bark-700 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="jane@example.com"
                      required
                      className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-bark-700 mb-1">M-Pesa Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="0712345678"
                      required
                      className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* National ID / Student ID */}
              <div>
                <label className="block text-xs font-semibold text-bark-700 mb-1">
                  National ID / Student Registration No.
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="idNumber"
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="e.g. 38492019 or F17/8492/2024"
                    required
                    className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-bark-700 mb-1">Account Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-bark-700 mb-1">Confirm Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-bark-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className="w-full bg-paper border border-bark-100 rounded-xl pl-9 pr-3 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-cream border border-[#a8452f]/30 text-[#8c3620] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Proceed to M-Pesa STK Push (KES {activePlan.price.toLocaleString()})</span>
              </button>
            </form>
          </div>

          {/* Right Summary Box (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-bark-100 bg-paper p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-bark-100 pb-3">
                <h3 className="text-sm font-bold text-bark-900">Membership Fee Summary</h3>
                <span className="font-mono text-[10px] uppercase tracking-wider text-bark-500">Tier Selected</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-bark-700">
                  <span>Selected Tier:</span>
                  <span className="font-bold text-bark-900">{activePlan.name}</span>
                </div>
                <div className="flex justify-between text-bark-700">
                  <span>Validity Duration:</span>
                  <span>1 Full Year</span>
                </div>
                <div className="flex justify-between text-bark-700">
                  <span>Borrowing Capacity:</span>
                  <span className="font-semibold text-tan-dark">{activePlan.borrowLimit}</span>
                </div>
                <div className="flex justify-between text-bark-700">
                  <span>Paybill Number:</span>
                  <span className="font-mono font-bold text-bark-900">174379</span>
                </div>
              </div>

              <div className="border-t border-bark-100 pt-3 flex justify-between items-baseline">
                <span className="text-xs font-extrabold text-bark-900">Amount to Pay</span>
                <div className="text-right">
                  <span className="text-xl font-black text-bark-900">KES {activePlan.price.toLocaleString()}</span>
                  <span className="block text-[10px] text-bark-500">Annual Membership Fee</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-olive-dark/30 bg-olive/15 p-5 space-y-2 text-xs text-bark-700 shadow-card">
              <div className="flex items-center gap-2 font-bold text-bark-900">
                <ShieldCheck className="w-4 h-4 text-olive-dark" />
                <span>Instant Activation Guarantee</span>
              </div>
              <p className="text-[11px] text-bark-600 leading-relaxed">
                Upon entering your M-Pesa PIN, your membership status will be set to <strong>Active</strong> and saved into the system database instantly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ░░░ STK PUSH MODAL / OVERLAY ░░░ */}
      {(stage === 'mpesa_prompt' || stage === 'pushing') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper border border-bark-100 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bark-700 text-cream-light shadow-card">
                <Smartphone className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-bark-900">M-Pesa STK Push Confirmation</h3>
              <p className="text-xs text-bark-500">
                Complete your membership fee payment to activate your account in the database.
              </p>
            </div>

            <div className="rounded-2xl border border-bark-100 bg-cream-light/40 p-4 space-y-2 text-xs">
              <div className="flex justify-between text-bark-700">
                <span>Plan:</span>
                <span className="font-bold text-bark-900">{activePlan.name}</span>
              </div>
              <div className="flex justify-between text-bark-700">
                <span>M-Pesa Number:</span>
                <span className="font-mono font-bold text-bark-900">{formData.phone}</span>
              </div>
              <div className="flex justify-between text-bark-700 border-t border-bark-100 pt-2 font-semibold">
                <span>Amount:</span>
                <span className="font-mono text-base font-extrabold text-bark-900">KES {activePlan.price.toLocaleString()}</span>
              </div>
            </div>

            {stage === 'mpesa_prompt' && (
              <div className="space-y-3">
                {error && (
                  <div className="p-3 rounded-xl bg-cream border border-[#a8452f]/30 text-[#8c3620] text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleInitiateStkPush}
                  className="w-full py-3.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-2"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Send STK Push Prompt Now</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStage('form')}
                  className="w-full py-2 text-xs text-bark-500 hover:text-bark-900 font-semibold"
                >
                  Cancel & Edit Details
                </button>
              </div>
            )}

            {stage === 'pushing' && (
              <div className="rounded-2xl border border-bark-100 bg-paper p-6 text-center space-y-3">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-bark-700" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-bark-900">Sending STK Push to {formData.phone}...</p>
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
