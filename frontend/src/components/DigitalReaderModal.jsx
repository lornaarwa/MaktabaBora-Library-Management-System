import React from 'react';
import { X, BookOpen, ShieldCheck, Download, ExternalLink } from 'lucide-react';

export default function DigitalReaderModal({ isOpen, onClose, bookData }) {
    if (!isOpen || !bookData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white leading-tight">{bookData.title}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Lifetime Access Unlocked
                                </span>
                                <span className="text-xs text-slate-500">• Stream Token Verified</span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Viewer Body */}
                <div className="p-8 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400 shadow-inner">
                        <BookOpen className="w-10 h-10" />
                    </div>

                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-bold text-slate-100">Ready to Read</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Your digital authorization token has been verified. You can read or stream this e-book directly in your browser or download the PDF file.
                        </p>
                    </div>

                    {/* Metadata Card */}
                    <div className="w-full max-w-lg bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-left text-xs space-y-2">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Access Mode:</span>
                            <span className="text-slate-300 font-semibold uppercase">{bookData.access_type || 'Lifetime'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Stream Token:</span>
                            <span className="text-indigo-400 font-mono text-[11px] truncate max-w-[200px]">{bookData.stream_token || 'TOKEN-ACTIVE'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 w-full max-w-sm">
                        <a
                            href={bookData.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <ExternalLink className="w-4 h-4" /> Open Full Screen PDF
                        </a>
                        <a
                            href={bookData.file_url}
                            download
                            className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                        >
                            <Download className="w-4 h-4" /> Download
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
