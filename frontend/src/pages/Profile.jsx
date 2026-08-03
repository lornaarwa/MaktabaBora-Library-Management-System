import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Crown,
  BookOpen,
  Clock,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  Edit3,
  XCircle,
  RefreshCw,
  CheckCircle2,
  Loader2,
  DollarSign,
  ArrowRight,
  ArrowUpRight,
  ShieldAlert,
  HelpCircle,
  Smartphone,
  ChevronRight,
  Database
} from 'lucide-react';
import DarajaPayModal from '../components/DarajaPayModal';

export default function Profile() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    id_number: '',
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);

  // Cancel Membership Modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelMsg, setCancelMsg] = useState(null);

  // Refund Request Modal state
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('Service non-utilization within policy window');
  const [refundSubmitting, setRefundSubmitting] = useState(false);
  const [refundResult, setRefundResult] = useState(null);

  // Reimbursement Status (persisted decision from backend)
  const [reimbursementStatus, setReimbursementStatus] = useState(null); // { status, rejection_reason, amount, id, ... }

  // Daraja Pay Fine Modal state
  const [darajaModal, setDarajaModal] = useState({ isOpen: false, fine: null });

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '0712345678',
        id_number: user.member?.id_number || '',
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      try {
        const [loansRes, finesRes, reimbRes] = await Promise.all([
          api.getLoans().catch(() => ({ data: [] })),
          api.getMyFines().catch(() => ({ data: [] })),
          api.getReimbursementStatus().catch(() => null),
        ]);

        const loanData = Array.isArray(loansRes) ? loansRes : loansRes.data || [];
        const fineData = Array.isArray(finesRes) ? finesRes : finesRes.data || [];

        setLoans(loanData);
        setFines(fineData);
        if (reimbRes?.latest_reimbursement) {
          setReimbursementStatus(reimbRes.latest_reimbursement);
        }
      } catch (err) {
        // Handled silently
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Derived loan categories
  const activeLoans = loans.filter((l) => l.status === 'active' || l.status === 'overdue');
  const lostBooks = loans.filter((l) => l.status === 'lost' || l.is_lost);
  const unpaidFines = fines.filter((f) => f.status === 'pending' || f.status === 'unpaid' || f.balance > 0);

  const isSubscribed = Boolean(user?.member?.is_subscribed);
  const currentTier = user?.member?.membership_tier || 'standard';
  const borrowLimit = user?.member?.borrow_limit || (currentTier === 'scholar' ? 15 : currentTier === 'student' ? 3 : 7);

  // Days until calculation
  const daysUntil = (dueDateStr) => {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const today = new Date();
    return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image file size exceeds 2MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      try {
        const res = await api.updateProfile({ avatar_base64: base64String });
        const updatedUser = res.user || res.data?.user;
        if (updatedUser) {
          setUser(updatedUser);
          localStorage.setItem('smartlib_user', JSON.stringify(updatedUser));
        }
      } catch (err) {
        alert(err.message || 'Failed to upload profile picture.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Edit Profile submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const res = await api.updateProfile(editForm);
      const updatedUser = res.user || res.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('smartlib_user', JSON.stringify(updatedUser));
      }
      setEditSuccess('Profile details updated successfully!');
      setTimeout(() => {
        setEditModalOpen(false);
        setEditSuccess(null);
      }, 1500);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  // Handle Cancel Membership
  const handleCancelMembership = async () => {
    setCancelling(true);
    try {
      const res = await api.cancelSubscription();
      const updatedUser = res.user || res.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('smartlib_user', JSON.stringify(updatedUser));
      } else {
        setUser({
          ...user,
          member: {
            ...user.member,
            is_subscribed: false,
          },
        });
      }
      setCancelMsg('Your membership subscription has been cancelled.');
      setTimeout(() => {
        setCancelModalOpen(false);
        setCancelMsg(null);
      }, 2000);
    } catch (err) {
      alert(err.message || 'Failed to cancel membership.');
    } finally {
      setCancelling(false);
    }
  };

  // Handle Request Refund
  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setRefundSubmitting(true);
    try {
      const res = await api.requestRefund({ reason: refundReason });
      setRefundResult(res);
      // Update local reimbursement status to pending
      if (res.reimbursement) {
        setReimbursementStatus(res.reimbursement);
      }
    } catch (err) {
      alert(err.message || 'Failed to submit refund request.');
    } finally {
      setRefundSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      
      {/* ░░░ PAGE TITLE ░░░ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-bark-100 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-bark-900 tracking-tight flex items-center gap-2">
            <User className="w-7 h-7 text-bark-700" /> Account Profile
          </h1>
          <p className="text-xs text-bark-500 mt-1">
            Manage your personal profile, membership status, active book loans, and billing features.
          </p>
        </div>
        <button
          onClick={() => setEditModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-bark-700 px-4 py-2.5 text-xs font-bold text-cream-light shadow-card hover:bg-bark-900 transition-all self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      {/* ░░░ REIMBURSEMENT DECISION NOTIFICATION BANNER ░░░ */}
      {reimbursementStatus && (
        <div className={`rounded-2xl border p-4 flex items-start gap-4 ${
          reimbursementStatus.status === 'approved'
            ? 'bg-emerald-50 border-emerald-300'
            : reimbursementStatus.status === 'rejected'
            ? 'bg-rose-50 border-rose-300'
            : 'bg-amber-50 border-amber-300'
        }`}>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            reimbursementStatus.status === 'approved'
              ? 'bg-emerald-100 text-emerald-700'
              : reimbursementStatus.status === 'rejected'
              ? 'bg-rose-100 text-rose-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {reimbursementStatus.status === 'approved' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : reimbursementStatus.status === 'rejected' ? (
              <XCircle className="w-5 h-5" />
            ) : (
              <RefreshCw className="w-5 h-5 animate-spin" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-extrabold uppercase tracking-wider ${
                reimbursementStatus.status === 'approved'
                  ? 'text-emerald-800'
                  : reimbursementStatus.status === 'rejected'
                  ? 'text-rose-800'
                  : 'text-amber-800'
              }`}>
                Reimbursement Request —{' '}
                {reimbursementStatus.status === 'approved'
                  ? '✅ Approved'
                  : reimbursementStatus.status === 'rejected'
                  ? '❌ Rejected'
                  : '⏳ Pending Review'}
              </span>
              <span className="font-mono text-[10px] text-bark-500">{reimbursementStatus.id}</span>
            </div>
            {reimbursementStatus.status === 'approved' && (
              <p className="text-xs text-emerald-800 mt-1">
                Your reimbursement of <strong>KES {reimbursementStatus.amount?.toLocaleString()}</strong> has been approved by library administration. The refund will be processed to your M-Pesa within 2–3 business days.
              </p>
            )}
            {reimbursementStatus.status === 'rejected' && (
              <p className="text-xs text-rose-800 mt-1">
                <strong>Reason:</strong> {reimbursementStatus.rejection_reason || 'Request does not meet refund policy terms.'}
              </p>
            )}
            {reimbursementStatus.status === 'pending' && (
              <p className="text-xs text-amber-800 mt-1">
                Your reimbursement request for <strong>KES {reimbursementStatus.amount?.toLocaleString()}</strong> is awaiting review by library administration. You'll be notified once a decision is made.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ░░░ GRID SECTION 1: USER INFO & MEMBERSHIP CARD ░░░ */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* User Personal Details Card (2 cols) */}
        <div className="md:col-span-2 rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-bark-100 pb-4">
            <div className="flex items-center gap-4">
              <div className="relative group">
                {user?.avatar_base64 ? (
                  <img
                    src={user.avatar_base64}
                    alt={user.name}
                    className="h-16 w-16 rounded-2xl object-cover border-2 border-tan-dark shadow-md"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-bark-700 text-cream-light font-extrabold text-xl shadow-md border-2 border-bark-600">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 bg-tan-dark hover:bg-bark-800 text-white p-1.5 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110" title="Upload Profile Picture">
                  <Edit3 className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-bark-900">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="rounded-md bg-bark-100 text-bark-800 px-2 py-0.5 font-mono text-[10px] font-bold capitalize">
                    Role: {user?.role || 'Member'}
                  </span>
                  <span className="text-xs text-bark-500 font-mono">
                    Member ID: <strong className="text-bark-900">{user?.member?.member_number || 'MB-849201'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div className="space-y-1 bg-cream-light/40 p-3.5 rounded-2xl border border-bark-100">
              <span className="text-bark-500 font-semibold flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-bark-600" /> Email Address
              </span>
              <p className="font-bold text-bark-900 text-sm truncate">{user?.email}</p>
            </div>

            <div className="space-y-1 bg-cream-light/40 p-3.5 rounded-2xl border border-bark-100">
              <span className="text-bark-500 font-semibold flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-bark-600" /> M-Pesa Phone Number
              </span>
              <p className="font-mono font-bold text-bark-900 text-sm">{user?.phone || '0712345678'}</p>
            </div>

            <div className="space-y-1 bg-cream-light/40 p-3.5 rounded-2xl border border-bark-100">
              <span className="text-bark-500 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-bark-600" /> National ID / Student ID
              </span>
              <p className="font-mono font-bold text-bark-900 text-sm">{user?.member?.id_number || '38492019'}</p>
            </div>

            <div className="space-y-1 bg-cream-light/40 p-3.5 rounded-2xl border border-bark-100">
              <span className="text-bark-500 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-bark-600" /> Account Status
              </span>
              <p className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Verified & Active
              </p>
            </div>
          </div>
        </div>

        {/* Current Membership Tier & Status Card (1 col) */}
        <div className="rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 shadow-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-bark-100 pb-3">
              <h3 className="text-sm font-extrabold text-bark-900 flex items-center gap-2">
                <Crown className="w-4 h-4 text-tan-dark" /> Membership Tier
              </h3>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase font-mono border ${
                isSubscribed ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-amber-100 text-amber-900 border-amber-300'
              }`}>
                {isSubscribed ? 'Active Pass' : 'Standard'}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-bark-500 font-semibold uppercase tracking-wider">Current Tier Plan</p>
              <h4 className="text-2xl font-black text-bark-900 capitalize">
                {currentTier} Pass
              </h4>
              <p className="text-xs text-tan-dark font-bold font-mono">
                Borrow Capacity: {borrowLimit} Books at a time
              </p>
            </div>

            <div className="rounded-2xl bg-cream-light/50 p-4 border border-bark-100 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-bark-700">
                <span>Subscription:</span>
                <span className="font-bold text-bark-900">{isSubscribed ? 'Paid / Active' : 'Unsubscribed'}</span>
              </div>
              <div className="flex justify-between text-bark-700">
                <span>Validity:</span>
                <span className="font-bold text-bark-900">{isSubscribed ? '1 Full Year' : 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2">
            <Link
              to="/membership"
              className="w-full py-2.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card transition-all flex items-center justify-center gap-1.5"
            >
              <span>{isSubscribed ? 'Upgrade / Change Tier' : 'Select Membership Tier'}</span>
              <ArrowUpRight className="w-4 h-4 text-tan" />
            </Link>
          </div>
        </div>
      </div>

      {/* ░░░ SECTION 2: BORROWED BOOKS & DUE DATES ░░░ */}
      <div className="rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 space-y-5 shadow-card">
        <div className="flex items-center justify-between border-b border-bark-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-bark-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-bark-700" /> Currently Borrowed Books & Countdowns
            </h2>
            <p className="text-xs text-bark-500 mt-0.5">Physical library books checked out on your library card.</p>
          </div>
          <span className="rounded-xl bg-cream-light/60 px-3 py-1 font-mono text-xs font-bold text-bark-700 border border-bark-100">
            {activeLoans.length} Active Loan(s)
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-bark-500 font-mono text-xs">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading active physical loans...
          </div>
        ) : activeLoans.length === 0 ? (
          <p className="text-xs text-bark-500 py-8 text-center bg-cream-light/30 rounded-2xl border border-dashed border-bark-200">
            You currently have no active physical book loans checked out.
          </p>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((loan) => {
              const daysLeft = daysUntil(loan.due_date);
              const isOverdue = daysLeft < 0 || loan.status === 'overdue';

              return (
                <div key={loan.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl border border-bark-100 bg-cream-light/30 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-bark-900">{loan.book_title || loan.book?.title || 'Library Book Title'}</span>
                      <span className={`rounded-md px-2 py-0.5 font-mono text-[10px] font-bold uppercase ${
                        isOverdue ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {isOverdue ? `Overdue by ${Math.abs(daysLeft)} days` : `Due in ${daysLeft} days`}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-bark-500">
                      Barcode: <strong className="text-bark-800">{loan.barcode || loan.book_copy?.barcode}</strong> | Loan Date: {loan.loan_date} | Due: {loan.due_date}
                    </p>
                  </div>

                  {loan.fine_amount > 0 && (
                    <button
                      onClick={() => setDarajaModal({ isOpen: true, fine: { id: loan.fine_id || 1, amount: loan.fine_amount, title: loan.book_title } })}
                      className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-bold text-xs hover:bg-rose-100 transition"
                    >
                      Pay Overdue Fine KES {loan.fine_amount}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ░░░ SECTION 3: LOST BOOKS & OUTSTANDING FINES ░░░ */}
      <div className="grid gap-6 md:grid-cols-2">
        
        {/* Lost Books Section */}
        <div className="rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-bark-100 pb-3">
            <h3 className="text-sm font-extrabold text-bark-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> Reported / Lost Books
            </h3>
            <span className="font-mono text-xs text-bark-500">{lostBooks.length} Record(s)</span>
          </div>

          {lostBooks.length === 0 ? (
            <div className="py-6 text-center text-xs text-bark-500 bg-cream-light/20 rounded-2xl border border-bark-100">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <span>No lost books recorded on your member account.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {lostBooks.map((lost) => (
                <div key={lost.id} className="p-3.5 rounded-2xl border border-amber-200 bg-amber-50/60 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-bark-900">
                    <span>{lost.book_title || lost.book?.title}</span>
                    <span className="text-amber-800 uppercase text-[10px] font-mono font-bold">Lost Copy</span>
                  </div>
                  <p className="text-bark-500 font-mono text-[11px]">Barcode: {lost.barcode} | Replacement fee pending</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Outstanding Loans & Fines Section */}
        <div className="rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 space-y-4 shadow-card">
          <div className="flex items-center justify-between border-b border-bark-100 pb-3">
            <h3 className="text-sm font-extrabold text-bark-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-bark-700" /> Outstanding Fines & Payments
            </h3>
            <span className="font-mono text-xs font-bold text-rose-800">
              {unpaidFines.length} Pending Fine(s)
            </span>
          </div>

          {unpaidFines.length === 0 ? (
            <div className="py-6 text-center text-xs text-bark-500 bg-cream-light/20 rounded-2xl border border-bark-100">
              <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <span>No outstanding fines. Your library account is in good standing!</span>
            </div>
          ) : (
            <div className="space-y-3">
              {unpaidFines.map((fine) => (
                <div key={fine.id} className="flex items-center justify-between p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 text-xs">
                  <div>
                    <p className="font-bold text-rose-950">{fine.reason || 'Overdue Book Fine'}</p>
                    <p className="text-rose-700 font-mono text-[10px]">Balance: KES {fine.balance || fine.amount}</p>
                  </div>
                  <button
                    onClick={() => setDarajaModal({ isOpen: true, fine })}
                    className="px-3 py-1.5 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-sm flex items-center gap-1"
                  >
                    <Smartphone className="w-3.5 h-3.5" /> Pay M-Pesa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ░░░ SECTION 4: SUBSCRIPTION MANAGEMENT, CANCELLATION & REFUNDS ░░░ */}
      <div className="rounded-3xl border border-bark-100 bg-paper p-6 sm:p-8 space-y-6 shadow-card">
        <div className="border-b border-bark-100 pb-4">
          <h2 className="text-base font-extrabold text-bark-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-bark-700" /> Subscription Management & Cancellation
          </h2>
          <p className="text-xs text-bark-500 mt-0.5">Manage your active subscription pass, cancellation requests, or reimbursement applications.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Cancel Subscription Card */}
          <div className="rounded-2xl border border-bark-100 bg-cream-light/30 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-bark-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-700" /> Cancel Membership Subscription
              </h3>
              <p className="text-xs text-bark-500 leading-relaxed">
                Cancelling your subscription will end borrowing perk privileges at the conclusion of your current period.
              </p>
            </div>

            {isSubscribed ? (
              <button
                onClick={() => setCancelModalOpen(true)}
                className="w-full py-2.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-800 font-bold text-xs hover:bg-rose-100 transition"
              >
                Cancel Active Membership Pass
              </button>
            ) : (
              <p className="text-[11px] text-bark-400 font-mono italic">No active paid subscription to cancel.</p>
            )}
          </div>

          {/* Request Reimbursement / Refund Card */}
          <div className="rounded-2xl border border-bark-100 bg-cream-light/30 p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-bark-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-700" /> Request Reimbursement / Refund
              </h3>
              <p className="text-xs text-bark-500 leading-relaxed">
                Eligible members can request a full KES refund within the policy window if services were non-utilized.
              </p>
            </div>

            {isSubscribed ? (
              <button
                onClick={() => { setRefundResult(null); setRefundModalOpen(true); }}
                className="w-full py-2.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 font-bold text-xs hover:bg-emerald-100 transition"
              >
                Request KES Reimbursement
              </button>
            ) : (
              <p className="text-[11px] text-bark-400 font-mono italic">Reimbursement is only available for active paid subscribers.</p>
            )}
          </div>
        </div>
      </div>

      {/* ░░░ EDIT PROFILE MODAL ░░░ */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper border border-bark-100 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-bark-700 text-cream-light shadow-card">
                <Edit3 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-bark-900">Edit Member Profile</h3>
              <p className="text-xs text-bark-500">Update your account personal information in the database.</p>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-bark-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                  className="w-full bg-paper border border-bark-200 rounded-xl px-3.5 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-bark-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  required
                  className="w-full bg-paper border border-bark-200 rounded-xl px-3.5 py-2.5 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-bark-700 mb-1">M-Pesa Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  required
                  className="w-full bg-paper border border-bark-200 rounded-xl px-3.5 py-2.5 text-xs text-bark-900 font-mono focus:outline-none focus:border-bark-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-bark-700 mb-1">National ID / Student ID</label>
                <input
                  type="text"
                  value={editForm.id_number}
                  onChange={(e) => setEditForm({ ...editForm, id_number: e.target.value })}
                  className="w-full bg-paper border border-bark-200 rounded-xl px-3.5 py-2.5 text-xs text-bark-900 font-mono focus:outline-none focus:border-bark-500"
                />
              </div>

              {editError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {editError}
                </div>
              )}

              {editSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                  {editSuccess}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={editSaving}
                  className="flex-1 py-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card flex items-center justify-center gap-2"
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin text-cream-light" /> : 'Save Profile Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-3 rounded-xl border border-bark-200 text-bark-700 font-semibold text-xs hover:bg-cream"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ░░░ CANCEL SUBSCRIPTION MODAL ░░░ */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper border border-bark-100 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 border border-rose-200">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-extrabold text-bark-900">Cancel Membership Subscription</h3>
            <p className="text-xs text-bark-500">
              Are you sure you want to cancel your active membership pass? You will lose extended borrowing limits at period end.
            </p>

            {cancelMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                {cancelMsg}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancelMembership}
                disabled={cancelling}
                className="flex-1 py-3 rounded-xl bg-rose-700 hover:bg-rose-900 text-white font-bold text-xs shadow-card flex items-center justify-center gap-2"
              >
                {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Confirm Cancellation'}
              </button>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-3 rounded-xl border border-bark-200 text-bark-700 font-semibold text-xs hover:bg-cream"
              >
                Keep Active
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ░░░ REQUEST REFUND MODAL ░░░ */}
      {refundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bark-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-paper border border-bark-100 rounded-3xl w-full max-w-md p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-cream-light shadow-card">
                <DollarSign className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-extrabold text-bark-900">Request KES Reimbursement</h3>
              <p className="text-xs text-bark-500">Submit a refund application for your active membership subscription.</p>
            </div>

            {/* Show existing status if already submitted */}
            {!refundResult && reimbursementStatus && (
              <div className={`p-3 rounded-xl border text-xs ${
                reimbursementStatus.status === 'approved'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : reimbursementStatus.status === 'rejected'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}>
                <p className="font-bold">Existing Request: <span className="capitalize">{reimbursementStatus.status}</span></p>
                <p className="text-[11px] mt-0.5">Ref: {reimbursementStatus.id} · Amount: KES {reimbursementStatus.amount?.toLocaleString()}</p>
                {reimbursementStatus.status === 'pending' && (
                  <p className="mt-1">Your previous request is still pending. Submitting again will replace it.</p>
                )}
              </div>
            )}

            {refundResult ? (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                  <p className="font-bold">{refundResult.message}</p>
                  <p className="font-mono text-[11px] text-emerald-800">Refund Reference: <strong>{refundResult.refund_reference}</strong></p>
                  <p className="text-[11px] text-emerald-700">Your request is now <strong>Pending Review</strong> by library administration. You will be notified on this profile page once a decision is made.</p>
                </div>
                <button
                  onClick={() => { setRefundModalOpen(false); setRefundResult(null); }}
                  className="w-full py-3 rounded-xl bg-bark-700 text-cream-light font-bold text-xs"
                >
                  Close Confirmation
                </button>
              </div>
            ) : (
              <form onSubmit={handleRefundSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-semibold text-bark-700 mb-1">Reason for Reimbursement Request</label>
                  <textarea
                    rows={3}
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                    placeholder="Provide details on why you are requesting a reimbursement..."
                    className="w-full bg-paper border border-bark-200 rounded-xl p-3 text-xs text-bark-900 focus:outline-none focus:border-bark-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={refundSubmitting}
                    className="flex-1 py-3 rounded-xl bg-bark-700 hover:bg-bark-900 text-cream-light font-bold text-xs shadow-card flex items-center justify-center gap-2"
                  >
                    {refundSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Refund Request'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefundModalOpen(false)}
                    className="px-4 py-3 rounded-xl border border-bark-200 text-bark-700 font-semibold text-xs hover:bg-cream"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ░░░ DARAJA PAY FINE MODAL ░░░ */}
      {darajaModal.isOpen && (
        <DarajaPayModal
          isOpen={darajaModal.isOpen}
          onClose={() => setDarajaModal({ isOpen: false, fine: null })}
          fineId={darajaModal.fine?.id}
          amount={darajaModal.fine?.balance || darajaModal.fine?.amount || 100}
        />
      )}

    </div>
  );
}
