import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('smartlib_user') || sessionStorage.getItem('smartlib_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [token, setToken] = useState(() => {
        return localStorage.getItem('smartlib_token') || sessionStorage.getItem('smartlib_token') || null;
    });

    const [remember, setRememberState] = useState(() => {
        return localStorage.getItem('smartlib_remember') === 'true';
    });

    const [loading, setLoading] = useState(true);

    // Sync storage when user or token changes
    useEffect(() => {
        const storage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        if (user) {
            storage.setItem('smartlib_user', JSON.stringify(user));
            otherStorage.removeItem('smartlib_user');
        } else {
            localStorage.removeItem('smartlib_user');
            sessionStorage.removeItem('smartlib_user');
        }
    }, [user, remember]);

    useEffect(() => {
        const storage = remember ? localStorage : sessionStorage;
        const otherStorage = remember ? sessionStorage : localStorage;

        if (token) {
            storage.setItem('smartlib_token', token);
            otherStorage.removeItem('smartlib_token');
        } else {
            localStorage.removeItem('smartlib_token');
            sessionStorage.removeItem('smartlib_token');
        }
        localStorage.setItem('smartlib_remember', remember ? 'true' : 'false');
    }, [token, remember]);

    // Refresh user profile from API on mount if token exists
    useEffect(() => {
        const verifyUser = async () => {
            if (token) {
                try {
                    const res = await api.getMe();
                    const userData = res.user || res.data?.user;
                    if (userData) {
                        setUser(userData);
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

    const login = async (email, password, isRemember = false) => {
        setRememberState(isRemember);
        const res = await api.login({ email, password, remember: isRemember });
        const userData = res.user || res.data?.user;
        const userToken = res.token || res.data?.token;

        if (userToken && userData) {
            setUser(userData);
            setToken(userToken);
            return userData;
        }
        throw new Error(res.message || res.error || 'Login failed');
    };

    const register = async (data) => {
        const res = await api.register(data);
        const userData = res.user || res.data?.user;
        const userToken = res.token || res.data?.token;

        if (userToken && userData) {
            setUser(userData);
            setToken(userToken);
            return userData;
        }
        throw new Error(res.message || res.error || 'Registration failed');
    };

    const logout = async () => {
        try {
            if (token) await api.logout();
        } catch (e) {
            // Ignore logout network error
        } finally {
            setUser(null);
            setToken(null);
            localStorage.removeItem('smartlib_user');
            localStorage.removeItem('smartlib_token');
            sessionStorage.removeItem('smartlib_user');
            sessionStorage.removeItem('smartlib_token');
            sessionStorage.removeItem('smartlib_ai_chat_messages');
            sessionStorage.removeItem('smartlib_ai_chat_session_id');
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, token, setToken, remember, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
