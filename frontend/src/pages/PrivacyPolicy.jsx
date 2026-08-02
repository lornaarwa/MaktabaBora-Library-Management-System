import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Database,
  Eye,
  Lock,
  CreditCard,
  UserCheck,
  Mail,
  ArrowRight,
  FileText,
} from 'lucide-react';

/* ─── helpers ─── */

function SectionBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-bark-700 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-cream-light shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function PolicySection({ icon: Icon, id, title, accent, children }) {
  const accentMap = {
    tan: 'bg-tan/20 text-tan-dark border-tan/30',
    olive: 'bg-olive/20 text-olive-dark border-olive/30',
    sage: 'bg-sage/20 text-sage-dark border-sage/30',
    cream: 'bg-cream/30 text-bark-700 border-cream',
    bark: 'bg-bark-50 text-bark-700 border-bark-100',
  };

  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-bark-100 bg-paper p-7 shadow-card transition-all duration-300 hover:shadow-lift"
    >
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
            accentMap[accent] || accentMap.bark
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-base font-bold text-bark-900">{title}</h2>
      </div>
      <div className="space-y-3 text-xs leading-relaxed text-bark-500">
        {children}
      </div>
    </section>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-bark-300" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/* ─── Table of Contents ─── */

const TOC_ITEMS = [
  { id: 'information-collected', label: 'Information Collected', icon: Database },
  { id: 'how-data-is-used', label: 'How Data Is Used', icon: Eye },
  { id: 'data-security', label: 'Data Security', icon: Lock },
  { id: 'payment-information', label: 'Payment Information', icon: CreditCard },
  { id: 'user-rights', label: 'Your Rights', icon: UserCheck },
  { id: 'privacy-contact', label: 'Contact Us', icon: Mail },
];

/* ─── main page ─── */

export default function PrivacyPolicy() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ░░░ HERO ░░░ */}
      <section className="mb-10 text-center">
        <SectionBadge icon={ShieldCheck} label="Privacy Policy" />

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-bark-900 sm:text-5xl">
          Your Privacy <span className="text-tan-dark">Matters</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-bark-500 sm:text-base">
          MaktabaBora is committed to protecting your personal information. This
          policy explains what data we collect, how we use it, and the rights
          you have over it.
        </p>
        <p className="mt-2 text-[11px] font-semibold uppercase tracking-widest text-bark-300">
          Last updated — July 2026
        </p>
      </section>

      {/* ░░░ TABLE OF CONTENTS ░░░ */}
      <nav className="mb-12 rounded-2xl border border-bark-100 bg-cream-light/40 p-6 shadow-card">
        <h2 className="mb-4 text-sm font-bold text-bark-900">Quick Navigation</h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TOC_ITEMS.map(({ id, label, icon: Icon }) => (
            <a
              key={id}
              href={`#${id}`}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-bark-700 transition hover:bg-paper hover:shadow-sm"
            >
              <Icon className="h-4 w-4 text-bark-400 transition group-hover:text-tan-dark" />
              <span>{label}</span>
              <ArrowRight className="ml-auto h-3 w-3 text-bark-300 opacity-0 transition group-hover:opacity-100" />
            </a>
          ))}
        </div>
      </nav>

      {/* ░░░ POLICY SECTIONS ░░░ */}
      <div className="space-y-6">
        {/* 1. Information Collected */}
        <PolicySection
          icon={Database}
          id="information-collected"
          title="1. Information We Collect"
          accent="bark"
        >
          <p>
            When you register, borrow, purchase, or interact with MaktabaBora,
            we may collect the following categories of information:
          </p>
          <BulletList
            items={[
              'Personal identification — full name, email address, and student/staff ID number.',
              'Account credentials — hashed password and authentication tokens.',
              'Borrowing & reservation history — titles checked out, due dates, holds placed, and return records.',
              'Purchase & payment data — cart contents, order history, M-Pesa transaction references, and payment amounts.',
              'Device & usage information — browser type, IP address, pages visited, and session duration (collected automatically via server logs).',
              'Communications — messages submitted through the Contact form or AI Chat widget.',
            ]}
          />
        </PolicySection>

        {/* 2. How Data Is Used */}
        <PolicySection
          icon={Eye}
          id="how-data-is-used"
          title="2. How We Use Your Data"
          accent="olive"
        >
          <p>We process your information for the following purposes:</p>
          <BulletList
            items={[
              'Account management — creating, authenticating, and maintaining your library account.',
              'Library services — processing book searches, reservations, borrowings, returns, and renewals.',
              'E-commerce — facilitating book purchases, processing M-Pesa payments, and generating order confirmations.',
              'Personalisation — powering AI-assisted book recommendations and search suggestions based on your reading history.',
              'Communication — sending due-date reminders, reservation notifications, overdue alerts, and responses to your enquiries.',
              'Analytics & improvement — aggregating anonymised usage data to improve system performance, catalog coverage, and user experience.',
              'Security & compliance — detecting fraud, preventing unauthorised access, and meeting legal obligations.',
            ]}
          />
          <p className="mt-2 font-semibold text-bark-700">
            We do not sell, rent, or trade your personal data to third parties
            for marketing purposes.
          </p>
        </PolicySection>

        {/* 3. Data Security */}
        <PolicySection
          icon={Lock}
          id="data-security"
          title="3. Data Security"
          accent="tan"
        >
          <p>
            We take the security of your data seriously and implement
            industry-standard measures to protect it:
          </p>
          <BulletList
            items={[
              'Encryption — all data transmitted between your browser and our servers is encrypted with TLS/SSL.',
              'Password hashing — account passwords are stored using bcrypt salted hashing; we never store plain-text passwords.',
              'Access controls — role-based permissions ensure that only authorised librarians and administrators can access sensitive records.',
              'Session management — authentication tokens expire automatically, and sessions can be revoked at any time.',
              'Infrastructure — our servers are hosted in secure data centres with regular security audits and automated backups.',
              'Incident response — in the unlikely event of a data breach, affected users will be notified within 72 hours in accordance with applicable regulations.',
            ]}
          />
        </PolicySection>

        {/* 4. Payment Information */}
        <PolicySection
          icon={CreditCard}
          id="payment-information"
          title="4. Payment Information"
          accent="sage"
        >
          <p>
            MaktabaBora integrates with <strong>Safaricom Daraja API (M-Pesa)</strong>{' '}
            to process book purchases. Here is how we handle payment data:
          </p>
          <BulletList
            items={[
              'We do not store your M-Pesa PIN or full mobile money credentials on our servers.',
              'Payment requests are initiated via the secure Daraja STK Push; authentication happens entirely on your handset.',
              'We retain only the transaction reference code, amount, timestamp, and confirmation status for order-tracking and receipt purposes.',
              'All payment communication between our backend and the Daraja API is encrypted and authenticated with OAuth tokens.',
              'You may request a full record of your purchase history from your Member Dashboard at any time.',
            ]}
          />
        </PolicySection>

        {/* 5. User Rights */}
        <PolicySection
          icon={UserCheck}
          id="user-rights"
          title="5. Your Rights"
          accent="cream"
        >
          <p>
            As a MaktabaBora user, you have the following rights regarding your
            personal data:
          </p>
          <BulletList
            items={[
              'Access — you may view all personal data we hold about you from your Member Dashboard.',
              'Correction — you can update your name, email, and profile details at any time through your account settings.',
              'Deletion — you may request permanent deletion of your account and associated data by contacting our privacy team.',
              'Data portability — upon request, we will provide an export of your borrowing history, purchase records, and account information in a machine-readable format.',
              'Withdrawal of consent — you may withdraw consent for non-essential data processing (e.g., AI recommendations) without affecting your ability to use core library services.',
              'Complaint — if you believe your data rights have been violated, you may lodge a complaint with the Office of the Data Protection Commissioner (ODPC), Kenya.',
            ]}
          />
        </PolicySection>

        {/* 6. Contact for Privacy Concerns */}
        <PolicySection
          icon={Mail}
          id="privacy-contact"
          title="6. Contact Us About Privacy"
          accent="olive"
        >
          <p>
            If you have any questions, concerns, or requests regarding this
            Privacy Policy or how your data is handled, please reach out to our
            Data Protection Officer:
          </p>

          <div className="mt-4 rounded-xl border border-bark-100 bg-cream-light/40 p-5">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-bark-400" />
                <span className="font-semibold text-bark-700">
                  Email:{' '}
                  <a
                    href="mailto:privacy@maktababora.ac.ke"
                    className="text-tan-dark transition hover:text-bark-900"
                  >
                    privacy@maktababora.ac.ke
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-bark-400" />
                <span className="font-semibold text-bark-700">
                  Subject line: <span className="text-bark-500">Privacy Inquiry — [Your Name]</span>
                </span>
              </div>
            </div>
            <p className="mt-3">
              We aim to respond to all privacy-related enquiries within{' '}
              <strong className="text-bark-700">5 business days</strong>. For
              general questions, you can also use the{' '}
              <Link
                to="/contact"
                className="font-semibold text-tan-dark transition hover:text-bark-900"
              >
                Contact page
              </Link>
              .
            </p>
          </div>
        </PolicySection>
      </div>

      {/* ░░░ BACK TO TOP CTA ░░░ */}
      <div className="mt-12 text-center">
        <div className="mx-auto max-w-lg rounded-2xl border border-bark-100 bg-cream-light/40 p-8 shadow-card">
          <h2 className="mb-2 text-lg font-bold text-bark-900">
            Have More Questions?
          </h2>
          <p className="mb-5 text-xs text-bark-500">
            Visit our Contact page or reach out to our privacy team directly.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-bark-700 px-5 py-2.5 text-xs font-bold text-cream-light shadow-card transition hover:bg-bark-900"
          >
            Contact Us <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
