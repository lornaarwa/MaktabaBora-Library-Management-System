import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('smartlib_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(() => localStorage.getItem('smartlib_token') || null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            localStorage.setItem('smartlib_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('smartlib_user');
        }
    }, [user]);

    useEffect(() => {
        if (token) {
            localStorage.setItem('smartlib_token', token);
        } else {
            localStorage.removeItem('smartlib_token');
        }
    }, [token]);

    // Refresh user profile from API on mount if token exists
    useEffect(() => {
        const verifyUser = async () => {
            if (token) {
                try {
                    const res = await api.getMe();
                    if (res.data?.user) {
                        setUser(res.data.user);
                    }
                } catch (err) {
                    console.warn('Session expired or invalid token:', err.message);
                    logout();
                }
            }
            setLoading(false);
        };
        verifyUser();
    }, [token]);

    const login = async (email, password) => {
        const res = await api.login({ email, password });
        if (res.token && res.user) {
            setUser(res.user);
            setToken(res.token);
            return res.user;
        }
        throw new Error(res.message || 'Login failed');
    };

    const register = async (data) => {
        const res = await api.register(data);
        if (res.token && res.user) {
            setUser(res.user);
            setToken(res.token);
            return res.user;
        }
        throw new Error(res.message || 'Registration failed');
    };

    // Quick demo login helper for seamless testing
    const loginAsRole = async (role) => {
        let demoUser = {};
        if (role === 'admin') {
            demoUser = {
                id: 99,
                name: 'System Admin',
                email: 'admin@library.org',
                role: 'admin',
            };
        } else if (role === 'librarian') {
            demoUser = {
                id: 50,
                name: 'Head Librarian',
                email: 'librarian@library.org',
                role: 'librarian',
                librarian: { id: 1, employee_id: 'LIB-1002', department: 'Circulation' }
            };
        } else {
            demoUser = {
                id: 1,
                name: 'Alex Johnson',
                email: 'alex@student.edu',
                role: 'member',
                member: {
                    id: 1,
                    member_number: 'MEM-2026',
                    membership_tier: 'student',
                    borrow_limit: 5,
                    is_banned: false,
                    is_subscribed: true,
                }
            };
        }
        setUser(demoUser);
        setToken(`token_${role}_${Date.now()}`);
    };

    const logout = async () => {
        try {
            if (token) await api.logout();
        } catch (e) {
            // Ignore logout network error
        } finally {
            setUser(null);
            setToken(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken, login, register, loginAsRole, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
