import React from 'react';
import { Printer, X, CheckCircle2, ShieldCheck, BookOpen, Clock, Calendar, Hash, User, Bookmark } from 'lucide-react';

export default function ReceiptModal({ isOpen, onClose, receiptData, type = 'ebook' }) {
  if (!isOpen || !receiptData) return null;

  const isEbook = type === 'ebook';
  const book = receiptData.book || receiptData;
  const member = receiptData.member || {};
  const user = receiptData.user || {};

  const receiptId = receiptData.receipt_number || receiptData.id 
    ? `SLMS-${isEbook ? 'EBK' : 'RES'}-${String(receiptData.id).padStart(6, '0')}`
    : `SLMS-${Date.now().toString().slice(-8)}`;

  const issueDate = receiptData.created_at || receiptData.reserved_at || new Date().toISOString();
  const formattedDate = new Date(issueDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-paper border border-bark-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Action Header (Hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-4 border-b border-bark-100 bg-cream-light/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-bark-700 text-cream-light">
              {isEbook ? <BookOpen className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
            </span>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-bark-800">
              {isEbook ? 'Digital E-Book Receipt' : 'Hold Reservation Slip'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-bark-700 hover:bg-bark-800 text-cream-light text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-xl text-bark-500 hover:text-bark-900 hover:bg-cream transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-bark-900 font-sans print:p-8 print:m-0 print:text-black">
          
          {/* Header & Watermark */}
          <div className="text-center space-y-1.5 border-b border-dashed border-bark-200 pb-5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-300">
              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
              Verified Authentic Record
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-bark-900">
              Maktaba<span className="text-tan-dark">Bora</span> Library System
            </h2>
            <p className="text-xs text-bark-600 font-mono">Official Transaction Receipt & Accountability Slip</p>
          </div>

          {/* Receipt Meta Details */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono border-b border-bark-100 pb-4">
            <div>
              <span className="text-[10px] text-bark-500 uppercase block">Receipt Serial #</span>
              <strong className="text-bark-900 text-xs">{receiptId}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-bark-500 uppercase block">Issued Timestamp</span>
              <span className="text-bark-800 text-xs">{formattedDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-bark-500 uppercase block">Account Member</span>
              <strong className="text-bark-900">{user.name || member.member_number || 'Registered Reader'}</strong>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-bark-500 uppercase block">Member Number</span>
              <span className="text-bark-800">{member.member_number || 'MEM-2026'}</span>
            </div>
          </div>

          {/* Item Description Box */}
          <div className="rounded-2xl border border-bark-100 bg-cream-light/30 p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-tan-dark font-bold">
                  {isEbook ? 'Digital Acquisition' : 'Physical Hold Request'}
                </span>
                <h3 className="text-sm font-extrabold text-bark-900 mt-0.5">{book.title || 'Library Publication'}</h3>
                <p className="text-xs text-bark-600 italic">By {book.author || 'Author'}</p>
                {book.isbn && <p className="text-[10px] font-mono text-bark-500 mt-1">ISBN: {book.isbn}</p>}
              </div>

              {isEbook ? (
                <div className="text-right">
                  <span className="text-base font-extrabold text-bark-900 font-mono">
                    KES {Number(receiptData.purchase_price || book.digital_purchase_price || 50).toLocaleString()}
                  </span>
                  <p className="text-[10px] text-bark-500 font-mono">Paid via M-Pesa</p>
                </div>
              ) : (
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-mono font-bold text-xs border border-amber-300">
                    Queue #{receiptData.queue_position || 1}
                  </span>
                  <p className="text-[10px] text-bark-500 font-mono mt-1 capitalize">Status: {receiptData.status || 'Active Hold'}</p>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-bark-100 flex items-center justify-between text-[11px] font-mono text-bark-600">
              <span>{isEbook ? 'Entitlement: Lifetime In-Browser Reading Stream' : 'Pickup Desk: General Circulation Desk'}</span>
              <span className="text-emerald-700 font-bold">{isEbook ? 'Fulfilled · Active' : 'Hold Queued'}</span>
            </div>
          </div>

          {/* Transaction Verification & Barcode Graphic */}
          <div className="space-y-2 pt-2 text-center">
            {/* SVG Barcode */}
            <div className="flex justify-center items-center py-2">
              <svg className="w-56 h-12" viewBox="0 0 200 40" fill="currentColor">
                <rect x="0" y="0" width="3" height="40" />
                <rect x="5" y="0" width="2" height="40" />
                <rect x="10" y="0" width="4" height="40" />
                <rect x="16" y="0" width="1" height="40" />
                <rect x="20" y="0" width="3" height="40" />
                <rect x="26" y="0" width="2" height="40" />
                <rect x="30" y="0" width="5" height="40" />
                <rect x="38" y="0" width="2" height="40" />
                <rect x="43" y="0" width="3" height="40" />
                <rect x="48" y="0" width="1" height="40" />
                <rect x="52" y="0" width="4" height="40" />
                <rect x="58" y="0" width="2" height="40" />
                <rect x="63" y="0" width="3" height="40" />
                <rect x="68" y="0" width="2" height="40" />
                <rect x="73" y="0" width="4" height="40" />
                <rect x="80" y="0" width="1" height="40" />
                <rect x="84" y="0" width="3" height="40" />
                <rect x="90" y="0" width="2" height="40" />
                <rect x="95" y="0" width="5" height="40" />
                <rect x="103" y="0" width="2" height="40" />
                <rect x="108" y="0" width="3" height="40" />
                <rect x="114" y="0" width="1" height="40" />
                <rect x="118" y="0" width="4" height="40" />
                <rect x="125" y="0" width="2" height="40" />
                <rect x="130" y="0" width="3" height="40" />
                <rect x="136" y="0" width="1" height="40" />
                <rect x="140" y="0" width="4" height="40" />
                <rect x="146" y="0" width="2" height="40" />
                <rect x="151" y="0" width="3" height="40" />
                <rect x="157" y="0" width="2" height="40" />
                <rect x="162" y="0" width="4" height="40" />
                <rect x="169" y="0" width="1" height="40" />
                <rect x="173" y="0" width="3" height="40" />
                <rect x="179" y="0" width="2" height="40" />
                <rect x="184" y="0" width="5" height="40" />
                <rect x="192" y="0" width="2" height="40" />
                <rect x="197" y="0" width="3" height="40" />
              </svg>
            </div>
            <p className="font-mono text-[10px] text-bark-500 tracking-widest">{receiptId}</p>
            <p className="text-[10px] text-bark-500 italic">
              Smart Library System · This document serves as valid proof of transaction for accountability and patron audits.
            </p>
          </div>
        </div>

        {/* Modal Footer (Hidden on print) */}
        <div className="print:hidden px-6 py-3.5 border-t border-bark-100 bg-cream-light/30 flex items-center justify-between">
          <span className="text-[11px] font-mono text-bark-500">Official MaktabaBora Seal</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 rounded-xl bg-bark-700 hover:bg-bark-800 text-cream-light text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-2 rounded-xl border border-bark-100 bg-paper hover:bg-cream text-bark-800 text-xs font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
