import React from 'react';
import { X, BookOpen, ShieldCheck, Download, ExternalLink } from 'lucide-react';

export default function DigitalReaderModal({ isOpen, onClose, bookData }) {
    if (!isOpen || !bookData) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/40">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-300">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-zinc-100 leading-tight">{bookData.title}</h2>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-zinc-400 font-mono flex items-center gap-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-zinc-300" /> Lifetime Access
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Viewer Body */}
                <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center justify-center text-center space-y-5">
                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300 shadow-inner">
                        <BookOpen className="w-8 h-8" />
                    </div>

                    <div className="max-w-md space-y-1">
                        <h3 className="text-lg font-bold text-zinc-100">Ready to Read</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                            Your digital authorization token has been verified. Read or stream this e-book directly in your browser.
                        </p>
                    </div>

                    {/* Metadata Card */}
                    <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-left text-xs space-y-1.5 font-mono">
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Access Mode:</span>
                            <span className="text-zinc-300 font-bold uppercase">{bookData.access_type || 'Lifetime'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-zinc-500">Stream Token:</span>
                            <span className="text-zinc-300 text-[11px] truncate max-w-[180px]">{bookData.stream_token || 'TOKEN-ACTIVE'}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2.5 w-full max-w-sm">
                        <a
                            href={bookData.file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                        >
                            <ExternalLink className="w-4 h-4" /> Open Full Screen PDF
                        </a>
                        <a
                            href={bookData.file_url}
                            download
                            className="py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-zinc-700"
                        >
                            <Download className="w-4 h-4" /> Download
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
}
