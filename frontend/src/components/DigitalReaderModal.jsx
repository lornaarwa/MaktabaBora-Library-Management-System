import React, { useState } from 'react';
import { BookOpenIcon, DownloadIcon, ExternalLinkIcon, BookmarkIcon, PlusIcon, MinusIcon } from 'lucide-react';
import { Modal } from './ui/Modal';

export default function DigitalReaderModal({ isOpen, open, onClose, bookData, book }) {
    const activeBook = bookData || book;
    const [fontSize, setFontSize] = useState(15);
    const [page, setPage] = useState(1);

    const isOpenState = open !== undefined ? open : isOpen;
    if (!isOpenState || !activeBook) return null;

    return (
        <Modal
            open={isOpenState}
            onClose={onClose}
            title={activeBook.title}
            subtitle={`By ${activeBook.author || 'Author'}`}
            size="lg"
            footer={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.max(12, s - 1))}
                            className="rounded border border-bark-100 p-1.5 text-bark-700 hover:bg-cream"
                            title="Decrease text size"
                        >
                            <MinusIcon className="h-3.5 w-3.5" />
                        </button>
                        <span className="font-mono text-xs text-bark-500">{fontSize}px</span>
                        <button
                            type="button"
                            onClick={() => setFontSize((s) => Math.min(22, s + 1))}
                            className="rounded border border-bark-100 p-1.5 text-bark-700 hover:bg-cream"
                            title="Increase text size"
                        >
                            <PlusIcon className="h-3.5 w-3.5" />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeBook.file_url && (
                            <>
                                <a
                                    href={activeBook.file_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-bark-700 px-3.5 py-1.5 text-xs font-bold text-cream-light transition hover:bg-bark-900 flex items-center gap-1.5"
                                >
                                    <ExternalLinkIcon className="h-3.5 w-3.5" /> Open Full Screen
                                </a>
                                <a
                                    href={activeBook.file_url}
                                    download
                                    className="rounded-lg border border-bark-100 bg-paper px-3 py-1.5 text-xs font-semibold text-bark-900 transition hover:bg-cream flex items-center gap-1.5"
                                >
                                    <DownloadIcon className="h-3.5 w-3.5" /> Download
                                </a>
                            </>
                        )}
                    </div>
                </div>
            }
        >
            <div className="rounded-xl border border-bark-100 bg-paper p-6 shadow-inner font-serif text-bark-900 leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                <div className="mb-4 pb-3 border-b border-bark-100 font-sans text-xs flex justify-between items-center text-bark-500">
                    <span>DIGITAL EDITION · STREAM VERIFIED</span>
                    <span className="font-mono">PAGE {page} OF {activeBook.pages || 240}</span>
                </div>

                <p className="mb-4">
                    The reading room smelled of dust and cardamom, the way it always had at the hour before closing. Light came sideways through the high louvres, striping the long tables where the students bent over their notes.
                </p>
                <p className="mb-4">
                    She had learned the shelves by touch, the way a musician learns a fretboard: history at the far wall, poetry near the window where the paint had blistered, the reference volumes chained by habit rather than fear.
                </p>
                <p className="mb-4">
                    Every book that left the building carried a small debt of trust. Every book that returned carried something of the reader back with it — a pressed leaf, a bus ticket, a name written and then crossed out again.
                </p>
            </div>
        </Modal>
    );
}
