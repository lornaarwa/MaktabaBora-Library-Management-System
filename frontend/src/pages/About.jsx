import React from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Target,
  Eye,
  Search,
  CalendarCheck,
  BookMarked,
  RotateCcw,
  ShoppingBag,
  GraduationCap,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Library,
  Globe,
  Clock,
} from 'lucide-react';

/* ─── tiny reusable pieces ─── */

function SectionBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-bark-700 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-cream-light shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function ServiceCard({ icon: Icon, title, description, accent }) {
  const accentMap = {
    tan: 'bg-tan/20 text-tan-dark border-tan/30',
    olive: 'bg-olive/20 text-olive-dark border-olive/30',
    sage: 'bg-sage/20 text-sage-dark border-sage/30',
    cream: 'bg-cream/30 text-bark-700 border-cream',
    bark: 'bg-bark-50 text-bark-700 border-bark-100',
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-bark-100 bg-paper p-6 shadow-card transition-all duration-300 hover:shadow-lift hover:-translate-y-1">
      {/* Decorative gradient corner */}
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-cream-light/40 transition-transform duration-500 group-hover:scale-150" />

      <div className={`relative mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accentMap[accent] || accentMap.bark}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="relative mb-1.5 text-sm font-bold text-bark-900">{title}</h3>
      <p className="relative text-xs leading-relaxed text-bark-500">{description}</p>
    </div>
  );
}

function BenefitItem({ text }) {
  return (
    <li className="flex items-start gap-2.5 text-xs leading-relaxed text-bark-700">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-olive-dark" />
      <span>{text}</span>
    </li>
  );
}

function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-bark-100 bg-paper/80 p-5 shadow-card">
      <Icon className="mb-1 h-5 w-5 text-tan-dark" />
      <span className="text-2xl font-extrabold text-bark-900">{value}</span>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-bark-500">{label}</span>
    </div>
  );
}

/* ─── main page ─── */

export default function About() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ░░░ HERO ░░░ */}
      <section className="mb-16 text-center">
        <SectionBadge icon={BookOpen} label="About MaktabaBora" />

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-bark-900 sm:text-5xl">
          The Modern Library
          <br />
          <span className="text-tan-dark">Management Platform</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-bark-500 sm:text-base">
          MaktabaBora (<em>"Best Library"</em> in Swahili) is a comprehensive,
          full-stack library management system designed to digitise and
          streamline every aspect of how libraries operate  from cataloging and
          circulation to purchasing and AI-assisted discovery.
        </p>

        {/* Quick stats */}
        <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3">
          <StatCard value="∞" label="Books Supported" icon={Library} />
          <StatCard value="24/7" label="Access" icon={Clock} />
          <StatCard value="3" label="User Roles" icon={Users} />
        </div>
      </section>

      {/* ░░░ MISSION & VISION ░░░ */}
      <section className="mb-16 grid gap-6 md:grid-cols-2">
        {/* Mission */}
        <div className="rounded-2xl border border-bark-100 bg-paper p-7 shadow-card">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-olive/20 text-olive-dark border border-olive/30">
            <Target className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-bark-900">Our Mission</h2>
          <p className="text-xs leading-relaxed text-bark-500">
            To empower educational institutions across East Africa and beyond
            with an accessible, intuitive, and cost-effective digital library
            platform that removes barriers between readers and knowledge.
            MaktabaBora bridges the gap between traditional library services and
            modern technology, ensuring every student and educator can discover,
            borrow, and purchase books with ease.
          </p>
        </div>

        {/* Vision */}
        <div className="rounded-2xl border border-bark-100 bg-paper p-7 shadow-card">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tan/20 text-tan-dark border border-tan/30">
            <Eye className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-lg font-bold text-bark-900">Our Vision</h2>
          <p className="text-xs leading-relaxed text-bark-500">
            A world where every library — no matter how small or remote — runs
            on smart, connected technology. We envision MaktabaBora as the
            backbone of academic library infrastructure, seamlessly connecting
            readers, librarians, and administrators through a single elegant
            platform that grows alongside the institutions it serves.
          </p>
        </div>
      </section>

      {/* ░░░ SERVICES ░░░ */}
      <section className="mb-16">
        <div className="mb-8 text-center">
          <SectionBadge icon={Sparkles} label="Services We Offer" />
          <h2 className="mt-4 text-2xl font-extrabold text-bark-900 sm:text-3xl">
            Everything Your Library Needs
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-xs text-bark-500 sm:text-sm">
            From discovery to return — MaktabaBora covers the full lifecycle of
            every book in your collection.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ServiceCard
            icon={Search}
            title="Smart Book Search"
            description="Instantly search and filter the entire catalog by title, author, genre, ISBN, or keyword. AI-assisted suggestions help readers discover their next great read."
            accent="bark"
          />
          <ServiceCard
            icon={CalendarCheck}
            title="Reserve Books"
            description="Place holds on books that are currently checked out. Get notified the moment they become available so you never miss a title."
            accent="tan"
          />
          <ServiceCard
            icon={BookMarked}
            title="Borrow Books"
            description="Check out physical or digital copies with a single click. Track due dates, receive reminders, and renew online — no queues required."
            accent="olive"
          />
          <ServiceCard
            icon={RotateCcw}
            title="Return Books"
            description="Log returns quickly from the circulation desk or self-service kiosk. Late fees are calculated automatically and added to the member's account."
            accent="sage"
          />
          <ServiceCard
            icon={ShoppingBag}
            title="Buy Books"
            description="Purchase books directly through integrated M-Pesa (Daraja) payments. Add titles to your cart, check out securely, and own your favorites."
            accent="cream"
          />
          <ServiceCard
            icon={Globe}
            title="Digital E-Book Reader"
            description="Read digital titles in the browser with our built-in e-book reader. Access your library from any device, anywhere, anytime."
            accent="bark"
          />
        </div>
      </section>

      {/* ░░░ BENEFITS ░░░ */}
      <section className="mb-16">
        <div className="mb-8 text-center">
          <SectionBadge icon={GraduationCap} label="Who Benefits" />
          <h2 className="mt-4 text-2xl font-extrabold text-bark-900 sm:text-3xl">
            Built for Students & Librarians
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Students */}
          <div className="rounded-2xl border border-bark-100 bg-paper p-7 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-olive/20 text-olive-dark border border-olive/30">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-bark-900">For Students</h3>
            </div>
            <ul className="space-y-3">
              <BenefitItem text="Browse and search the full catalog anytime — no need to visit the physical library." />
              <BenefitItem text="Reserve books in advance and receive real-time availability notifications." />
              <BenefitItem text="Track borrowing history, due dates, and fines from a personal dashboard." />
              <BenefitItem text="Read digital titles directly in the browser through the built-in e-reader." />
              <BenefitItem text="Purchase books securely via integrated M-Pesa payments with cart management." />
              <BenefitItem text="Get AI-powered book recommendations tailored to your reading habits." />
            </ul>
          </div>

          {/* Librarians */}
          <div className="rounded-2xl border border-bark-100 bg-paper p-7 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tan/20 text-tan-dark border border-tan/30">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-bark-900">For Librarians</h3>
            </div>
            <ul className="space-y-3">
              <BenefitItem text="Manage the entire catalog — add, edit, and remove books with a few clicks." />
              <BenefitItem text="Process checkouts, returns, and renewals from a streamlined circulation desk." />
              <BenefitItem text="Monitor overdue items and send automated reminders to members." />
              <BenefitItem text="View real-time analytics on collection usage, popular titles, and member activity." />
              <BenefitItem text="Handle reservations and waitlists without manual spreadsheets." />
              <BenefitItem text="Role-based access ensures sensitive admin features stay protected." />
            </ul>
          </div>
        </div>
      </section>

      {/* ░░░ CTA ░░░ */}
      <section className="text-center">
        <div className="mx-auto max-w-lg rounded-2xl border border-bark-100 bg-cream-light/40 p-8 shadow-card">
          <h2 className="mb-2 text-lg font-bold text-bark-900">
            Ready to Explore?
          </h2>
          <p className="mb-5 text-xs text-bark-500">
            Sign in to access the full catalog, borrow books, and manage your
            library experience.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-bark-700 px-5 py-2.5 text-xs font-bold text-cream-light shadow-card transition hover:bg-bark-900"
          >
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
