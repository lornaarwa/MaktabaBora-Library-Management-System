import React, { useState, useEffect } from 'react';
import { Shield, Users, BookOpen, CheckCircle2, Loader2, BookCheck, Clock, CreditCard } from 'lucide-react';
import { api } from '../services/api';

export default function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [metrics, setMetrics] = useState({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAdminData = async () => {
            setLoading(true);
            try {
                const [metricsRes, usersRes] = await Promise.all([
                    api.getMetrics().catch(() => ({ total_books: 0, active_loans: 0, overdue_loans: 0, total_unpaid_fines: 0 })),
                    api.get('/admin/users').catch(() => ({ data: [] })),
                ]);
                setMetrics(metricsRes.data || metricsRes || {});
                setUsers(usersRes.data || usersRes || []);
            } catch (err) {
                console.error('Failed to load admin data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAdminData();
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Admin Header */}
            <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-slate-950 border border-rose-500/30 rounded-3xl p-6 md:p-8 flex items-center justify-between">
                <div>
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">
                        ADMINISTRATION CONSOLE
                    </span>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white">
                        MaktabaBora System Administration
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">
                        System health overview, user accounts directory, and circulation metrics
                    </p>
                </div>
            </div>

            {/* Core System Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Registered Accounts</span>
                        <Users className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-2xl font-extrabold text-white block">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (users.length || 0)}
                    </span>
                    <span className="text-[10px] text-indigo-400 font-semibold">Active User Directory</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Catalog Titles</span>
                        <BookOpen className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-2xl font-extrabold text-cyan-300 block">
                        {loading ? '...' : (metrics.total_books || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">Physical & Digital Titles</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Active Loans</span>
                        <BookCheck className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-2xl font-extrabold text-emerald-400 block">
                        {loading ? '...' : (metrics.active_loans || 0)}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-semibold">Currently Checked Out</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
                    <div className="flex justify-between items-center text-slate-400">
                        <span className="text-xs font-semibold">Unpaid Fine Balances</span>
                        <CreditCard className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-2xl font-extrabold text-white block">
                        KES {loading ? '...' : (metrics.total_unpaid_fines || 0)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">System Fine Ledger</span>
                </div>

            </div>

            {/* Registered Users Directory Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" /> User Accounts Directory
                </h2>

                {loading ? (
                    <div className="flex items-center justify-center py-8 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" /> Loading accounts directory...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-300">
                            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px] tracking-wider">
                                <tr>
                                    <th className="p-3 rounded-l-xl">User Name</th>
                                    <th className="p-3">Email Address</th>
                                    <th className="p-3">Account Role</th>
                                    <th className="p-3 rounded-r-xl">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {users.length > 0 ? (
                                    users.map((u) => (
                                        <tr key={u.id} className="hover:bg-slate-850/50">
                                            <td className="p-3 font-semibold text-white">{u.name}</td>
                                            <td className="p-3 text-slate-400">{u.email}</td>
                                            <td className="p-3 uppercase font-mono font-bold text-indigo-400">{u.role}</td>
                                            <td className="p-3">
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                                                    Active
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="p-4 text-center text-slate-500">
                                            No user accounts registered.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
