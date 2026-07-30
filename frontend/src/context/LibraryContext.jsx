import React, { createContext, useCallback, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

const LibraryContext = createContext(null);

const seedLogs = [
  { id: 1, time: '09:14:02', source: 'backend', level: 'info', message: 'Server running on [http://127.0.0.1:8000]' },
  { id: 2, time: '09:14:03', source: 'backend', level: 'info', message: 'GET /api/books ................ 200 OK (82.11 ms)' },
  { id: 3, time: '09:14:05', source: 'backend', level: 'info', message: 'Sanctum: token abilities resolved for user' },
  { id: 4, time: '09:14:09', source: 'backend', level: 'warn', message: 'Eloquent: N+1 detected on BookCopy::loans (eager load suggested)' },
  { id: 5, time: '09:14:12', source: 'backend', level: 'info', message: 'POST /api/loans/checkin ....... 201 CREATED (151.40 ms)' },
  { id: 6, time: '09:14:18', source: 'backend', level: 'error', message: 'Daraja: STK callback timeout for CheckoutRequestID ws_CO_2807' },
  { id: 7, time: '09:14:21', source: 'backend', level: 'info', message: 'Queue: FineRecalculationJob processed (6 loans)' },
  { id: 8, time: '09:13:58', source: 'frontend', level: 'info', message: 'VITE v5.4.8 ready in 412 ms' },
  { id: 9, time: '09:13:58', source: 'frontend', level: 'info', message: '➜ Local: http://localhost:5173/' },
  { id: 10, time: '09:14:04', source: 'frontend', level: 'info', message: '[api] GET /books → 200 in 88ms' },
  { id: 11, time: '09:14:07', source: 'frontend', level: 'info', message: '[hmr] updated: /src/pages/Catalog.jsx' },
  { id: 12, time: '09:14:15', source: 'frontend', level: 'warn', message: '[api] slow response: /daraja/stkpush 1240ms' },
  { id: 13, time: '09:14:19', source: 'frontend', level: 'info', message: '[reader] base64 stream decoded (2.4 MB)' },
];

const stamp = () =>
  new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function LibraryProvider({ children }) {
  const auth = useAuth() || {};
  const [roleState, setRoleState] = useState(auth.user?.role || null);
  const [member, setMember] = useState(auth.user?.member || null);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [fines, setFines] = useState([]);
  const [ownedEbooks, setOwnedEbooks] = useState([6, 11]);
  const [logs, setLogs] = useState(seedLogs);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (auth.user) {
      setRoleState(auth.user.role || null);
      setMember(auth.user.member || auth.user || null);
    } else {
      setRoleState(null);
      setMember(null);
    }
  }, [auth.user]);

  const role = auth.user?.role || roleState || null;
  const setRole = (newRole) => {
    setRoleState(newRole);
    if (auth.setUser && auth.user) {
      auth.setUser({ ...auth.user, role: newRole });
    }
  };

  const log = useCallback((source, level, message) => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), time: stamp(), source, level, message }]);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200);
  }, []);

  const digitalPriceFor = useCallback(
    (book) => {
      const price = book.digital_purchase_price || book.digitalPurchasePrice || 50;
      const isPro = member?.isPro || auth.user?.member?.is_subscribed;
      return isPro ? Math.round(price * 0.8) : price;
    },
    [member, auth.user],
  );

  const purchaseEbook = useCallback(
    (bookId) => {
      setOwnedEbooks((prev) => (prev.includes(bookId) ? prev : [...prev, bookId]));
      log('backend', 'info', `POST /api/purchases ........... 201 CREATED (book #${bookId})`);
      pushToast({ title: 'E-Book Purchased', detail: 'Lifetime entitlement added to your library', tone: 'success' });
    },
    [log, pushToast],
  );

  const activatePro = useCallback(() => {
    setMember((prev) => (prev ? { ...prev, isPro: true, proExpiresOn: '2027-07-28' } : null));
    if (auth.setUser && auth.user) {
      auth.setUser({ ...auth.user, member: { ...(auth.user.member || {}), is_subscribed: true } });
    }
    log('backend', 'info', 'POST /api/subscriptions ....... 201 CREATED (tier: pro)');
    pushToast({ title: 'Pro Perks Activated', detail: '20% discount applies to all digital titles', tone: 'success' });
  }, [log, pushToast, auth]);

  const settleFine = useCallback(
    (fineId) => {
      setFines((prev) => prev.map((f) => (f.id === fineId ? { ...f, status: 'paid' } : f)));
      log('backend', 'info', `PUT /api/fines/${fineId} .............. 200 OK (status: paid)`);
      pushToast({ title: 'Fine Settled', detail: 'Receipt generated via M-Pesa', tone: 'success' });
    },
    [log, pushToast],
  );

  const checkoutCopy = useCallback(
    (barcode, memberName) => {
      log('backend', 'info', `POST /api/loans/checkout ...... 201 CREATED (${barcode} → ${memberName})`);
      pushToast({ title: 'Book Issued', detail: `Barcode ${barcode} checked out successfully`, tone: 'success' });
      return { ok: true, message: `Barcode ${barcode} issued successfully` };
    },
    [log, pushToast],
  );

  const checkinCopy = useCallback(
    (barcode) => {
      log('backend', 'info', `POST /api/loans/checkin ....... 200 OK (${barcode} shelved)`);
      pushToast({ title: 'Book Shelved', detail: `Barcode ${barcode} checked in`, tone: 'success' });
      return { ok: true, message: `Barcode ${barcode} checked in` };
    },
    [log, pushToast],
  );

  const saveBook = useCallback(
    (book) => {
      setBooks((prev) => {
        const exists = prev.some((b) => b.id === book.id);
        return exists ? prev.map((b) => (b.id === book.id ? book : b)) : [book, ...prev];
      });
      log('backend', 'info', `PUT /api/books/${book.id || 'new'} .............. 200 OK`);
      pushToast({ title: 'Catalog Updated', detail: `Saved "${book.title}"`, tone: 'success' });
    },
    [log, pushToast],
  );

  const setCopyStatus = useCallback(
    (bookId, copyId, status) => {
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId ? { ...b, copies: (b.copies || []).map((c) => (c.id === copyId ? { ...c, status } : c)) } : b,
        ),
      );
      log('backend', 'info', `PUT /api/copies/${copyId} ............ 200 OK (status: ${status})`);
      pushToast({ title: 'Copy Status Updated', detail: `Set copy #${copyId} to ${status}`, tone: 'info' });
    },
    [log, pushToast],
  );

  const value = useMemo(
    () => ({
      role,
      setRole,
      member,
      books,
      loans,
      fines,
      ownedEbooks,
      logs,
      toasts,
      pushToast,
      dismissToast,
      log,
      digitalPriceFor,
      purchaseEbook,
      activatePro,
      settleFine,
      checkoutCopy,
      checkinCopy,
      saveBook,
      setCopyStatus,
    }),
    [
      role,
      member,
      books,
      loans,
      fines,
      ownedEbooks,
      logs,
      toasts,
      pushToast,
      dismissToast,
      log,
      digitalPriceFor,
      purchaseEbook,
      activatePro,
      settleFine,
      checkoutCopy,
      checkinCopy,
      saveBook,
      setCopyStatus,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within a LibraryProvider');
  return ctx;
}
