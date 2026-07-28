import React, { useState, useEffect } from 'react';
import { 
    Database, Table, Plus, Edit2, Trash2, Search, X, Loader2, AlertCircle, CheckCircle2, 
    Users, Shield, BookOpen, Layers, BookCheck, Clock, CreditCard, Sparkles, ShoppingBag,
    ChevronLeft, ChevronRight, Menu, Activity, UserPlus, ShieldAlert, ShieldCheck, UserCheck, TrendingUp
} from 'lucide-react';
import { api, getFrontendTerminalLogs } from '../services/api';

export default function AdminDashboard() {
    // Navigation & View State: 'overview' | 'logs' | 'users' | 'members' | 'librarians' | table_name
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Analytics Landing Overview State
    const [analytics, setAnalytics] = useState(null);
    const [activityGraphType, setActivityGraphType] = useState('loaned'); // 'loaned' | 'reserved' | 'bought'
    const [analyticsLoading, setAnalyticsLoading] = useState(true);

    // API Logs & Health State
    const [logsMiniTab, setLogsMiniTab] = useState('backend_terminal'); // 'backend_terminal' | 'frontend_terminal' | 'split_terminal' | 'health'
    const [apiLogsData, setApiLogsData] = useState(null);
    const [frontendLogs, setFrontendLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    // Domain Tables State
    const [tables] = useState([
        'users', 'members', 'librarians', 'books', 'book_copies', 
        'loans', 'reservations', 'fines', 'subscriptions', 'digital_purchases'
    ]);
    const [columns, setColumns] = useState([]);
    const [records, setRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Modal State for General CRUD
    const [modal, setModal] = useState({ type: null, record: null });
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Ban Modal State for Members
    const [banModal, setBanModal] = useState({ isOpen: false, member: null });
    const [banReasonSelect, setBanReasonSelect] = useState('Overdue Fines Unpaid');
    const [customBanReason, setCustomBanReason] = useState('');
    const [banLoading, setBanLoading] = useState(false);

    // Add Librarian Form State
    const [libForm, setLibForm] = useState({ name: '', email: '', password: '', department: 'General Circulation' });
    const [libSubmitting, setLibSubmitting] = useState(false);

    // Fetch Analytics on mount
    const fetchAnalytics = async () => {
        setAnalyticsLoading(true);
        try {
            const res = await api.getAdminAnalytics();
            setAnalytics(res.data || res || {});
        } catch (err) {
            console.error('Failed to load analytics:', err);
        } finally {
            setAnalyticsLoading(false);
        }
    };

    // Fetch API Logs & Endpoint Health Data
    const fetchApiLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await api.getAdminApiLogs();
            setApiLogsData(res || {});
            setFrontendLogs(getFrontendTerminalLogs());
        } catch (err) {
            console.error('Failed to load API logs:', err);
        } finally {
            setLogsLoading(false);
        }
    };

    // Fetch Table Data when activeTab changes (if a domain table)
    const fetchTableData = async (tableName) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getAdminTableData(tableName);
            
            let rawColumns = res.columns || [];
            if (tableName === 'users') {
                rawColumns = rawColumns.filter(c => c !== 'password');
            }
            setColumns(rawColumns);
            setRecords(res.data || []);
        } catch (err) {
            console.error(`Failed to load data for ${tableName}:`, err);
            setError(err.message || `Failed to fetch data for ${tableName}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    useEffect(() => {
        if (activeTab === 'logs') {
            fetchApiLogs();
        } else if (activeTab !== 'overview') {
            const targetTable = activeTab === 'users' ? 'users' : activeTab === 'members' ? 'members' : activeTab === 'librarians' ? 'librarians' : activeTab;
            fetchTableData(targetTable);
        }
    }, [activeTab]);

    // Handle General CRUD Form Field Change
    const handleFieldChange = (col, val) => {
        setFormData(prev => ({ ...prev, [col]: val }));
    };

    // Open Create Modal
    const handleOpenCreate = () => {
        const initialForm = {};
        columns.forEach(col => {
            if (col !== 'id' && col !== 'created_at' && col !== 'updated_at') {
                initialForm[col] = '';
            }
        });
        // Include password field on user creation form
        if (activeTab === 'users' || activeTab === 'overview') {
            initialForm['password'] = '';
        }
        setFormData(initialForm);
        setModal({ type: 'create', record: null });
    };

    // Open Edit Modal
    const handleOpenEdit = (record) => {
        const initialForm = {};
        columns.forEach(col => {
            if (col !== 'id' && col !== 'created_at' && col !== 'updated_at') {
                initialForm[col] = record[col] ?? '';
            }
        });
        setFormData(initialForm);
        setModal({ type: 'edit', record });
    };

    // Submit Create or Update
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        const targetTable = activeTab === 'overview' ? 'users' : activeTab;

        try {
            if (modal.type === 'create') {
                await api.createAdminRecord(targetTable, formData);
                setSuccessMsg(`Record created in ${targetTable} successfully.`);
            } else if (modal.type === 'edit') {
                await api.updateAdminRecord(targetTable, modal.record.id, formData);
                setSuccessMsg(`Record #${modal.record.id} in ${targetTable} updated successfully.`);
            }
            setModal({ type: null, record: null });
            fetchTableData(targetTable);
        } catch (err) {
            setError(err.message || 'Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete Record
    const handleDelete = async (id) => {
        const targetTable = activeTab === 'overview' ? 'users' : activeTab;
        if (!window.confirm(`Are you sure you want to delete record #${id} from ${targetTable}?`)) {
            return;
        }
        setError(null);
        setSuccessMsg(null);
        try {
            await api.deleteAdminRecord(targetTable, id);
            setSuccessMsg(`Record #${id} deleted from ${targetTable}.`);
            fetchTableData(targetTable);
        } catch (err) {
            setError(err.message || 'Delete operation failed.');
        }
    };

    // Task 4: Submit Member Ban / Unban
    const handleToggleBan = async (e) => {
        e.preventDefault();
        if (!banModal.member) return;
        setBanLoading(true);
        setError(null);
        setSuccessMsg(null);

        const finalReason = banReasonSelect === 'Custom Reason' ? customBanReason : banReasonSelect;
        const newBanStatus = !banModal.member.is_banned;

        try {
            await api.banAdminMember(banModal.member.id, newBanStatus, finalReason);
            setSuccessMsg(`Member #${banModal.member.id} (${banModal.member.member_number}) status updated.`);
            setBanModal({ isOpen: false, member: null });
            fetchTableData('members');
        } catch (err) {
            setError(err.message || 'Member ban operation failed.');
        } finally {
            setBanLoading(false);
        }
    };

    // Task 5: Add New Librarian
    const handleAddLibrarian = async (e) => {
        e.preventDefault();
        setLibSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            await api.createAdminLibrarian(libForm);
            setSuccessMsg(`Librarian staff account "${libForm.name}" registered successfully.`);
            setLibForm({ name: '', email: '', password: '', department: 'General Circulation' });
            fetchTableData('librarians');
        } catch (err) {
            setError(err.message || 'Failed to register librarian.');
        } finally {
            setLibSubmitting(false);
        }
    };

    // Filter records by search query
    const filteredRecords = records.filter(row => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return Object.values(row).some(val => 
            String(val ?? '').toLowerCase().includes(query)
        );
    });

    // Determine current graph dataset based on activityGraphType toggle
    const getActivityGraphData = () => {
        if (!analytics) return [];
        if (activityGraphType === 'loaned') return analytics.loaned_over_time || [];
        if (activityGraphType === 'reserved') return analytics.reserved_over_time || [];
        return analytics.bought_over_time || [];
    };

    // Render clean Bar Chart with crisp white bars against black background with dynamic axis scaling
    const renderSvgChart = (dataArr, label) => {
        if (!dataArr || dataArr.length === 0) return null;
        // Dynamically scale maxVal based on actual data range without artificial minimum limits
        const maxVal = Math.max(...dataArr.map(d => d.count), 1);
        const minVal = Math.min(...dataArr.map(d => d.count));
        
        return (
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-gray-600">
                    <span className="font-semibold text-gray-700">{label}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded font-mono">
                        Range: {minVal} - {maxVal} events/day
                    </span>
                </div>
                <div className="h-48 w-full bg-black border border-gray-200 rounded-xl p-4 flex items-end justify-between gap-2 shadow-inner">
                    {dataArr.map((d, i) => {
                        const heightPct = Math.round((d.count / maxVal) * 100);
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                                <div className="text-[9px] font-mono text-white bg-gray-50 border border-gray-300 px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 z-10 shadow-lg pointer-events-none">
                                    {d.count}
                                </div>
                                <div 
                                    style={{ height: `${Math.max(heightPct, 6)}%` }} 
                                    className="w-full bg-white hover:bg-zinc-200 rounded-t-sm transition-all shadow-[0_0_12px_rgba(255,255,255,0.4)] group-hover:shadow-[0_0_16px_rgba(255,255,255,0.8)]"
                                />
                                <span className="text-[9px] font-mono text-gray-600 truncate w-full text-center mt-1.5 group-hover:text-white transition-colors">
                                    {d.date.slice(5)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Header */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sm:p-8 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                    </button>
                    <div>
                        <span className="px-2.5 py-0.5 rounded text-[9px] font-mono font-bold bg-gray-200 text-gray-700 border border-gray-300 uppercase tracking-wider">
                            ADMIN CONSOLE
                        </span>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-1">
                            System Administration & Management Portal
                        </h1>
                    </div>
                </div>
            </div>

            {/* Notifications */}
            {successMsg && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-zinc-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-gray-600" /> {successMsg}
                    </div>
                    <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4 text-gray-600" /></button>
                </div>
            )}

            {error && (
                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-zinc-200 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-gray-600" /> {error}
                    </div>
                    <button onClick={() => setError(null)}><X className="w-4 h-4 text-gray-600" /></button>
                </div>
            )}

            {/* Main Layout: Collapsible Sidebar + Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Task 2: Collapsible Mini Sidebar */}
                <div className={`${isSidebarCollapsed ? 'lg:col-span-1' : 'lg:col-span-3'} bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2 h-fit shadow-sm transition-all`}>
                    <div className="flex items-center justify-between px-2 py-1">
                        {!isSidebarCollapsed && (
                            <h3 className="text-[10px] font-mono font-extrabold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                <Database className="w-3.5 h-3.5 text-gray-600" /> Navigation
                            </h3>
                        )}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-1 rounded text-gray-500 hover:text-zinc-200"
                        >
                            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4 mx-auto" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>

                    <div className="space-y-1">
                        {/* Landing Overview Button */}
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                activeTab === 'overview'
                                    ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                    : 'text-gray-600 hover:text-zinc-200 hover:bg-gray-200/60'
                            }`}
                            title="Analytics Overview"
                        >
                            <div className="flex items-center gap-2.5">
                                <Activity className="w-4 h-4 text-gray-600" />
                                {!isSidebarCollapsed && <span>Landing Overview</span>}
                            </div>
                        </button>

                        {/* Logs Section Header & Button */}
                        <div className="pt-3 pb-1">
                            {!isSidebarCollapsed && (
                                <h4 className="px-2 text-[9px] font-mono font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    SYSTEM LOGS
                                </h4>
                            )}
                            <button
                                onClick={() => setActiveTab('logs')}
                                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                    activeTab === 'logs'
                                        ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                        : 'text-gray-600 hover:text-zinc-200 hover:bg-gray-200/60'
                                }`}
                                title="API Logs & Health"
                            >
                                <div className="flex items-center gap-2.5">
                                    <Clock className="w-4 h-4 text-gray-600" />
                                    {!isSidebarCollapsed && <span>API Logs & Health</span>}
                                </div>
                            </button>
                        </div>

                        {/* Collections Section Header & Domain Tables */}
                        <div className="pt-2 pb-1">
                            {!isSidebarCollapsed && (
                                <h4 className="px-2 text-[9px] font-mono font-extrabold text-gray-500 uppercase tracking-wider mb-1">
                                    COLLECTIONS
                                </h4>
                            )}
                            {tables.map(tName => (
                                <button
                                    key={tName}
                                    onClick={() => setActiveTab(tName)}
                                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        activeTab === tName
                                            ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm'
                                            : 'text-gray-600 hover:text-zinc-200 hover:bg-gray-200/60'
                                    }`}
                                    title={tName.replace('_', ' ')}
                                >
                                    <div className="flex items-center gap-2.5 capitalize">
                                        <Table className="w-4 h-4 text-gray-600" />
                                        {!isSidebarCollapsed && <span>{tName.replace('_', ' ')}</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Panel */}
                <div className={`${isSidebarCollapsed ? 'lg:col-span-11' : 'lg:col-span-9'} space-y-6 transition-all`}>
                    
                    {/* Task 1: Admin Landing Page Overview */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            
                            {/* Counter Card */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span className="text-xs font-mono font-semibold uppercase">Registered Members</span>
                                        <Users className="w-4 h-4 text-gray-600" />
                                    </div>
                                    <span className="text-3xl font-extrabold text-gray-900 block">
                                        {analyticsLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (analytics?.registered_members_count ?? 0)}
                                    </span>
                                    <span className="text-[10px] text-gray-500 font-mono">Active member profiles</span>
                                </div>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                {/* Graph 1: Logged In Users Over Time */}
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 font-mono">
                                            <TrendingUp className="w-4 h-4 text-gray-600" /> Logged In Users Over Time
                                        </h3>
                                    </div>

                                    {analyticsLoading ? (
                                        <div className="flex items-center justify-center h-44 text-gray-500 font-mono text-xs">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading timeline data...
                                        </div>
                                    ) : (
                                        renderSvgChart(analytics?.logins_over_time, "Daily User Login Sessions")
                                    )}
                                </div>

                                {/* Graph 2: Books Activity Over Time with Toggle */}
                                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 font-mono">
                                            <Activity className="w-4 h-4 text-gray-600" /> Book Activity Over Time
                                        </h3>

                                        {/* Toggle Switch */}
                                        <div className="flex bg-white p-1 rounded-lg border border-gray-200 text-[10px] font-mono font-bold">
                                            {['loaned', 'reserved', 'bought'].map((type) => (
                                                <button
                                                    key={type}
                                                    onClick={() => setActivityGraphType(type)}
                                                    className={`px-2.5 py-1 rounded capitalize transition-all ${
                                                        activityGraphType === type ? 'bg-zinc-100 text-zinc-950 shadow-sm' : 'text-gray-600 hover:text-zinc-200'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {analyticsLoading ? (
                                        <div className="flex items-center justify-center h-44 text-gray-500 font-mono text-xs">
                                            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading activity data...
                                        </div>
                                    ) : (
                                        renderSvgChart(getActivityGraphData(), `Daily ${activityGraphType.toUpperCase()} Book Activity`)
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Task 2: API Logs & Terminal Activity Page */}
                    {activeTab === 'logs' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                            
                            {/* Header & Mini Navbar */}
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2 font-mono">
                                        <Activity className="w-4 h-4 text-emerald-400" /> Terminal Activity & API Logs Stream
                                    </h2>
                                    <p className="text-xs text-gray-600 mt-0.5">Real-time live logs from php artisan serve (backend) & npm run dev (frontend) processes</p>
                                </div>

                                {/* Mini Navbar */}
                                <div className="flex flex-wrap bg-white p-1 rounded-xl border border-gray-200 text-xs font-mono font-semibold">
                                    <button
                                        onClick={() => setLogsMiniTab('backend_terminal')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            logsMiniTab === 'backend_terminal' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-gray-600 hover:text-zinc-200'
                                        }`}
                                    >
                                        Backend Terminal
                                    </button>
                                    <button
                                        onClick={() => setLogsMiniTab('frontend_terminal')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            logsMiniTab === 'frontend_terminal' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-gray-600 hover:text-zinc-200'
                                        }`}
                                    >
                                        Frontend Terminal
                                    </button>
                                    <button
                                        onClick={() => setLogsMiniTab('split_terminal')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            logsMiniTab === 'split_terminal' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-gray-600 hover:text-zinc-200'
                                        }`}
                                    >
                                        Split Dual View
                                    </button>
                                    <button
                                        onClick={() => setLogsMiniTab('health')}
                                        className={`px-3 py-1.5 rounded-lg transition-all ${
                                            logsMiniTab === 'health' ? 'bg-zinc-100 text-zinc-950 font-bold shadow-sm' : 'text-gray-600 hover:text-zinc-200'
                                        }`}
                                    >
                                        Health Matrix
                                    </button>
                                </div>
                            </div>

                            {logsLoading ? (
                                <div className="flex items-center justify-center py-12 text-gray-600 text-xs font-mono">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Fetching live terminal stream...
                                </div>
                            ) : (
                                <>
                                    {/* 1. Backend Terminal Log Stream View */}
                                    {logsMiniTab === 'backend_terminal' && (
                                        <div className="space-y-3 font-mono">
                                            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="font-bold text-zinc-200">Terminal Process: php artisan serve</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                    <span>CWD: backend/</span>
                                                    <span>PORT: 8000</span>
                                                    <button onClick={() => fetchApiLogs()} className="hover:text-zinc-200 text-gray-600 underline">Refresh Log Stream</button>
                                                </div>
                                            </div>

                                            <div className="bg-black border border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-700 space-y-1.5 max-h-[500px] overflow-y-auto shadow-inner select-text">
                                                <div className="text-emerald-400 font-bold mb-2">
                                                    kimushzyyy@smartlib:~/backend$ php artisan serve --host=127.0.0.1 --port=8000
                                                </div>
                                                {apiLogsData?.backend_terminal_logs?.map((line, idx) => (
                                                    <div key={idx} className="leading-relaxed hover:bg-gray-50/60 px-1 py-0.5 rounded transition-colors">
                                                        <span className="text-gray-500 mr-2">[{idx + 1}]</span>
                                                        <span className={line.includes('ERROR') ? 'text-red-400' : line.includes('HTTP 200') ? 'text-emerald-400' : 'text-gray-700'}>
                                                            {line}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. Frontend Terminal Log Stream View */}
                                    {logsMiniTab === 'frontend_terminal' && (
                                        <div className="space-y-3 font-mono">
                                            <div className="flex items-center justify-between text-xs text-gray-600 px-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                                                    <span className="font-bold text-zinc-200">Terminal Process: npm run dev (Vite)</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                                                    <span>CWD: frontend/</span>
                                                    <span>PORT: 5173</span>
                                                    <button onClick={() => fetchApiLogs()} className="hover:text-zinc-200 text-gray-600 underline">Refresh Stream</button>
                                                </div>
                                            </div>

                                            <div className="bg-black border border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-700 space-y-1.5 max-h-[500px] overflow-y-auto shadow-inner select-text">
                                                <div className="text-cyan-400 font-bold mb-2">
                                                    kimushzyyy@smartlib:~/frontend$ npm run dev
                                                </div>
                                                {frontendLogs.map((line, idx) => (
                                                    <div key={idx} className="leading-relaxed hover:bg-gray-50/60 px-1 py-0.5 rounded transition-colors">
                                                        <span className="text-gray-500 mr-2">[{idx + 1}]</span>
                                                        <span className={line.includes('ERROR') ? 'text-red-400' : line.includes('RESPONSE') ? 'text-emerald-400' : line.includes('vite') ? 'text-cyan-300' : 'text-gray-700'}>
                                                            {line}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. Split Dual Terminal View */}
                                    {logsMiniTab === 'split_terminal' && (
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 font-mono">
                                            {/* Backend Screen */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-gray-600">
                                                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Backend (php artisan serve)
                                                    </span>
                                                </div>
                                                <div className="bg-black border border-gray-200 rounded-xl p-3 text-[11px] text-gray-700 space-y-1 max-h-[420px] overflow-y-auto shadow-inner">
                                                    <div className="text-emerald-400 font-bold mb-1">
                                                        $ php artisan serve
                                                    </div>
                                                    {apiLogsData?.backend_terminal_logs?.slice(-20).map((line, idx) => (
                                                        <div key={idx} className="truncate text-gray-700">
                                                            {line}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Frontend Screen */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-gray-600">
                                                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                                                        <span className="w-2 h-2 rounded-full bg-cyan-400" /> Frontend (npm run dev)
                                                    </span>
                                                </div>
                                                <div className="bg-black border border-gray-200 rounded-xl p-3 text-[11px] text-gray-700 space-y-1 max-h-[420px] overflow-y-auto shadow-inner">
                                                    <div className="text-cyan-400 font-bold mb-1">
                                                        $ npm run dev
                                                    </div>
                                                    {frontendLogs.slice(-20).map((line, idx) => (
                                                        <div key={idx} className="truncate text-gray-700">
                                                            {line}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Health Matrix */}
                                    {logsMiniTab === 'health' && (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-xs text-gray-600 font-mono">
                                                <span>Active Route Endpoints ({apiLogsData?.endpoints?.length || 0})</span>
                                                <span className="text-emerald-400 flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> 100% Operational
                                                </span>
                                            </div>

                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs text-gray-700 border-collapse">
                                                    <thead className="bg-white text-gray-600 uppercase text-[10px] tracking-wider font-mono">
                                                        <tr>
                                                            <th className="p-3 border-b border-gray-200">HTTP Method</th>
                                                            <th className="p-3 border-b border-gray-200">Endpoint Route</th>
                                                            <th className="p-3 border-b border-gray-200 text-center">Status</th>
                                                            <th className="p-3 border-b border-gray-200 text-center">Latency (ms)</th>
                                                            <th className="p-3 border-b border-gray-200 text-center">Uptime %</th>
                                                            <th className="p-3 border-b border-gray-200 text-right">Health Badge</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-800/60 font-mono">
                                                        {apiLogsData?.endpoints?.map((ep, idx) => (
                                                            <tr key={idx} className="hover:bg-white/50">
                                                                <td className="p-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                                                        ep.method === 'GET' ? 'bg-blue-950/80 text-blue-400 border border-blue-800' : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                                                    }`}>
                                                                        {ep.method}
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 font-bold text-gray-900">{ep.route}</td>
                                                                <td className="p-3 text-center">
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-gray-200 text-zinc-200 border border-gray-300">
                                                                        {ep.status} OK
                                                                    </span>
                                                                </td>
                                                                <td className="p-3 text-center text-gray-700">{ep.latency_ms} ms</td>
                                                                <td className="p-3 text-center text-gray-700">{ep.uptime}%</td>
                                                                <td className="p-3 text-right">
                                                                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
                                                                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> HEALTHY
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                    {activeTab === 'members' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-gray-600" /> Member Accounts & Ban Management
                                    </h2>
                                    <p className="text-xs text-gray-600 mt-0.5">Enforce suspension rules and reason tracking</p>
                                </div>

                                <div className="relative w-64">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Filter members..."
                                        className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-gray-900 focus:outline-none focus:border-gray-300 font-mono"
                                    />
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center py-12 text-gray-600 text-xs font-mono">
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading member directory...
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs text-gray-700 border-collapse">
                                        <thead className="bg-white text-gray-600 uppercase text-[10px] tracking-wider font-mono">
                                            <tr>
                                                <th className="p-3 border-b border-gray-200">Member #</th>
                                                <th className="p-3 border-b border-gray-200">Tier / Borrow Limit</th>
                                                <th className="p-3 border-b border-gray-200">Status</th>
                                                <th className="p-3 border-b border-gray-200">Ban Reason</th>
                                                <th className="p-3 border-b border-gray-200 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/60">
                                            {filteredRecords.map((m) => (
                                                <tr key={m.id} className="hover:bg-white/50">
                                                    <td className="p-3 font-mono font-bold text-zinc-200">{m.member_number}</td>
                                                    <td className="p-3">
                                                        <span className="capitalize font-semibold text-zinc-200">{m.membership_tier}</span>
                                                        <div className="text-[10px] text-gray-500 font-mono">Max: {m.borrow_limit}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        {m.is_banned ? (
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1 w-fit">
                                                                <ShieldAlert className="w-3 h-3" /> BANNED
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-zinc-100 text-zinc-950 flex items-center gap-1 w-fit">
                                                                <ShieldCheck className="w-3 h-3 text-zinc-950" /> ACTIVE
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-gray-600 text-xs italic">{m.ban_reason || 'None'}</td>
                                                    <td className="p-3 text-right">
                                                        <button
                                                            onClick={() => setBanModal({ isOpen: true, member: m })}
                                                            className={`py-1 px-3 rounded-lg text-xs font-bold font-mono transition-all border ${
                                                                m.is_banned
                                                                    ? 'bg-zinc-100 hover:bg-white text-zinc-950 border-zinc-100'
                                                                    : 'bg-gray-200 hover:bg-zinc-700 text-gray-700 border-gray-300'
                                                            }`}
                                                        >
                                                            {m.is_banned ? 'Lift Ban' : 'Ban Member'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Task 5: Dedicated Librarians Management View */}
                    {activeTab === 'librarians' && (
                        <div className="space-y-6">
                            {/* Add Librarian Form */}
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                <div className="flex items-center gap-2.5 border-b border-gray-200 pb-3">
                                    <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700">
                                        <UserPlus className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">Register New Librarian</h3>
                                        <p className="text-xs text-gray-600">Create staff credential account with librarian privileges</p>
                                    </div>
                                </div>

                                <form onSubmit={handleAddLibrarian} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Staff Full Name</label>
                                        <input
                                            type="text"
                                            value={libForm.name}
                                            onChange={(e) => setLibForm({ ...libForm, name: e.target.value })}
                                            placeholder="e.g. John Staff"
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Address</label>
                                        <input
                                            type="email"
                                            value={libForm.email}
                                            onChange={(e) => setLibForm({ ...libForm, email: e.target.value })}
                                            placeholder="librarian@maktababora.org"
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                                        <input
                                            type="password"
                                            value={libForm.password}
                                            onChange={(e) => setLibForm({ ...libForm, password: e.target.value })}
                                            placeholder="••••••••"
                                            required
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300 font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
                                        <input
                                            type="text"
                                            value={libForm.department}
                                            onChange={(e) => setLibForm({ ...libForm, department: e.target.value })}
                                            placeholder="General Circulation"
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300"
                                        />
                                    </div>

                                    <div className="sm:col-span-2 pt-1">
                                        <button
                                            type="submit"
                                            disabled={libSubmitting}
                                            className="py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                                        >
                                            {libSubmitting ? <Loader2 className="w-4 h-4 animate-spin text-zinc-950" /> : <UserPlus className="w-4 h-4" />}
                                            <span>Register Staff Librarian</span>
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Librarians List */}
                            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-gray-600" /> Active Librarians Directory
                                </h3>

                                {loading ? (
                                    <div className="flex items-center justify-center py-8 text-gray-600 text-xs font-mono">
                                        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading librarians...
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs text-gray-700 border-collapse">
                                            <thead className="bg-white text-gray-600 uppercase text-[10px] tracking-wider font-mono">
                                                <tr>
                                                    <th className="p-3 border-b border-gray-200">Employee ID</th>
                                                    <th className="p-3 border-b border-gray-200">User ID</th>
                                                    <th className="p-3 border-b border-gray-200">Department</th>
                                                    <th className="p-3 border-b border-gray-200 font-mono text-right">Registered Date</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-800/60">
                                                {records.map((lib) => (
                                                    <tr key={lib.id} className="hover:bg-white/50">
                                                        <td className="p-3 font-mono font-bold text-gray-900">{lib.employee_id}</td>
                                                        <td className="p-3 font-mono text-gray-600">User #{lib.user_id}</td>
                                                        <td className="p-3 text-gray-700">{lib.department || 'Circulation'}</td>
                                                        <td className="p-3 text-right font-mono text-gray-500">{String(lib.created_at || '').slice(0, 10)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Generic Table View (Users, Books, Copies, Loans, Fines, etc.) */}
                    {activeTab !== 'overview' && activeTab !== 'members' && activeTab !== 'librarians' && (
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                            
                            {/* Control Bar */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-200 pb-4">
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <h2 className="text-base font-bold text-gray-900 capitalize flex items-center gap-2">
                                        <Table className="w-4 h-4 text-gray-600" /> {activeTab.replace('_', ' ')}
                                    </h2>
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white text-gray-600 border border-gray-200">
                                        {records.length} Records
                                    </span>
                                </div>

                                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-60">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Filter records..."
                                            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs text-zinc-200 focus:outline-none focus:border-gray-300 font-mono"
                                        />
                                    </div>

                                    <button
                                        onClick={handleOpenCreate}
                                        className="py-1.5 px-3 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs flex items-center gap-1 shadow-sm whitespace-nowrap"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Add Record
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            {loading ? (
                                <div className="flex items-center justify-center py-16 text-gray-600 font-mono text-xs">
                                    <Loader2 className="w-6 h-6 animate-spin text-gray-600 mr-2" /> Loading records...
                                </div>
                            ) : filteredRecords.length === 0 ? (
                                <div className="text-center py-16 text-gray-500 space-y-1">
                                    <Table className="w-8 h-8 mx-auto text-zinc-600" />
                                    <p className="text-xs">No records found in {activeTab}.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto max-h-[500px]">
                                    <table className="w-full text-left text-xs text-gray-700 border-collapse">
                                        <thead className="bg-white sticky top-0 text-gray-600 uppercase text-[10px] font-mono tracking-wider z-10">
                                            <tr>
                                                {columns.map(col => (
                                                    <th key={col} className="p-3 border-b border-gray-200 whitespace-nowrap">{col}</th>
                                                ))}
                                                <th className="p-3 border-b border-gray-200 text-right whitespace-nowrap">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-800/60">
                                            {filteredRecords.map((row) => (
                                                <tr key={row.id} className="hover:bg-white/60 transition-colors">
                                                    {columns.map(col => (
                                                        <td key={col} className="p-3 max-w-xs truncate font-mono text-[11px]">
                                                            {row[col] === null || row[col] === undefined ? (
                                                                <span className="text-zinc-600 italic">null</span>
                                                            ) : typeof row[col] === 'boolean' ? (
                                                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row[col] ? 'bg-zinc-100 text-zinc-950' : 'bg-gray-200 text-gray-600'}`}>
                                                                    {row[col] ? 'TRUE' : 'FALSE'}
                                                                </span>
                                                            ) : (
                                                                String(row[col])
                                                            )}
                                                        </td>
                                                    ))}
                                                    <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                                        <button
                                                            onClick={() => handleOpenEdit(row)}
                                                            className="p-1.5 rounded-md bg-white hover:bg-gray-200 border border-gray-200 text-gray-700 transition-colors"
                                                            title="Edit Record"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(row.id)}
                                                            className="p-1.5 rounded-md bg-white hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
                                                            title="Delete Record"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>

            {/* Task 4: Member Ban Modal with Reason Dropdown & Custom Text Area */}
            {banModal.isOpen && banModal.member && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative">
                        <button
                            onClick={() => setBanModal({ isOpen: false, member: null })}
                            className="absolute top-4 right-4 p-1.5 text-gray-600 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900">
                                    {banModal.member.is_banned ? 'Lift Member Suspension' : 'Suspend Member Account'}
                                </h3>
                                <p className="text-xs text-gray-600 font-mono">Member #{banModal.member.member_number}</p>
                            </div>
                        </div>

                        <form onSubmit={handleToggleBan} className="space-y-3">
                            {!banModal.member.is_banned && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Select Suspension Reason</label>
                                        <select
                                            value={banReasonSelect}
                                            onChange={(e) => setBanReasonSelect(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300"
                                        >
                                            <option value="Overdue Fines Unpaid">Overdue Fines Unpaid</option>
                                            <option value="Damaged Library Property">Damaged Library Property</option>
                                            <option value="System Policy Violation">System Policy Violation</option>
                                            <option value="Suspicious Account Activity">Suspicious Account Activity</option>
                                            <option value="Custom Reason">Custom Reason</option>
                                        </select>
                                    </div>

                                    {banReasonSelect === 'Custom Reason' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Specify Custom Reason</label>
                                            <textarea
                                                value={customBanReason}
                                                onChange={(e) => setCustomBanReason(e.target.value)}
                                                placeholder="Provide detailed ban reason..."
                                                required
                                                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-900 focus:outline-none focus:border-gray-300 h-20"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setBanModal({ isOpen: false, member: null })}
                                    className="py-1.5 px-3 rounded-lg bg-gray-200 hover:bg-zinc-700 text-gray-700 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={banLoading}
                                    className="py-1.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-sm flex items-center gap-1.5"
                                >
                                    {banLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (banModal.member.is_banned ? 'Confirm Lift Ban' : 'Confirm Suspension')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* General Create / Edit Modal */}
            {modal.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setModal({ type: null, record: null })}
                            className="absolute top-4 right-4 p-1.5 text-gray-600 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-white border border-gray-200 text-gray-700">
                                <Table className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-900 capitalize">
                                    {modal.type === 'create' ? `Create Record` : `Edit Record #${modal.record?.id}`}
                                </h3>
                                <p className="text-xs text-gray-600">Fill in record attribute fields below</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitForm} className="space-y-3 overflow-y-auto pr-1 flex-1">
                            {columns
                                .filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at')
                                .map(col => (
                                    <div key={col}>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize font-mono">
                                            {col.replace('_', ' ')}
                                        </label>
                                        <input
                                            type={col.includes('password') ? 'password' : col.includes('email') ? 'email' : 'text'}
                                            value={formData[col] ?? ''}
                                            onChange={(e) => handleFieldChange(col, e.target.value)}
                                            placeholder={`Enter ${col}`}
                                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300 font-mono"
                                        />
                                    </div>
                                ))}

                            {/* If creating user, ensure password field is rendered */}
                            {modal.type === 'create' && activeTab === 'users' && !columns.includes('password') && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize font-mono">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={formData['password'] ?? ''}
                                        onChange={(e) => handleFieldChange('password', e.target.value)}
                                        placeholder="Enter password"
                                        required
                                        className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-gray-300 font-mono"
                                    />
                                </div>
                            )}

                            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null, record: null })}
                                    className="py-1.5 px-3 rounded-lg bg-gray-200 hover:bg-zinc-700 text-gray-700 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="py-1.5 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-xs shadow-sm flex items-center gap-1.5"
                                >
                                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (modal.type === 'create' ? 'Insert Record' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
