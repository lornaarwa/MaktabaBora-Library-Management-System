import React, { useState } from 'react';
import {
  Send,
  Phone,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  MessageSquare,
  Headphones,
} from 'lucide-react';

/* ─── tiny helpers ─── */

function SectionBadge({ icon: Icon, label }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-bark-700 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-cream-light shadow-sm">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function InfoCard({ icon: Icon, title, children, accent }) {
  const accentMap = {
    tan: 'bg-tan/20 text-tan-dark border-tan/30',
    olive: 'bg-olive/20 text-olive-dark border-olive/30',
    sage: 'bg-sage/20 text-sage-dark border-sage/30',
    bark: 'bg-bark-50 text-bark-700 border-bark-100',
  };

  return (
    <div className="group rounded-2xl border border-bark-100 bg-paper p-6 shadow-card transition-all duration-300 hover:shadow-lift hover:-translate-y-0.5">
      <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${accentMap[accent] || accentMap.bark}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mb-1.5 text-sm font-bold text-bark-900">{title}</h3>
      <div className="text-xs leading-relaxed text-bark-500">{children}</div>
    </div>
  );
}

/* ─── main page ─── */

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');

    try {
      // Simulate a short network delay
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
    } catch {
      setErrorMsg('Something went wrong. Please try again later.');
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* ░░░ HERO ░░░ */}
      <section className="mb-14 text-center">
        <SectionBadge icon={Headphones} label="Contact Us" />

        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-bark-900 sm:text-5xl">
          Get in <span className="text-tan-dark">Touch</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-bark-500 sm:text-base">
          Have a question, suggestion, or need help with the library system?
          We'd love to hear from you. Reach out through the form below or use
          any of our contact channels.
        </p>
      </section>

      {/* ░░░ INFO CARDS ░░░ */}
      <section className="mb-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard icon={Phone} title="Phone" accent="tan">
          <a
            href="tel:+254712345678"
            className="font-semibold text-bark-700 transition hover:text-bark-900"
          >
            +254 716052342
          </a>
          <p className="mt-1">Mon – Fri, 8 AM – 6 PM</p>
        </InfoCard>

        <InfoCard icon={Mail} title="Email" accent="olive">
          <a
            href="mailto:info@maktababora.ac.ke"
            className="font-semibold text-bark-700 transition hover:text-bark-900"
          >
            info@maktababora.ac.ke
          </a>
          <p className="mt-1">We reply within 24 hours</p>
        </InfoCard>

        <InfoCard icon={MapPin} title="Location" accent="sage">
          <p className="font-semibold text-bark-700">
            MaktabaBora Library
          </p>
          <p className="mt-1">
            University of Nairobi, Main Campus<br />
            Harry Thuku Road, Nairobi, Kenya
          </p>
        </InfoCard>

        <InfoCard icon={Clock} title="Opening Hours" accent="bark">
          <ul className="space-y-1">
            <li className="flex justify-between gap-2">
              <span className="font-semibold text-bark-700">Mon – Fri</span>
              <span>8:00 AM – 9:00 PM</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="font-semibold text-bark-700">Saturday</span>
              <span>9:00 AM – 5:00 PM</span>
            </li>
            <li className="flex justify-between gap-2">
              <span className="font-semibold text-bark-700">Sunday</span>
              <span>Closed</span>
            </li>
          </ul>
        </InfoCard>
      </section>

      {/* ░░░ FORM + MAP ░░░ */}
      <section className="grid gap-6 lg:grid-cols-5">
        {/* Contact Form — takes 3 cols */}
        <div className="lg:col-span-3 rounded-2xl border border-bark-100 bg-paper p-7 shadow-card">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-bark-900">Send Us a Message</h2>
            <p className="mt-1 text-xs text-bark-500">
              Fill out the form and our team will get back to you shortly.
            </p>
          </div>

          {status === 'sent' ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-olive/20 text-olive-dark">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h3 className="text-base font-bold text-bark-900">Message Sent!</h3>
              <p className="max-w-xs text-xs text-bark-500">
                Thank you for reaching out. We'll respond to your message within
                24 hours.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-2 rounded-xl bg-bark-700 px-5 py-2 text-xs font-bold text-cream-light shadow-card transition hover:bg-bark-900"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="mb-1 block text-xs font-semibold text-bark-700"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-bark-400" />
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-bark-100 bg-paper py-2.5 pl-9 pr-3 text-xs text-bark-900 transition focus:border-bark-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="mb-1 block text-xs font-semibold text-bark-700"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-bark-400" />
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-bark-100 bg-paper py-2.5 pl-9 pr-3 text-xs text-bark-900 transition focus:border-bark-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="contact-message"
                  className="mb-1 block text-xs font-semibold text-bark-700"
                >
                  Message
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-bark-400" />
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={handleChange}
                    required
                    placeholder="How can we help you?"
                    className="w-full resize-none rounded-xl border border-bark-100 bg-paper py-2.5 pl-9 pr-3 text-xs leading-relaxed text-bark-900 transition focus:border-bark-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Error */}
              {status === 'error' && (
                <div className="flex items-center gap-2 rounded-xl border border-[#a8452f]/30 bg-cream p-3 text-xs text-[#8c3620]">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'sending'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-bark-700 py-3 text-xs font-bold text-cream-light shadow-card transition-all hover:bg-bark-900 disabled:opacity-50"
              >
                {status === 'sending' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Map / Location Illustration — takes 2 cols */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Embedded map */}
          <div className="flex-1 overflow-hidden rounded-2xl border border-bark-100 shadow-card">
            <iframe
              title="MaktabaBora Library Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8175530122107!2d36.81723931475395!3d-1.2787400990656984!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f17300b5a78bf%3A0x46e52b9a3aa3bfdb!2sUniversity%20of%20Nairobi!5e0!3m2!1sen!2ske!4v1690000000000!5m2!1sen!2ske"
              className="h-full min-h-[260px] w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>

          {/* Quick-reach mini-card */}
          <div className="rounded-2xl border border-bark-100 bg-cream-light/40 p-5 shadow-card">
            <h3 className="mb-2 text-sm font-bold text-bark-900">Need Urgent Help?</h3>
            <p className="mb-3 text-xs leading-relaxed text-bark-500">
              For time-sensitive issues like lost books, account lockouts, or
              payment queries, call us directly during working hours.
            </p>
            <a
              href="tel:+254712345678"
              className="inline-flex items-center gap-2 rounded-xl bg-bark-700 px-4 py-2 text-xs font-bold text-cream-light shadow-card transition hover:bg-bark-900"
            >
              <Phone className="h-3.5 w-3.5" />
              Call Now
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
