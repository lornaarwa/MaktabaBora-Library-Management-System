import React, { useState, useEffect } from 'react';
import { 
    Database, Table, Plus, Edit2, Trash2, Search, X, Loader2, AlertCircle, CheckCircle2, 
    Users, Shield, BookOpen, Layers, BookCheck, Clock, CreditCard, Sparkles, ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard() {
    const [tables, setTables] = useState([
        'users', 'members', 'librarians', 'books', 'book_copies', 
        'loans', 'reservations', 'fines', 'subscriptions', 'digital_purchases'
    ]);
    const [activeTable, setActiveTable] = useState('users');
    
    // Table Data State
    const [columns, setColumns] = useState([]);
    const [records, setRecords] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // Modal State: { type: 'create' | 'edit' | null, record: object | null }
    const [modal, setModal] = useState({ type: null, record: null });
    const [formData, setFormData] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch table data when activeTable changes
    const fetchTableData = async (tableName) => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.getAdminTableData(tableName);
            setColumns(res.columns || []);
            setRecords(res.data || []);
        } catch (err) {
            console.error(`Failed to load data for table ${tableName}:`, err);
            setError(err.message || `Failed to fetch data for ${tableName}.`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTableData(activeTable);
    }, [activeTable]);

    // Handle Create Open
    const handleOpenCreate = () => {
        const initialForm = {};
        columns.forEach(col => {
            if (col !== 'id' && col !== 'created_at' && col !== 'updated_at') {
                initialForm[col] = '';
            }
        });
        setFormData(initialForm);
        setModal({ type: 'create', record: null });
    };

    // Handle Edit Open
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

    // Handle Form Field Change
    const handleFieldChange = (col, val) => {
        setFormData(prev => ({ ...prev, [col]: val }));
    };

    // Submit Create or Update
    const handleSubmitForm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (modal.type === 'create') {
                await api.createAdminRecord(activeTable, formData);
                setSuccessMsg(`Record created in ${activeTable} successfully.`);
            } else if (modal.type === 'edit') {
                await api.updateAdminRecord(activeTable, modal.record.id, formData);
                setSuccessMsg(`Record #${modal.record.id} in ${activeTable} updated successfully.`);
            }
            setModal({ type: null, record: null });
            fetchTableData(activeTable);
        } catch (err) {
            setError(err.message || 'Operation failed.');
        } finally {
            setSubmitting(false);
        }
    };

    // Handle Delete Record
    const handleDelete = async (id) => {
        if (!window.confirm(`Are you sure you want to delete record #${id} from ${activeTable}?`)) {
            return;
        }
        setError(null);
        setSuccessMsg(null);
        try {
            await api.deleteAdminRecord(activeTable, id);
            setSuccessMsg(`Record #${id} deleted from ${activeTable}.`);
            fetchTableData(activeTable);
        } catch (err) {
            setError(err.message || 'Delete operation failed.');
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

    // Icons map for sidebar items
    const getTableIcon = (name) => {
        switch (name) {
            case 'users': return <Users className="w-4 h-4" />;
            case 'members': return <Shield className="w-4 h-4 text-indigo-400" />;
            case 'librarians': return <Users className="w-4 h-4 text-amber-400" />;
            case 'books': return <BookOpen className="w-4 h-4 text-cyan-400" />;
            case 'book_copies': return <Layers className="w-4 h-4 text-purple-400" />;
            case 'loans': return <BookCheck className="w-4 h-4 text-emerald-400" />;
            case 'reservations': return <Clock className="w-4 h-4 text-amber-400" />;
            case 'fines': return <CreditCard className="w-4 h-4 text-rose-400" />;
            case 'subscriptions': return <Sparkles className="w-4 h-4 text-amber-300" />;
            case 'digital_purchases': return <ShoppingBag className="w-4 h-4 text-purple-300" />;
            default: return <Table className="w-4 h-4" />;
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xl">
                <div>
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                        SYSTEM ADMINISTRATION
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-black text-white">
                        Database Entity CRUD Portal
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        Full Create, Read, Update & Delete management across domain database tables
                    </p>
                </div>
            </div>

            {/* Notifications */}
            {successMsg && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> {successMsg}
                    </div>
                    <button onClick={() => setSuccessMsg(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Main Layout: Mini Sidebar + Data Table Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                
                {/* Mini Sidebar Navigation (Task 2) */}
                <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 h-fit shadow-xl">
                    <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 py-1 flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-400" /> Database Tables
                    </h3>
                    <div className="space-y-1">
                        {tables.map(tName => (
                            <button
                                key={tName}
                                onClick={() => setActiveTable(tName)}
                                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                                    activeTable === tName
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex items-center gap-2.5 capitalize">
                                    {getTableIcon(tName)}
                                    <span>{tName.replace('_', ' ')}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table View & Actions (Task 3) */}
                <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-xl">
                    
                    {/* Control Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <h2 className="text-lg font-bold text-white capitalize flex items-center gap-2">
                                {getTableIcon(activeTable)} {activeTable.replace('_', ' ')}
                            </h2>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                                {records.length} Records
                            </span>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            {/* Search */}
                            <div className="relative flex-1 sm:w-64">
                                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Filter records..."
                                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            {/* Create Record Button */}
                            <button
                                onClick={handleOpenCreate}
                                className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4" /> Add Record
                            </button>
                        </div>
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16 text-slate-400">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2" /> Loading table records...
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="text-center py-16 text-slate-500 space-y-2">
                            <Table className="w-10 h-10 mx-auto text-slate-600" />
                            <p className="text-xs">No records found in {activeTable}.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto max-h-[500px]">
                            <table className="w-full text-left text-xs text-slate-300 border-collapse">
                                <thead className="bg-slate-950/80 sticky top-0 text-slate-400 uppercase text-[10px] tracking-wider z-10">
                                    <tr>
                                        {columns.map(col => (
                                            <th key={col} className="p-3 border-b border-slate-800 whitespace-nowrap">{col}</th>
                                        ))}
                                        <th className="p-3 border-b border-slate-800 text-right whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60">
                                    {filteredRecords.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-850/50 transition-colors">
                                            {columns.map(col => (
                                                <td key={col} className="p-3 max-w-xs truncate font-mono text-[11px]">
                                                    {row[col] === null || row[col] === undefined ? (
                                                        <span className="text-slate-600 italic">null</span>
                                                    ) : typeof row[col] === 'boolean' ? (
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${row[col] ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                                                            {row[col] ? 'TRUE' : 'FALSE'}
                                                        </span>
                                                    ) : (
                                                        String(row[col])
                                                    )}
                                                </td>
                                            ))}
                                            <td className="p-3 text-right space-x-2 whitespace-nowrap">
                                                <button
                                                    onClick={() => handleOpenEdit(row)}
                                                    className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20"
                                                    title="Edit Record"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(row.id)}
                                                    className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20"
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
            </div>

            {/* Create / Edit Modal */}
            {modal.type && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative max-h-[85vh] flex flex-col">
                        <button
                            onClick={() => setModal({ type: null, record: null })}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                {getTableIcon(activeTable)}
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white capitalize">
                                    {modal.type === 'create' ? `Create ${activeTable.replace('_', ' ')} Record` : `Edit ${activeTable.replace('_', ' ')} #${modal.record.id}`}
                                </h3>
                                <p className="text-xs text-slate-400">Fill in record attribute fields below</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitForm} className="space-y-4 overflow-y-auto pr-1 flex-1">
                            {columns
                                .filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at')
                                .map(col => (
                                    <div key={col}>
                                        <label className="block text-xs font-semibold text-slate-300 mb-1 capitalize">
                                            {col.replace('_', ' ')}
                                        </label>
                                        <input
                                            type={col.includes('password') ? 'password' : col.includes('email') ? 'email' : 'text'}
                                            value={formData[col] ?? ''}
                                            onChange={(e) => handleFieldChange(col, e.target.value)}
                                            placeholder={`Enter ${col}`}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                        />
                                    </div>
                                ))}

                            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModal({ type: null, record: null })}
                                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="py-2 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (modal.type === 'create' ? 'Insert Record' : 'Save Changes')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
