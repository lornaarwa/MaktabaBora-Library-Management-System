import React, { useState } from 'react';
import { BadgePercentIcon, CheckIcon, CrownIcon, LibraryBigIcon, SparklesIcon, SmartphoneIcon, LoaderIcon } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Modal } from './ui/Modal';

const plans = [
  {
    id: 'monthly',
    name: 'Monthly pass',
    price: 350,
    cadence: 'per month',
    note: 'Cancel anytime',
  },
  {
    id: 'annual',
    name: 'Annual pass',
    price: 3200,
    cadence: 'per year',
    note: 'Two months free',
  },
];

const perks = [
  { icon: BadgePercentIcon, text: '20% off every digital e-book purchase' },
  { icon: LibraryBigIcon, text: 'Access to exclusive Pro-only titles' },
  { icon: SparklesIcon, text: 'Priority holds and 21-day loan periods' },
  { icon: CheckIcon, text: 'First KSh 200 of fines waived each term' },
];

export default function SubscriptionPassModal({ isOpen, open, onClose }) {
  const { user, setUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [phone, setPhone] = useState('0712 345 678');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const isOpenState = open !== undefined ? open : isOpen;
  if (!isOpenState) return null;

  const plan = plans.find((p) => p.id === selectedPlan) || plans[1];

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await api.checkoutSubscription({
        plan_type: plan.id,
        phone_number: phone,
        amount: plan.price,
      });

      setSuccessMsg('M-Pesa STK Push sent! Complete PIN prompt on phone.');

      if (user) {
        setUser({
          ...user,
          member: {
            ...user.member,
            is_subscribed: true,
          },
        });
      }

      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
      }, 2500);
    } catch (err) {
      setErrorMsg(err.message || 'Checkout failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpenState}
      onClose={onClose}
      title="Pro Perks membership"
      subtitle="Upgrade your library card"
      size="md"
    >
      <div className="flex items-start gap-3 rounded-xl border border-tan-dark/30 bg-cream/50 p-4">
        <CrownIcon className="mt-0.5 h-5 w-5 shrink-0 text-tan-dark" />
        <p className="text-sm leading-relaxed text-bark-700">
          Pro members read more for less. Discounts apply automatically at checkout, and exclusive titles unlock the moment
          your pass is active.
        </p>
      </div>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-semibold text-bark-900">Choose a plan</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {plans.map((p) => {
            const active = p.id === selectedPlan;
            return (
              <label
                key={p.id}
                className={`cursor-pointer rounded-xl border p-4 transition ${
                  active ? 'border-bark-700 bg-paper shadow-card' : 'border-bark-100 bg-paper/60 hover:border-bark-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-bark-900">{p.name}</span>
                  <input
                    type="radio"
                    name="plan"
                    value={p.id}
                    checked={active}
                    onChange={() => setSelectedPlan(p.id)}
                    className="h-4 w-4 accent-bark-700"
                  />
                </div>
                <p className="mt-2 font-mono text-xl font-bold text-bark-900">KSh {p.price.toLocaleString()}</p>
                <p className="text-xs text-bark-500">{p.cadence}</p>
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-olive-dark">{p.note}</p>
              </label>
            );
          })}
        </div>
      </fieldset>

      <ul className="mt-5 space-y-2.5">
        {perks.map((perk) => (
          <li key={perk.text} className="flex items-center gap-3 text-sm text-bark-700">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-olive/40">
              <perk.icon className="h-3.5 w-3.5 text-bark-900" />
            </span>
            {perk.text}
          </li>
        ))}
      </ul>

      <form onSubmit={handleCheckout} className="mt-5 space-y-3 border-t border-bark-100 pt-4">
        <div>
          <label htmlFor="sub-phone" className="mb-1 block text-xs font-semibold text-bark-900">
            M-Pesa Phone Number
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-bark-100 bg-paper px-3 focus-within:border-bark-500">
            <SmartphoneIcon className="h-4 w-4 text-bark-300" />
            <span className="font-mono text-xs text-bark-500">+254</span>
            <input
              id="sub-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-transparent py-2 font-mono text-sm text-bark-900 outline-none"
              placeholder="0712 345 678"
              required
            />
          </div>
        </div>

        {errorMsg && <p className="text-xs text-[#8c3620] font-medium">{errorMsg}</p>}
        {successMsg && <p className="text-xs text-olive-dark font-semibold">{successMsg}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-bark-700 px-5 py-2.5 text-sm font-bold text-cream-light transition hover:bg-bark-900 flex items-center justify-center gap-2"
        >
          {loading ? <LoaderIcon className="h-4 w-4 animate-spin" /> : `Activate Pass (KSh ${plan.price.toLocaleString()})`}
        </button>
      </form>
    </Modal>
  );
}
