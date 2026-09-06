import React, { useState } from 'react';
import { BookOpenIcon, DownloadIcon, ExternalLinkIcon, PlusIcon, MinusIcon, Maximize2Icon, FileTextIcon, SparklesIcon } from 'lucide-react';
import { Modal } from './ui/Modal';

export default function DigitalReaderModal({ isOpen, open, onClose, bookData, book }) {
    const activeBook = bookData || book;
    const [fontSize, setFontSize] = useState(16);
    const [page, setPage] = useState(1);
    const [viewMode, setViewMode] = useState('embed'); // 'embed' | 'text'

    const isOpenState = open !== undefined ? open : isOpen;
    if (!isOpenState || !activeBook) return null;

    const fileUrl = activeBook.file_url;
    const isEmbedAvailable = Boolean(
        fileUrl && (
            fileUrl.includes('archive.org') ||
            fileUrl.startsWith('data:application/pdf') ||
            fileUrl.startsWith('http://') ||
            fileUrl.startsWith('https://') ||
            fileUrl.endsWith('.pdf')
        )
    );

    const title = activeBook.title || 'Digital E-Book';
    const author = activeBook.author || 'Catalog Author';
    const totalPages = activeBook.pages || 180;

    return (
        <Modal
            open={isOpenState}
            onClose={onClose}
            title={title}
            subtitle={`By ${author} · Verified Digital Stream`}
            size="xl"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    {/* View Mode & Zoom Controls */}
                    <div className="flex items-center gap-2">
                        {isEmbedAvailable && (
                            <div className="flex items-center rounded-lg border border-bark-100 bg-cream-light/40 p-0.5">
                                <button
                                    type="button"
                                    onClick={() => setViewMode('embed')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                        viewMode === 'embed'
                                            ? 'bg-bark-700 text-cream-light shadow-sm'
                                            : 'text-bark-700 hover:text-bark-900'
                                    }`}
                                >
                                    <BookOpenIcon className="w-3.5 h-3.5 inline mr-1" />
                                    Reader Stream
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('text')}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${
                                        viewMode === 'text'
                                            ? 'bg-bark-700 text-cream-light shadow-sm'
                                            : 'text-bark-700 hover:text-bark-900'
                                    }`}
                                >
                                    <FileTextIcon className="w-3.5 h-3.5 inline mr-1" />
                                    Text View
                                </button>
                            </div>
                        )}

                        {viewMode === 'text' && (
                            <div className="flex items-center gap-1.5 ml-2">
                                <button
                                    type="button"
                                    onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                                    className="rounded border border-bark-100 p-1.5 text-bark-700 hover:bg-cream"
                                    title="Decrease text size"
                                >
                                    <MinusIcon className="h-3.5 w-3.5" />
                                </button>
                                <span className="font-mono text-xs text-bark-500 w-10 text-center">{fontSize}px</span>
                                <button
                                    type="button"
                                    onClick={() => setFontSize((s) => Math.min(24, s + 1))}
                                    className="rounded border border-bark-100 p-1.5 text-bark-700 hover:bg-cream"
                                    title="Increase text size"
                                >
                                    <PlusIcon className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center gap-2">
                        {fileUrl && (
                            <>
                                <a
                                    href={fileUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-bark-700 px-3 py-1.5 text-xs font-bold text-cream-light transition hover:bg-bark-900 flex items-center gap-1.5 shadow-sm"
                                >
                                    <Maximize2Icon className="h-3.5 w-3.5" /> Open Full Screen
                                </a>
                                {!fileUrl.includes('archive.org') && (
                                    <a
                                        href={fileUrl}
                                        download={`${title}.pdf`}
                                        className="rounded-lg border border-bark-100 bg-paper px-3 py-1.5 text-xs font-semibold text-bark-900 transition hover:bg-cream flex items-center gap-1.5"
                                    >
                                        <DownloadIcon className="h-3.5 w-3.5" /> Download
                                    </a>
                                )}
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-3">
                {/* Header status strip */}
                <div className="flex items-center justify-between px-2 py-1 text-xs border-b border-bark-100 font-mono text-bark-500">
                    <span className="flex items-center gap-1.5 text-olive-dark font-semibold">
                        <SparklesIcon className="w-3.5 h-3.5" /> LIFETIME UNLOCKED · OFFICIAL STREAM
                    </span>
                    <span>{viewMode === 'embed' ? 'INTERACTIVE FLIP READER' : `PAGE ${page} OF ${totalPages}`}</span>
                </div>

                {/* Embed Reader Mode */}
                {viewMode === 'embed' && isEmbedAvailable ? (
                    <div className="w-full h-[620px] rounded-xl overflow-hidden border border-bark-100 bg-cream-light/30 shadow-inner relative">
                        <iframe
                            src={fileUrl}
                            title={`Digital stream for ${title}`}
                            className="w-full h-full border-0"
                            allowFullScreen
                        />
                    </div>
                ) : (
                    /* Formatted Text Reader Mode */
                    <div
                        className="rounded-xl border border-bark-100 bg-paper p-8 shadow-inner font-serif text-bark-900 leading-relaxed max-h-[620px] overflow-y-auto space-y-6"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        <div className="text-center pb-6 border-b border-bark-100">
                            <h2 className="text-2xl font-bold font-sans text-bark-900 tracking-tight">{title}</h2>
                            <p className="text-sm text-bark-500 mt-1">Written by {author}</p>
                            <span className="inline-block mt-2 font-mono text-[10px] text-bark-400 uppercase tracking-widest">
                                Smart Library Digital Edition
                            </span>
                        </div>

                        {activeBook.description && (
                            <div className="bg-cream-light/40 border border-bark-100 rounded-xl p-4 font-sans text-xs text-bark-700 space-y-1">
                                <h4 className="font-bold uppercase tracking-wider text-[10px] text-bark-500">Synopsis / Overview</h4>
                                <p>{activeBook.description}</p>
                            </div>
                        )}

                        <div className="space-y-4 pt-2">
                            <h3 className="font-sans font-bold text-sm tracking-wide text-bark-700 uppercase">Chapter 1: Opening Discourse</h3>
                            <p>
                                The reading room smelled of dust and cardamom, the way it always had at the hour before closing. Light came sideways through the high louvres, striping the long tables where the students bent over their notes.
                            </p>
                            <p>
                                She had learned the shelves by touch, the way a musician learns a fretboard: history at the far wall, poetry near the window where the paint had blistered, the reference volumes chained by habit rather than fear.
                            </p>
                            <p>
                                Every book that left the building carried a small debt of trust. Every book that returned carried something of the reader back with it — a pressed leaf, a bus ticket, a name written and then crossed out again.
                            </p>
                            <p>
                                Knowledge is not merely preserved in pages; it is activated through attentive inquiry. In this digital edition, each chapter offers an invitation into the ideas and craft that shaped this enduring work.
                            </p>
                        </div>

                        {/* Text Mode Pagination Controls */}
                        <div className="flex items-center justify-between pt-6 border-t border-bark-100 font-sans text-xs">
                            <button
                                type="button"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-bark-100 bg-paper text-bark-700 disabled:opacity-40 hover:bg-cream-light/60 transition"
                            >
                                ← Previous Page
                            </button>
                            <span className="font-mono text-bark-500">Page {page} of {totalPages}</span>
                            <button
                                type="button"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-bark-100 bg-paper text-bark-700 disabled:opacity-40 hover:bg-cream-light/60 transition"
                            >
                                Next Page →
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
