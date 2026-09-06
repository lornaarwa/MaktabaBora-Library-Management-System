import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
    BookOpen, Download, ExternalLink, Plus, Minus, Maximize2, 
    FileText, Sparkles, ChevronLeft, ChevronRight, Sun, Moon, 
    Coffee, Search, Bookmark, List, CheckCircle2, ShieldCheck, X,
    Columns, AlignJustify
} from 'lucide-react';
import { Modal } from './ui/Modal';

export default function DigitalReaderModal({ isOpen, open, onClose, bookData, book }) {
    const activeBook = bookData || book;
    
    // Reader configuration state
    const scrollContainerRef = useRef(null);
    const [fontSize, setFontSize] = useState(16);
    const [fontFamily, setFontFamily] = useState('serif'); // 'serif' | 'sans'
    const [theme, setTheme] = useState('sepia'); // 'day' | 'sepia' | 'night'
    const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
    const [currentPageInChapter, setCurrentPageInChapter] = useState(0);
    const [readingLayout, setReadingLayout] = useState('paginated'); // 'paginated' | 'scroll'
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
        return [
            {
                number: 1,
                title: 'Overview and Introduction',
                subtitle: 'Smart Library Digital Edition',
                content: activeBook.description || `Welcome to the digital reading stream for "${activeBook.title || 'this book'}".\n\nEnjoy lifetime reading access via the Smart Library Management System.`,
            }
        ];
    }, [activeBook]);

    // Handle Blob creation for base64 PDF data URIs
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

        if (chapters.length > 0) {
            setViewMode('reader');
        } else if (fileUrl && (fileUrl.startsWith('http') || fileUrl.includes('archive.org'))) {
            setViewMode('embed');
        } else {
            setViewMode('reader');
        }

        setCurrentChapterIndex(0);
        setCurrentPageInChapter(0);

        return () => {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [activeBook, chapters]);

    const title = activeBook?.title || 'Digital E-Book';
    const author = activeBook?.author || 'Library Catalog';
    const totalChapters = chapters.length;
    const currentChapter = chapters[currentChapterIndex] || chapters[0];
    const rawFileUrl = activeBook?.file_url || activeBook?.file_path;
    const isExternalEmbed = rawFileUrl && typeof rawFileUrl === 'string' && (rawFileUrl.startsWith('http://') || rawFileUrl.startsWith('https://'));

    // Pagination algorithm: chunk current chapter content into standard pages (~350 words / ~2000 chars)
    const chapterPages = useMemo(() => {
        const rawContent = currentChapter?.content || '';
        if (!rawContent.trim()) return [''];

        const paragraphs = rawContent.split('\n\n');
        const pages = [];
        let currentPageParagraphs = [];
        let currentLength = 0;

        for (const para of paragraphs) {
            const paraLen = para.length;
            if (currentLength + paraLen > 2200 && currentPageParagraphs.length > 0) {
                pages.push(currentPageParagraphs.join('\n\n'));
                currentPageParagraphs = [para];
                currentLength = paraLen;
            } else {
                currentPageParagraphs.push(para);
                currentLength += paraLen + 2;
            }
        }

        if (currentPageParagraphs.length > 0) {
            pages.push(currentPageParagraphs.join('\n\n'));
        }

        return pages.length > 0 ? pages : [rawContent];
    }, [currentChapter]);

    // Calculate total estimated book pages and starting page for each chapter
    const { chapterStartingPages, totalBookPages } = useMemo(() => {
        const startingPages = [];
        let runningPages = 1;

        for (let i = 0; i < chapters.length; i++) {
            startingPages.push(runningPages);
            const textLen = (chapters[i]?.content || '').length;
            const estimatedPages = Math.max(1, Math.ceil(textLen / 2200));
            runningPages += estimatedPages;
        }

        return {
            chapterStartingPages: startingPages,
            totalBookPages: Math.max(1, runningPages - 1),
        };
    }, [chapters]);

    const currentGlobalPage = Math.min(
        totalBookPages,
        (chapterStartingPages[currentChapterIndex] || 1) + currentPageInChapter
    );
    const readingProgressPercent = totalBookPages > 0
        ? Math.min(100, Math.round((currentGlobalPage / totalBookPages) * 100))
        : 100;

    // Navigation callbacks
    const handleNextPage = useCallback(() => {
        if (currentPageInChapter < chapterPages.length - 1) {
            setCurrentPageInChapter(prev => prev + 1);
        } else if (currentChapterIndex < chapters.length - 1) {
            setCurrentChapterIndex(prev => prev + 1);
            setCurrentPageInChapter(0);
        }
    }, [currentPageInChapter, chapterPages.length, currentChapterIndex, chapters.length]);

    const handlePrevPage = useCallback(() => {
        if (currentPageInChapter > 0) {
            setCurrentPageInChapter(prev => prev - 1);
        } else if (currentChapterIndex > 0) {
            const prevIndex = currentChapterIndex - 1;
            const prevText = chapters[prevIndex]?.content || '';
            const prevEstPages = Math.max(1, Math.ceil(prevText.length / 2200));
            setCurrentChapterIndex(prevIndex);
            setCurrentPageInChapter(Math.max(0, prevEstPages - 1));
        }
    }, [currentPageInChapter, currentChapterIndex, chapters]);

    const handleNextChapter = useCallback(() => {
        if (currentChapterIndex < chapters.length - 1) {
            setCurrentChapterIndex(prev => prev + 1);
            setCurrentPageInChapter(0);
        }
    }, [currentChapterIndex, chapters.length]);

    const handlePrevChapter = useCallback(() => {
        if (currentChapterIndex > 0) {
            setCurrentChapterIndex(prev => prev - 1);
            setCurrentPageInChapter(0);
        }
    }, [currentChapterIndex]);

    // Keyboard arrow listener for smooth reading
    useEffect(() => {
        if (!isOpenState || viewMode !== 'reader') return;

        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                handleNextPage();
            } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                handlePrevPage();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpenState, viewMode, handleNextPage, handlePrevPage]);

    // Scroll Observer: track visible page sheet in scroll reading layout
    useEffect(() => {
        if (!isOpenState || viewMode !== 'reader' || readingLayout !== 'scroll') return;

        const container = scrollContainerRef.current;
        if (!container) return;

        const pageCards = container.querySelectorAll('.reader-page-card');
        if (!pageCards || pageCards.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const pageIdx = Number(entry.target.getAttribute('data-page-index'));
                        if (!isNaN(pageIdx)) {
                            setCurrentPageInChapter(pageIdx);
                        }
                    }
                });
            },
            {
                root: container,
                rootMargin: '-15% 0px -65% 0px',
                threshold: 0,
            }
        );

        pageCards.forEach(card => observer.observe(card));
        return () => observer.disconnect();
    }, [isOpenState, viewMode, readingLayout, currentChapterIndex, chapterPages.length]);

    if (!isOpenState || !activeBook) return null;

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

    // Filter text if search query exists
    const activeText = readingLayout === 'paginated'
        ? (chapterPages[currentPageInChapter] || '')
        : (currentChapter?.content || '');

    const paragraphsToRender = activeText.split('\n\n').filter(p => {
        if (!searchQuery.trim()) return true;
        return p.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const renderParagraph = (para, pIdx) => {
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
    };

    return (
        <Modal
            open={isOpenState}
            onClose={onClose}
            title={title}
            subtitle={`By ${author} · Verified Digital Reader (${totalBookPages} Total Pages)`}
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
                                <span>Book Reader</span>
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

                        {/* Page Navigation Controls in Reader Mode */}
                        {viewMode === 'reader' && (
                            <div className="flex items-center gap-1.5 bg-paper border border-bark-100 rounded-xl px-2 py-1 shadow-sm">
                                <button
                                    type="button"
                                    onClick={handlePrevPage}
                                    disabled={currentChapterIndex === 0 && currentPageInChapter === 0}
                                    className="p-1.5 rounded-lg text-bark-700 hover:bg-cream disabled:opacity-30 transition"
                                    title="Previous Page (Left Arrow)"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                <span className="font-mono text-xs font-bold text-bark-900 px-2 min-w-28 text-center">
                                    Page {currentGlobalPage} of {totalBookPages}
                                </span>

                                <button
                                    type="button"
                                    onClick={handleNextPage}
                                    disabled={currentChapterIndex >= totalChapters - 1 && currentPageInChapter >= chapterPages.length - 1}
                                    className="p-1.5 rounded-lg text-bark-700 hover:bg-cream disabled:opacity-30 transition"
                                    title="Next Page (Right Arrow)"
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
                                <span>Open Theater Scan</span>
                            </a>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-3">
                {/* Control Ribbon: Table of Contents, Layout Mode, Search, Themes, Typography */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border border-bark-100 bg-cream-light/40">
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowToc(!showToc)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition ${
                                showToc ? 'bg-bark-700 text-cream-light border-bark-700' : 'bg-paper text-bark-800 border-bark-100 hover:bg-cream'
                            }`}
                        >
                            <List className="w-3.5 h-3.5" />
                            <span>Contents ({totalChapters} Ch.)</span>
                        </button>

                        {/* Top-Bar Chapter Navigation Alongside Toggles */}
                        <div className="flex items-center rounded-lg border border-bark-100 bg-paper p-0.5 text-xs shadow-sm">
                            <button
                                type="button"
                                onClick={handlePrevChapter}
                                disabled={currentChapterIndex === 0}
                                className="px-2 py-1 rounded-md text-bark-700 hover:bg-cream disabled:opacity-30 transition flex items-center gap-0.5"
                                title="Previous Chapter"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline font-semibold">Prev Ch</span>
                            </button>

                            <select
                                value={currentChapterIndex}
                                onChange={(e) => {
                                    setCurrentChapterIndex(Number(e.target.value));
                                    setCurrentPageInChapter(0);
                                }}
                                className="bg-transparent text-bark-900 font-bold text-xs px-1.5 py-1 focus:outline-none cursor-pointer max-w-[120px] sm:max-w-[170px] truncate"
                                title="Jump to Chapter"
                            >
                                {chapters.map((ch, idx) => (
                                    <option key={ch.number || idx} value={idx}>
                                        Ch. {ch.number || idx + 1}: {ch.title || `Chapter ${idx + 1}`}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleNextChapter}
                                disabled={currentChapterIndex >= totalChapters - 1}
                                className="px-2 py-1 rounded-md text-bark-700 hover:bg-cream disabled:opacity-30 transition flex items-center gap-0.5"
                                title="Next Chapter"
                            >
                                <span className="hidden sm:inline font-semibold">Next Ch</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Layout Mode (Paginated vs Scroll) */}
                        <div className="flex items-center rounded-lg border border-bark-100 bg-paper p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => setReadingLayout('paginated')}
                                className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold ${readingLayout === 'paginated' ? 'bg-bark-700 text-cream-light' : 'text-bark-600 hover:text-bark-900'}`}
                                title="Page Flip Mode"
                            >
                                <Columns className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Flip Pages</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setReadingLayout('scroll')}
                                className={`px-2 py-1 rounded-md flex items-center gap-1 font-semibold ${readingLayout === 'scroll' ? 'bg-bark-700 text-cream-light' : 'text-bark-600 hover:text-bark-900'}`}
                                title="Continuous Scroll Mode"
                            >
                                <AlignJustify className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Scroll</span>
                            </button>
                        </div>

                        {/* In-Book Search */}
                        <div className="relative">
                            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-bark-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search in book..."
                                className="pl-7 pr-6 py-1 rounded-lg border border-bark-100 bg-paper text-xs text-bark-900 placeholder:text-bark-400 w-28 sm:w-36 focus:outline-none focus:border-bark-300"
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

                    {/* Reading Preferences (Theme, Font Style, Font Size) */}
                    <div className="flex items-center gap-3">
                        {/* Themes */}
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
                                onClick={() => setFontSize(s => Math.min(28, s + 1))}
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
                        <span>VERIFIED LIFETIME DIGITAL ACCESS</span>
                    </div>
                    <span>
                        BOOK PAGE {currentGlobalPage} OF {totalBookPages} · CH. {currentChapterIndex + 1} (PG {currentPageInChapter + 1}/{chapterPages.length}) · {readingProgressPercent}% READ
                    </span>
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
                        <div className="absolute inset-y-0 left-0 w-80 bg-paper border-r border-bark-200 z-20 shadow-2xl p-4 overflow-y-auto animate-in slide-in-from-left duration-200">
                            <div className="flex items-center justify-between pb-3 border-b border-bark-100 mb-3">
                                <div>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-bark-900 flex items-center gap-1.5">
                                        <List className="w-3.5 h-3.5 text-tan-dark" /> Table of Contents
                                    </h3>
                                    <p className="text-[10px] text-bark-500">{totalChapters} Chapters · {totalBookPages} Pages</p>
                                </div>
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
                                            setCurrentPageInChapter(0);
                                            setShowToc(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-xs transition flex items-center justify-between ${
                                            currentChapterIndex === idx
                                                ? 'bg-bark-700 text-cream-light font-bold shadow-sm'
                                                : 'text-bark-700 hover:bg-cream-light/60'
                                        }`}
                                    >
                                        <div className="truncate pr-2">
                                            <div className="font-mono text-[9px] opacity-75">Chapter {ch.number || idx + 1}</div>
                                            <div className="truncate">{ch.title || `Chapter ${idx + 1}`}</div>
                                        </div>
                                        <span className="font-mono text-[10px] opacity-60 flex-shrink-0">
                                            p. {chapterStartingPages[idx] || 1}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* View Mode: Native Chapter Reader (Primary) */}
                    {viewMode === 'reader' && (
                        <div 
                            ref={scrollContainerRef}
                            className={`p-6 sm:p-10 max-h-[640px] overflow-y-auto transition-colors duration-200 ${currentTheme.container} ${
                                fontFamily === 'serif' ? 'font-serif' : 'font-sans'
                            }`}
                            style={{ fontSize: `${fontSize}px` }}
                        >
                            {/* Chapter Header (Shown on Page 1 or in Scroll Mode) */}
                            {(currentPageInChapter === 0 || readingLayout === 'scroll') && (
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
                            )}

                            {searchQuery && (
                                <div className="max-w-3xl mx-auto p-3 rounded-xl bg-tan-light/40 border border-bark-100 font-sans text-xs text-bark-800 mb-6 flex items-center justify-between">
                                    <span>Showing search matches for <strong>"{searchQuery}"</strong></span>
                                    <button onClick={() => setSearchQuery('')} className="underline text-tan-dark font-bold">Clear Search</button>
                                </div>
                            )}

                            {readingLayout === 'scroll' ? (
                                /* Continuous Scroll Mode with DISTINCT Physical Page Cards/Sheets */
                                <div className="max-w-3xl mx-auto space-y-10 my-4">
                                    {chapterPages.map((pageContent, pageIdx) => {
                                        const pageParagraphs = pageContent.split('\n\n').filter(p => {
                                            if (!searchQuery.trim()) return true;
                                            return p.toLowerCase().includes(searchQuery.toLowerCase());
                                        });

                                        if (searchQuery && pageParagraphs.length === 0) return null;

                                        const pageGlobalNum = (chapterStartingPages[currentChapterIndex] || 1) + pageIdx;

                                        return (
                                            <div
                                                key={pageIdx}
                                                id={`reader-page-sheet-${pageIdx}`}
                                                data-page-index={pageIdx}
                                                className={`reader-page-card relative p-8 sm:p-12 rounded-2xl border ${currentTheme.border} ${
                                                    theme === 'night'
                                                        ? 'bg-zinc-950/80 shadow-2xl shadow-black/50 ring-1 ring-white/5'
                                                        : theme === 'sepia'
                                                        ? 'bg-[#FAF4E8] shadow-md shadow-[#433422]/5 ring-1 ring-[#E4D5BE]/60'
                                                        : 'bg-white shadow-md shadow-zinc-200/80 ring-1 ring-zinc-200/60'
                                                } transition-all duration-200`}
                                            >
                                                {/* Distinct Page Top Running Header */}
                                                <div className={`flex items-center justify-between pb-4 mb-6 border-b ${currentTheme.chapterHeader} text-[11px] font-mono select-none opacity-85`}>
                                                    <div className="flex items-center gap-2 truncate pr-4">
                                                        <span className="font-bold uppercase tracking-wider text-tan-dark">
                                                            {title}
                                                        </span>
                                                        <span className="opacity-40">·</span>
                                                        <span className="truncate opacity-75">
                                                            Ch. {currentChapter?.number || currentChapterIndex + 1}: {currentChapter?.title || `Chapter ${currentChapterIndex + 1}`}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${currentTheme.accent}`}>
                                                            Page {pageIdx + 1} of {chapterPages.length}
                                                        </span>
                                                        <span className="opacity-60 text-[10px]">
                                                            (Book Pg {pageGlobalNum})
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Distinct Page Content Body */}
                                                <div className="space-y-6 leading-relaxed min-h-[240px]">
                                                    {pageParagraphs.map((para, pIdx) => renderParagraph(para, pIdx))}
                                                </div>

                                                {/* Distinct Page Bottom Running Footer */}
                                                <div className={`mt-8 pt-4 border-t ${currentTheme.border} flex items-center justify-between text-[11px] font-mono select-none ${currentTheme.subtext}`}>
                                                    <span className="text-[10px] uppercase tracking-wider opacity-75">
                                                        Chapter {currentChapterIndex + 1}
                                                    </span>
                                                    <span className="font-bold text-xs tracking-widest text-tan-dark">
                                                        — Page {pageIdx + 1} of {chapterPages.length} —
                                                    </span>
                                                    <span className="text-[10px] opacity-75">
                                                        Book Page {pageGlobalNum} of {totalBookPages}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Single Page Paginated Mode */
                                <div className="max-w-3xl mx-auto space-y-6 leading-relaxed min-h-[380px]">
                                    {paragraphsToRender.map((para, pIdx) => renderParagraph(para, pIdx))}
                                </div>
                            )}

                            {/* Chapter Bottom Navigation Footer */}
                            <div className={`mt-10 pt-6 border-t ${currentTheme.chapterHeader} flex items-center justify-between font-sans text-xs`}>
                                <button
                                    type="button"
                                    onClick={readingLayout === 'scroll' ? handlePrevChapter : handlePrevPage}
                                    disabled={currentChapterIndex === 0 && (readingLayout === 'scroll' || currentPageInChapter === 0)}
                                    className={`px-4 py-2 rounded-xl border ${currentTheme.border} ${currentTheme.accent} font-bold flex items-center gap-1.5 disabled:opacity-30`}
                                >
                                    <ChevronLeft className="w-4 h-4" /> Previous {readingLayout === 'scroll' ? 'Chapter' : 'Page'}
                                </button>

                                <span className={`font-mono text-center ${currentTheme.subtext}`}>
                                    {readingLayout === 'scroll'
                                        ? `Chapter ${currentChapterIndex + 1} of ${totalChapters} (${chapterPages.length} Pages)`
                                        : `Page ${currentGlobalPage} of ${totalBookPages} · Ch. ${currentChapterIndex + 1}`}
                                </span>

                                <button
                                    type="button"
                                    onClick={readingLayout === 'scroll' ? handleNextChapter : handleNextPage}
                                    disabled={currentChapterIndex >= totalChapters - 1 && (readingLayout === 'scroll' || currentPageInChapter >= chapterPages.length - 1)}
                                    className={`px-4 py-2 rounded-xl border ${currentTheme.border} ${currentTheme.accent} font-bold flex items-center gap-1.5 disabled:opacity-30`}
                                >
                                    Next {readingLayout === 'scroll' ? 'Chapter' : 'Page'} <ChevronRight className="w-4 h-4" />
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
