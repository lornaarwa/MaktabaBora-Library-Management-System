import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  Calendar,
  CheckCircle2,
  Hash,
  Info,
  Library,
  Loader2,
  MapPin,
  ShieldAlert,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Tag,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLibrary } from '../context/LibraryContext';
import { api } from '../services/api';
import { BookCover } from '../components/ui/BookCover';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import BookMiniCard from '../components/BookMiniCard';
import DarajaPayModal from '../components/DarajaPayModal';
import DigitalReaderModal from '../components/DigitalReaderModal';

const copyStatusMeta = {
  available: { label: 'Available', dot: 'bg-olive-dark', tone: 'available' },
  checked_out: { label: 'On Loan', dot: 'bg-tan-dark', tone: 'loaned' },
  reserved: { label: 'Reserved', dot: 'bg-[#b45309]', tone: 'warning' },
  maintenance: { label: 'Maintenance', dot: 'bg-sage-dark', tone: 'maintenance' },
};

export default function BookDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useLibrary();

  const [book, setBook] = useState(location.state?.book || null);
  const [loading, setLoading] = useState(!book);
  const [error, setError] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  // Modals
  const [readerModal, setReaderModal] = useState({ isOpen: false, data: null });
  const [darajaModal, setDarajaModal] = useState({ isOpen: false, type: 'digital', item: null });

  const fetchBook = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBookDetails(id);
      setBook(data.book || data);
    } catch (err) {
      setError(err.status === 404 ? 'This book is no longer in the catalog.' : (err.message || 'Could not load book details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Content-based "More like this" (TF-IDF similarity)
  useEffect(() => {
    if (!book?.id) return;
    let cancelled = false;
    setSimilarLoading(true);
    api.getSimilarBooks(book.id)
      .then((res) => {
        if (!cancelled) setSimilarBooks(res.data || res || []);
      })
      .catch(() => {
        if (!cancelled) setSimilarBooks([]);
      })
      .finally(() => {
        if (!cancelled) setSimilarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [book?.id]);

  const handleReadDigital = async (target) => {
    try {
      const res = await api.readDigitalBook(target.id);
      setReaderModal({ isOpen: true, data: res.data || res });
    } catch (err) {
      if (err.status === 403) {
        setDarajaModal({ isOpen: true, type: 'digital', item: target });
      } else {
        alert(err.message || 'Failed to stream digital book.');
      }
    }
  };

  const handleReserve = async (target) => {
    setReserving(true);
    try {
      await api.reserveBook(target.id);
      alert(`Hold reservation placed successfully for "${target.title}"!`);
    } catch (err) {
      alert(err.message || 'Could not place reservation.');
    } finally {
      setReserving(false);
    }
  };

  if (loading && !book) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Skeleton className="h-5 w-40" />
        <div className="grid gap-8 lg:grid-cols-[340px,1fr]">
          <Skeleton className="aspect-[3/4] w-full max-w-[340px] rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-12 w-full max-w-sm rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error && !book) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10">
        <ErrorState
          title="We couldn't load this book"
          description={error}
          onRetry={fetchBook}
          action={
            <Link to="/catalog">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" /> Back to Catalog
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  if (!book) return null;

  const isAvailable = (book.available_copies > 0 || (book.copies || []).some((c) => c.status === 'available')) && !book.is_blocked;
  const isSubscribed = user?.member?.is_subscribed;
  const stdPrice = Number(book.digital_purchase_price || 50.0);
  const finalPrice = isSubscribed ? Math.round((stdPrice * 0.8) * 100) / 100 : stdPrice;
  const copies = book.copies || [];
  const onLoanCount = copies.filter((c) => c.status === 'checked_out').length;
  const reservedCount = copies.filter((c) => c.status === 'reserved').length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Back link */}
      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }}>
        <Link
          to="/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-bark-500 transition hover:text-bark-900"
        >
          <ArrowLeft className="h-4 w-4" /> Browse Catalog
        </Link>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-[340px,1fr]">

        {/* Cover column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className="relative overflow-hidden rounded-2xl border border-bark-100 bg-paper shadow-card">
            <div className="aspect-[3/4] w-full">
              <BookCover book={book} className="h-full w-full rounded-2xl" />
            </div>
            {book.is_blocked && (
              <div className="absolute inset-0 flex items-center justify-center bg-bark-900/45 backdrop-blur-[2px]">
                <Badge tone="overdue" className="flex items-center gap-1 px-3 py-1 text-xs shadow-lift">
                  <ShieldAlert size={14} /> RESTRICTED
                </Badge>
              </div>
            )}
            {book.is_exclusive && !book.is_blocked && (
              <div className="absolute top-3 left-3">
                <Badge tone="exclusive">PRO EXCLUSIVE</Badge>
              </div>
            )}
            {!book.is_blocked && (
              <div className="absolute bottom-3 right-3">
                {isAvailable ? (
                  <Badge tone="available" className="flex items-center gap-1 shadow-sm">
                    <CheckCircle2 size={12} /> AVAILABLE
                  </Badge>
                ) : (
                  <Badge tone="loaned" className="flex items-center gap-1 shadow-sm">
                    <BookOpen size={12} /> ON LOAN
                  </Badge>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Info column */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.08, ease: 'easeOut' }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="primary">{book.genre || 'General'}</Badge>
              {book.is_exclusive && <Badge tone="exclusive">PRO EXCLUSIVE</Badge>}
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight tracking-tight text-bark-900">
              {book.title}
            </h1>
            <p className="flex items-center gap-2 text-sm text-bark-700">
              <UserIcon className="h-4 w-4 text-bark-400" />
              By <span className="font-semibold">{book.author}</span>
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {book.publisher && (
                <div className="rounded-xl border border-bark-100 bg-cream-light/40 px-4 py-3">
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-bark-500">
                    <Library className="h-3.5 w-3.5" /> Publisher
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-bark-900">{book.publisher}</dd>
                </div>
              )}
              {book.publication_year && (
                <div className="rounded-xl border border-bark-100 bg-cream-light/40 px-4 py-3">
                  <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-bark-500">
                    <Calendar className="h-3.5 w-3.5" /> Year
                  </dt>
                  <dd className="mt-1 text-xs font-bold text-bark-900">{book.publication_year}</dd>
                </div>
              )}
              <div className="rounded-xl border border-bark-100 bg-cream-light/40 px-4 py-3">
                <dt className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-bark-500">
                  <Hash className="h-3.5 w-3.5" /> ISBN
                </dt>
                <dd className="mt-1 text-xs font-bold text-bark-900 font-mono">{book.isbn}</dd>
              </div>
            </dl>
          </div>

          {/* Description */}
          <section className="space-y-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-bark-900">About this book</h2>
            <p className="text-sm leading-relaxed text-bark-700">
              {book.description || 'No description available for this title yet.'}
            </p>
          </section>

          {/* Availability */}
          <section className="rounded-2xl border border-bark-100 bg-paper p-5 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-bark-900 flex items-center gap-2">
                <Library className="h-4 w-4 text-bark-500" /> Availability
              </h2>
              {!book.is_blocked && (
                <Badge tone={isAvailable ? 'available' : 'loaned'}>
                  {isAvailable
                    ? `${book.available_copies} OF ${book.total_copies} COPIES AVAILABLE`
                    : 'ALL COPIES ON LOAN'}
                </Badge>
              )}
            </div>

            {book.is_blocked ? (
              <p className="text-xs text-bark-500">
                This title is currently restricted and cannot be borrowed or reserved.
              </p>
            ) : copies.length > 0 ? (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {copies.map((copy) => {
                  const meta = copyStatusMeta[copy.status] || copyStatusMeta.maintenance;
                  return (
                    <li
                      key={copy.id}
                      className="flex items-center justify-between rounded-lg border border-bark-100 bg-cream-light/30 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 text-xs font-semibold text-bark-700 font-mono">
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        {copy.barcode}
                      </span>
                      <span className="flex items-center gap-2">
                        {copy.location_rack && (
                          <span className="flex items-center gap-1 text-[10px] text-bark-500 font-mono">
                            <MapPin className="h-3 w-3" /> {copy.location_rack}
                          </span>
                        )}
                        <Badge tone={meta.tone} className="text-[9px]">{meta.label}</Badge>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-xs text-bark-500">
                {book.available_copies > 0
                  ? `${book.available_copies} copy/copies currently available in the library.`
                  : 'No copies currently available — join the hold queue to reserve this title.'}
              </p>
            )}

            {onLoanCount > 0 && (
              <p className="text-[11px] text-bark-500 font-mono">
                {onLoanCount} on loan{reservedCount > 0 ? ` · ${reservedCount} reserved` : ''} · queue your reservation below.
              </p>
            )}
          </section>

          {/* Digital e-book panel */}
          <section className="rounded-2xl border border-bark-100 bg-paper p-5 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-bark-500 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Digital E-Book
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-bark-900">KES {finalPrice.toFixed(2)}</span>
                  {isSubscribed ? (
                    <>
                      <span className="font-mono text-sm text-bark-500 line-through">KES {stdPrice.toFixed(2)}</span>
                      <Badge tone="primary" className="text-[9px]">20% PRO OFF</Badge>
                    </>
                  ) : (
                    <span className="font-mono text-[11px] text-bark-500">20% off with Pro</span>
                  )}
                </div>
                {Number(book.foreign_price) > 0 && book.foreign_price_kes_estimate ? (
                  <p
                    className="mt-2 text-[11px] text-bark-500 font-mono flex items-start gap-1.5"
                    title="Converted at today's exchange rate — not the Kenyan retail price"
                  >
                    <Info className="h-3 w-3 mt-0.5 shrink-0" />
                    <span>
                      {book.foreign_currency === 'USD' ? 'US$' : book.foreign_currency}{' '}
                      {Number(book.foreign_price).toFixed(2)} · ≈ KSh{' '}
                      {Number(book.foreign_price_kes_estimate).toLocaleString()}{' '}
                      <span className="text-bark-400">(estimated, not Kenyan retail)</span>
                    </span>
                  </p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => addToCart(book)} title="Add item to shopping cart">
                  <ShoppingCart className="h-4 w-4" /> Add to Cart
                </Button>
                <Button variant="primary" onClick={() => setDarajaModal({ isOpen: true, type: 'digital', item: book })}>
                  <ShoppingBag className="h-4 w-4" /> Buy Now
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-bark-100 pt-4">
              <p className="flex items-center gap-1.5 text-[11px] text-bark-500">
                <Sparkles className="h-3.5 w-3.5 text-tan-dark" />
                {isSubscribed
                  ? 'Your Pro discount is applied automatically.'
                  : 'Join Pro Perks for 20% off every digital title.'}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => handleReadDigital(book)} className="border border-bark-100">
                  <BookOpen className="h-4 w-4" /> Read Sample / Stream
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleReserve(book)}
                  disabled={book.is_blocked || reserving}
                >
                  {reserving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                  {isAvailable ? 'Reserve Copy' : 'Join Hold Queue'}
                </Button>
              </div>
            </div>

            <p className="text-[11px] text-bark-500">
              Ready to explore more?{' '}
              <Link to="/catalog" className="inline-flex items-center gap-1 font-semibold text-bark-700 hover:text-bark-900">
                Back to catalog <ArrowRight className="h-3 w-3" />
              </Link>
            </p>
          </section>
        </motion.div>
      </div>

      {/* More like this */}
      {(similarLoading || similarBooks.length > 0) && (
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-bark-900">
              <Library className="h-4 w-4 text-bark-500" /> More Like This
            </h2>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1 text-xs font-semibold text-bark-500 transition hover:text-bark-900"
            >
              Browse catalog <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {similarLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {similarBooks.map((similarBook) => (
                <BookMiniCard key={similarBook.id} book={similarBook} />
              ))}
            </div>
          )}
        </motion.section>
      )}

      {/* Modals */}
      <DigitalReaderModal
        isOpen={readerModal.isOpen}
        onClose={() => setReaderModal({ isOpen: false, data: null })}
        bookData={readerModal.data}
      />
      <DarajaPayModal
        isOpen={darajaModal.isOpen}
        onClose={() => setDarajaModal({ isOpen: false, type: 'digital', item: null })}
        type={darajaModal.type}
        item={darajaModal.item}
      />
    </div>
  );
}