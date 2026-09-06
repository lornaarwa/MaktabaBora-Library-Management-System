import React, { useState, useEffect, useMemo } from 'react';
import { 
    BookOpen, Download, ExternalLink, Plus, Minus, Maximize2, 
    FileText, Sparkles, ChevronLeft, ChevronRight, Sun, Moon, 
    Coffee, Search, Bookmark, List, CheckCircle2, ShieldCheck, X
} from 'lucide-react';
import { Modal } from './ui/Modal';

export default function DigitalReaderModal({ isOpen, open, onClose, bookData, book }) {
    const activeBook = bookData || book;
    
    // Reader configuration state
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState('serif'); // 'serif' | 'sans'
    const [theme, setTheme] = useState('sepia'); // 'day' | 'sepia' | 'night'
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'embed' | 'pdf'
    const [searchQuery, setSearchQuery] = useState('');
    const [showToc, setShowToc] = useState(false);
    const [blobPdfUrl, setBlobPdfUrl] = useState(null);

    const isOpenState = open !== undefined ? open : isOpen;

    // Chapters parsing
    const chapters = useMemo(() => {
        if (!activeBook) return [];
        if (Array.isArray(activeBook.chapters) && activeBook.chapters.length > 0) {
            return activeBook.chapters;
        }
        // Fallback: check if activeBook.file_path contains JSON chapters
        if (typeof activeBook.file_path === 'string' && activeBook.file_path.trim().startsWith('{')) {
            try {
                const parsed = JSON.parse(activeBook.file_path);
                if (Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
                    return parsed.chapters;
                }
            } catch (e) {
                // Not JSON
            }
        }
        // Default single chapter from description
        return [
            {
                number: 1,
                title: 'Overview and Introduction',
                subtitle: 'Smart Library Digital Edition',
                content: activeBook.description || `Welcome to the digital reading stream for "${activeBook.title || 'this book'}".\n\nEnjoy lifetime reading access via the Smart Library Management System.`,
            }
        ];
    }, [activeBook]);

    // Handle Blob creation for base64 PDF data URIs to circumvent Chromium iframe security blocks
    useEffect(() => {
        let objectUrl = null;
        const fileUrl = activeBook?.file_url || activeBook?.file_path;
        
        if (fileUrl && typeof fileUrl === 'string' && fileUrl.startsWith('data:application/pdf')) {
            try {
                const parts = fileUrl.split(',');
                if (parts.length > 1) {
                    const binaryString = window.atob(parts[1]);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                        bytes[i] = binaryString.charCodeAt(i);
                    }
                    const blob = new Blob([bytes], { type: 'application/pdf' });
                    objectUrl = URL.createObjectURL(blob);
                    setBlobPdfUrl(objectUrl);
                }
            } catch (e) {
                console.error('Error generating PDF blob URL:', e);
            }
        } else {
            setBlobPdfUrl(null);
        }

        // Set default view mode based on content availability
        if (chapters.length > 0) {
            setViewMode('reader');
        } else if (fileUrl && (fileUrl.startsWith('http') || fileUrl.includes('archive.org'))) {
            setViewMode('embed');
        } else {
            setViewMode('reader');
        }

        setCurrentChapterIndex(0);

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [activeBook, chapters]);

    if (!isOpenState || !activeBook) return null;

    const title = activeBook.title || 'Digital E-Book';
    const author = activeBook.author || 'Library Catalog';
    const totalChapters = chapters.length;
    const currentChapter = chapters[currentChapterIndex] || chapters[0];
    const readingProgressPercent = totalChapters > 0 ? Math.round(((currentChapterIndex + 1) / totalChapters) * 100) : 100;
    const rawFileUrl = activeBook.file_url || activeBook.file_path;
    const isExternalEmbed = rawFileUrl && typeof rawFileUrl === 'string' && (rawFileUrl.startsWith('http://') || rawFileUrl.startsWith('https://'));

    // Theme color maps
    const themeStyles = {
        day: {
            bg: 'bg-white',
            text: 'text-zinc-900',
            border: 'border-zinc-200',
            container: 'bg-[#FDFCFA] text-[#1E1E24]',
            chapterHeader: 'border-zinc-200 text-zinc-900',
            subtext: 'text-zinc-500',
            accent: 'bg-zinc-100 text-zinc-800',
        },
        sepia: {
            bg: 'bg-[#F4ECD8]',
            text: 'text-[#433422]',
            border: 'border-[#E4D5BE]',
            container: 'bg-[#FAF4E8] text-[#3D2E1E]',
            chapterHeader: 'border-[#E4D5BE] text-[#3D2E1E]',
            subtext: 'text-[#7D6B56]',
            accent: 'bg-[#EFE3CD] text-[#433422]',
        },
        night: {
            bg: 'bg-[#18181B]',
            text: 'text-[#E4E4E7]',
            border: 'border-[#27272A]',
            container: 'bg-[#09090B] text-[#D4D4D8]',
            chapterHeader: 'border-[#27272A] text-[#FAFAFA]',
            subtext: 'text-[#A1A1AA]',
            accent: 'bg-[#27272A] text-[#FAFAFA]',
        },
    };

    const currentTheme = themeStyles[theme] || themeStyles.sepia;

    // Filter chapter paragraphs if search query exists
    const chapterParagraphs = (currentChapter?.content || '').split('\n\n');
    const filteredParagraphs = searchQuery.trim()
        ? chapterParagraphs.filter(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
        : chapterParagraphs;

    return (
        <Modal
            open={isOpenState}
            onClose={onClose}
            title={title}
            subtitle={`By ${author} · Lifetime Authorized Reader`}
            size="xl"
            footer={
                <div className="flex flex-wrap items-center justify-between gap-3 w-full">
                    {/* View Mode Switching */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center rounded-xl border border-bark-100 bg-cream-light/60 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('reader')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                    viewMode === 'reader'
                                        ? 'bg-bark-700 text-cream-light shadow-sm'
                                        : 'text-bark-700 hover:text-bark-900'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>Chapter Reader</span>
                            </button>

                            {(blobPdfUrl || isExternalEmbed) && (
                                <button
                                    type="button"
                                    onClick={() => setViewMode(blobPdfUrl ? 'pdf' : 'embed')}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                                        viewMode !== 'reader'
                                            ? 'bg-bark-700 text-cream-light shadow-sm'
                                            : 'text-bark-700 hover:text-bark-900'
                                    }`}
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>{blobPdfUrl ? 'PDF Document' : 'Original Embed'}</span>
                                </button>
                            )}
                        </div>

                        {/* Chapter Pagination Buttons in Reader Mode */}
                        {viewMode === 'reader' && totalChapters > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentChapterIndex(prev => Math.max(0, prev - 1))}
                                    disabled={currentChapterIndex === 0}
                                    className="p-1.5 rounded-lg border border-bark-100 bg-paper text-bark-700 hover:bg-cream disabled:opacity-40"
                                    title="Previous Chapter"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="font-mono text-xs text-bark-600 px-2">
                                    Ch. {currentChapterIndex + 1} / {totalChapters}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentChapterIndex(prev => Math.min(totalChapters - 1, prev + 1))}
                                    disabled={currentChapterIndex >= totalChapters - 1}
                                    className="p-1.5 rounded-lg border border-bark-100 bg-paper text-bark-700 hover:bg-cream disabled:opacity-40"
                                    title="Next Chapter"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Right Action Tools */}
                    <div className="flex items-center gap-2">
                        {blobPdfUrl && (
                            <a
                                href={blobPdfUrl}
                                download={`${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                                className="px-3 py-1.5 rounded-xl border border-bark-100 bg-paper hover:bg-cream text-xs font-semibold text-bark-900 flex items-center gap-1.5 shadow-sm transition"
                            >
                                <Download className="w-3.5 h-3.5 text-tan-dark" />
                                <span>Download PDF</span>
                            </a>
                        )}

                        {isExternalEmbed && (
                            <a
                                href={rawFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-bark-700 hover:bg-bark-800 text-xs font-bold text-cream-light flex items-center gap-1.5 shadow-sm transition"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>Open Full Theater</span>
                            </a>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-3">
                {/* Control Ribbon: Table of Contents, Search, Themes, Typography */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-bark-100 bg-cream-light/40">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowToc(!showToc)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                                showToc ? 'bg-bark-700 text-cream-light border-bark-700' : 'bg-paper text-bark-800 border-bark-100 hover:bg-cream'
                            }`}
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>Contents</span>
                        </button>

                        <div className="relative">
                            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-bark-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search in book..."
                                className="pl-7 pr-6 py-1 rounded-lg border border-bark-100 bg-paper text-xs text-bark-900 placeholder:text-bark-400 w-36 sm:w-48 focus:outline-none focus:border-bark-300"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-bark-400 hover:text-bark-700"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Reading Preferences (Theme, Font Size, Font Style) */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggles */}
                        <div className="flex items-center rounded-lg border border-bark-100 bg-paper p-0.5">
                            <button
                                type="button"
                                onClick={() => setTheme('day')}
                                className={`p-1.5 rounded-md transition ${theme === 'day' ? 'bg-zinc-200 text-zinc-950' : 'text-bark-500 hover:text-bark-800'}`}
                                title="Day mode (clean paper)"
                            >
                                <Sun className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme('sepia')}
                                className={`p-1.5 rounded-md transition ${theme === 'sepia' ? 'bg-[#E4D5BE] text-[#433422]' : 'text-bark-500 hover:text-bark-800'}`}
                                title="Sepia mode (warm reading)"
                            >
                                <Coffee className="w-3.5 h-3.5" />
                            </button>
                            <button
                                type="button"
                                onClick={() => setTheme('night')}
                                className={`p-1.5 rounded-md transition ${theme === 'night' ? 'bg-zinc-800 text-zinc-100' : 'text-bark-500 hover:text-bark-800'}`}
                                title="Night mode (obsidian dark)"
                            >
                                <Moon className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Font Family Toggle */}
                        <div className="flex items-center rounded-lg border border-bark-100 bg-paper p-0.5 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setFontFamily('serif')}
                                className={`px-2 py-1 rounded-md font-serif ${fontFamily === 'serif' ? 'bg-bark-700 text-cream-light' : 'text-bark-600 hover:text-bark-900'}`}
                                title="Book Serif Font"
                            >
                                Serif
                            </button>
                            <button
                                type="button"
                                onClick={() => setFontFamily('sans')}
                                className={`px-2 py-1 rounded-md font-sans ${fontFamily === 'sans' ? 'bg-bark-700 text-cream-light' : 'text-bark-600 hover:text-bark-900'}`}
                                title="Modern Sans Font"
                            >
                                Sans
                            </button>
                        </div>

                        {/* Font Size Zoom */}
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setFontSize(s => Math.max(12, s - 1))}
                                className="p-1.5 rounded-lg border border-bark-100 bg-paper hover:bg-cream text-bark-700"
                                title="Decrease font size"
                            >
                                <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono text-xs text-bark-600 w-8 text-center">{fontSize}px</span>
                            <button
                                type="button"
                                onClick={() => setFontSize(s => Math.min(26, s + 1))}
                                className="p-1.5 rounded-lg border border-bark-100 bg-paper hover:bg-cream text-bark-700"
                                title="Increase font size"
                            >
                                <Plus className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar & Status Header */}
                <div className="flex items-center justify-between px-2 text-[11px] font-mono text-bark-500">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>LIFETIME ACCESS · UNENCRYPTED DIGITAL STREAM</span>
                    </div>
                    <span>CHAPTER {currentChapterIndex + 1} OF {totalChapters} ({readingProgressPercent}% READ)</span>
                </div>
                <div className="w-full bg-cream-light/60 rounded-full h-1.5 overflow-hidden">
                    <div 
                        className="bg-tan-dark h-full transition-all duration-300"
                        style={{ width: `${readingProgressPercent}%` }}
                    />
                </div>

                {/* Main Content Pane */}
                <div className="relative rounded-2xl overflow-hidden border border-bark-100 shadow-inner">
                    {/* Table of Contents Drawer */}
                    {showToc && (
                        <div className="absolute inset-y-0 left-0 w-72 bg-paper border-r border-bark-200 z-20 shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
                            <div className="flex items-center justify-between pb-3 border-b border-bark-100 mb-3">
                                <h3 className="text-xs font-bold uppercase tracking-wider text-bark-900 flex items-center gap-1.5">
                                    <List className="w-3.5 h-3.5 text-tan-dark" /> Table of Contents
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowToc(false)}
                                    className="p-1 text-bark-400 hover:text-bark-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                {chapters.map((ch, idx) => (
                                    <button
                                        key={ch.number || idx}
                                        type="button"
                                        onClick={() => {
                                            setCurrentChapterIndex(idx);
                                            setShowToc(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition ${
                                            currentChapterIndex === idx
                                                ? 'bg-bark-700 text-cream-light font-bold shadow-sm'
                                                : 'text-bark-700 hover:bg-cream-light/60'
                                        }`}
                                    >
                                        <div className="font-mono text-[10px] opacity-75">Chapter {ch.number || idx + 1}</div>
                                        <div className="truncate">{ch.title || `Chapter ${idx + 1}`}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Mode: Native Chapter Reader (Primary) */}
                    {viewMode === 'reader' && (
                        <div 
                            className={`p-6 sm:p-10 max-h-[640px] overflow-y-auto transition-colors duration-200 ${currentTheme.container} ${
                                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                            }`}
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {/* Chapter Header */}
                            <div className={`pb-6 mb-8 border-b ${currentTheme.chapterHeader}`}>
                                <div className="text-center space-y-2">
                                    <span className={`font-mono text-xs uppercase tracking-widest ${currentTheme.subtext}`}>
                                        Chapter {currentChapter?.number || currentChapterIndex + 1} of {totalChapters}
                                    </span>
                                    <h2 className="text-2xl sm:text-3xl font-extrabold font-sans tracking-tight">
                                        {currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}
                                    </h2>
                                    {currentChapter?.subtitle && (
                                        <p className={`text-sm italic ${currentTheme.subtext}`}>
                                            {currentChapter.subtitle}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Chapter Prose Body */}
                            <div className="max-w-3xl mx-auto space-y-6 leading-relaxed">
                                {searchQuery && (
                                    <div className="p-3 rounded-xl bg-tan-light/40 border border-bark-100 font-sans text-xs text-bark-800 mb-4 flex items-center justify-between">
                                        <span>Showing matching paragraphs for <strong>"{searchQuery}"</strong> ({filteredParagraphs.length} matches)</span>
                                        <button onClick={() => setSearchQuery('')} className="underline text-tan-dark font-bold">Clear Filter</button>
                                    </div>
                                )}

                                {filteredParagraphs.map((para, pIdx) => {
                                    const isCodeBlock = para.startsWith('```');
                                    const isBullet = para.startsWith('•') || para.startsWith('- ') || /^\d+\.\s/.test(para);
                                    const isHeading = para.startsWith('###');

                                    if (isHeading) {
                                        return (
                                            <h3 key={pIdx} className="text-lg font-bold font-sans pt-4 border-b border-bark-100/40 pb-1">
                                                {para.replace(/^###\s*/, '')}
                                            </h3>
                                        );
                                    }

                                    if (isCodeBlock) {
                                        return (
                                            <pre key={pIdx} className="p-4 rounded-xl bg-paper/90 border border-bark-200 font-mono text-xs overflow-x-auto my-4 text-bark-900">
                                                {para.replace(/```[a-z]*\n?/g, '')}
                                            </pre>
                                        );
                                    }

                                    if (isBullet) {
                                        return (
                                            <div key={pIdx} className="pl-4 border-l-2 border-tan-dark py-0.5">
                                                {para}
                                            </div>
                                        );
                                    }

                                    return (
                                        <p key={pIdx} className="text-justify indent-6">
                                            {para}
                                        </p>
                                    );
                                })}
                            </div>

                            {/* Chapter Bottom Navigation Footer */}
                            <div className={`mt-12 pt-6 border-t ${currentTheme.chapterHeader} flex items-center justify-between font-sans text-xs`}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentChapterIndex(prev => Math.max(0, prev - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentChapterIndex === 0}
                                    className={`px-4 py-2 rounded-xl border ${currentTheme.border} ${currentTheme.accent} font-bold flex items-center gap-1.5 disabled:opacity-30`}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous Chapter
                                </button>

                                <span className={`font-mono ${currentTheme.subtext}`}>
                                    End of Chapter {currentChapter?.number || currentChapterIndex + 1}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentChapterIndex(prev => Math.min(totalChapters - 1, prev + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentChapterIndex >= totalChapters - 1}
                                    className={`px-4 py-2 rounded-xl border ${currentTheme.border} ${currentTheme.accent} font-bold flex items-center gap-1.5 disabled:opacity-30`}
                                >
                                    Next Chapter <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* View Mode: Blob PDF Document Viewer */}
                    {viewMode === 'pdf' && blobPdfUrl && (
                        <div className="w-full h-[640px] bg-zinc-900 relative">
                            <object
                                data={blobPdfUrl}
                                type="application/pdf"
                                className="w-full h-full"
                            >
                                <div className="p-8 text-center text-white space-y-4">
                                    <p>Your browser does not support inline PDF viewing.</p>
                                    <a
                                        href={blobPdfUrl}
                                        download="book.pdf"
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-tan-dark text-white font-bold"
                                    >
                                        <Download className="w-4 h-4" /> Download PDF File
                                    </a>
                                </div>
                            </object>
                        </div>
                    )}

                    {/* View Mode: External Archive.org Theater Embed */}
                    {viewMode === 'embed' && isExternalEmbed && (
                        <div className="w-full h-[640px] bg-zinc-900 relative">
                            <iframe
                                src={rawFileUrl}
                                title={`Digital stream for ${title}`}
                                className="w-full h-full border-0"
                                allowFullScreen
                            />
                            {/* Overlay fallback badge */}
                            <div className="absolute bottom-4 right-4 bg-paper/90 backdrop-blur-md border border-bark-100 rounded-xl px-3 py-2 text-xs flex items-center gap-2 shadow-lg">
                                <span className="text-bark-700">Having trouble loading external scan?</span>
                                <button
                                    type="button"
                                    onClick={() => setViewMode('reader')}
                                    className="text-tan-dark font-bold underline"
                                >
                                    Switch to In-Browser Reader
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
