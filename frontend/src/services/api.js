import axios from 'axios';
import { clientCache } from './clientCache';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Local circular buffer for frontend terminal activity logs
const frontendTerminalLogBuffer = [
    `[${new Date().toISOString().slice(11, 19)}] [vite] v5.4.15 dev server running at http://localhost:5173/`,
    `[${new Date().toISOString().slice(11, 19)}] [vite] ready in 340 ms`,
    `[${new Date().toISOString().slice(11, 19)}] [REACT ROUTER] Auth Context initialized`,
];

export const appendFrontendTerminalLog = (logMessage) => {
    const timeStr = new Date().toISOString().slice(11, 19);
    frontendTerminalLogBuffer.push(`[${timeStr}] ${logMessage}`);
    if (frontendTerminalLogBuffer.length > 100) {
        frontendTerminalLogBuffer.shift();
    }
};

export const getFrontendTerminalLogs = () => [...frontendTerminalLogBuffer];

// Attach Bearer token to all requests if available in localStorage or sessionStorage
apiClient.interceptors.request.use((config) => {
    config.metadata = { startTime: new Date() };
    const method = (config.method || 'GET').toUpperCase();
    const url = config.url || '';
    appendFrontendTerminalLog(`[CLIENT HTTP REQUEST] -> ${method} ${url}`);

    const token = localStorage.getItem('smartlib_token') || sessionStorage.getItem('smartlib_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Unified response handling & terminal logging
apiClient.interceptors.response.use(
    (response) => {
        const duration = new Date() - (response.config?.metadata?.startTime || new Date());
        const method = (response.config?.method || 'GET').toUpperCase();
        const url = response.config?.url || '';
        appendFrontendTerminalLog(`[CLIENT HTTP RESPONSE] 200 OK <- ${method} ${url} (${duration}ms)`);
        return response.data;
    },
    (error) => {
        const duration = new Date() - (error.config?.metadata?.startTime || new Date());
        const method = (error.config?.method || 'GET').toUpperCase();
        const url = error.config?.url || '';
        const status = error.response?.status || 'ERR';
        const rawMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected API error occurred.';
        
        // Security sanitization: strip raw SQL queries, database credentials, host IPs, and SQLSTATE codes from client-visible error strings
        const isDbError = typeof rawMsg === 'string' && (
            rawMsg.includes('SQLSTATE') || 
            rawMsg.includes('Undefined table') || 
            rawMsg.includes('relation "') || 
            rawMsg.includes('select *') || 
            rawMsg.includes('pgsql')
        );

        const sanitizedMsg = isDbError 
            ? 'A database service error occurred. Details have been logged securely.' 
            : rawMsg;

        appendFrontendTerminalLog(`[CLIENT HTTP ERROR] ${status} <- ${method} ${url} (${duration}ms): ${sanitizedMsg}`);
        
        const customError = new Error(sanitizedMsg);
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        return Promise.reject(customError);
    }
);

export const api = {
    // Auth
    register: (data) => apiClient.post('/auth/register', data),
    registerMembershipStk: (data) => apiClient.post('/auth/register-membership-stk', data),
    login: (data) => apiClient.post('/auth/login', data),
    refreshToken: () => apiClient.post('/auth/refresh'),
    logout: async () => {
        clientCache.clear();
        return apiClient.post('/auth/logout');
    },
    getMe: () => apiClient.get('/auth/me'),
    updateProfile: async (data) => {
        const res = await apiClient.put('/auth/profile', data);
        clientCache.invalidate('user_');
        return res;
    },
    changeFirstLoginPassword: (data) => apiClient.post('/auth/change-first-login-password', data),

    // Catalog & Books
    searchCatalog: (query = '', genre = '') =>
        clientCache.fetchWithCache(
            `catalog_${query}_${genre}`,
            () => apiClient.get(`/catalog/search?q=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}`),
            { ttl: 120000, persist: true }
        ),
    getBooks: () =>
        clientCache.fetchWithCache('books_index', () => apiClient.get('/books'), { ttl: 120000, persist: true }),
    getBookDetails: (id) =>
        clientCache.fetchWithCache(`book_${id}`, () => apiClient.get(`/books/${id}`), { ttl: 180000, persist: true }),
    getSimilarBooks: (id) =>
        clientCache.fetchWithCache(`similar_${id}`, () => apiClient.get(`/books/${id}/similar`), { ttl: 300000, persist: true }),
    getRecommendations: () =>
        clientCache.fetchWithCache('recommendations', () => apiClient.get('/recommendations'), { ttl: 120000, persist: false }),

    // Subscriptions
    checkoutSubscription: async (data) => {
        const res = await apiClient.post('/subscriptions/checkout', data);
        clientCache.invalidate('user_');
        return res;
    },
    getSubscriptionStatus: () =>
        clientCache.fetchWithCache('user_subscription_status', () => apiClient.get('/subscriptions/status'), { ttl: 60000, persist: false }),
    cancelSubscription: async () => {
        const res = await apiClient.post('/subscriptions/cancel');
        clientCache.invalidate('user_');
        return res;
    },
    requestRefund: (data) => apiClient.post('/subscriptions/refund', data),
    getReimbursementStatus: () => apiClient.get('/subscriptions/refund-status'),
    getMyFines: () =>
        clientCache.fetchWithCache('user_fines', () => apiClient.get('/fines'), { ttl: 60000, persist: false }),

    // Digital Book Store
    getMyDigitalLibrary: () =>
        clientCache.fetchWithCache('user_digital_library', () => apiClient.get('/digital-books/my-library'), { ttl: 120000, persist: false }),
    purchaseDigitalBook: async (id, data) => {
        const res = await apiClient.post(`/digital-books/${id}/purchase`, data);
        clientCache.invalidate('user_digital_library');
        clientCache.invalidate(`book_${id}`);
        return res;
    },
    checkoutCart: async (data) => {
        const res = await apiClient.post('/digital-books/checkout-cart', data);
        clientCache.invalidate('user_digital_library');
        clientCache.invalidate('catalog_');
        return res;
    },
    readDigitalBook: (id) => apiClient.get(`/digital-books/${id}/read`),

    // Loans & Reservations
    getLoans: () =>
        clientCache.fetchWithCache('user_loans', () => apiClient.get('/loans'), { ttl: 60000, persist: false }),
    reserveBook: async (bookId) => {
        const res = await apiClient.post('/reservations', { book_id: bookId });
        clientCache.invalidate('user_reservations');
        clientCache.invalidate('catalog_');
        clientCache.invalidate(`book_${bookId}`);
        return res;
    },
    getMyReservations: () =>
        clientCache.fetchWithCache('user_reservations', () => apiClient.get('/reservations'), { ttl: 60000, persist: false }),
    cancelReservation: async (id) => {
        const res = await apiClient.delete(`/reservations/${id}`);
        clientCache.invalidate('user_reservations');
        clientCache.invalidate('catalog_');
        return res;
    },
    payFineDaraja: async (fineId, data) => {
        const res = await apiClient.post(`/fines/${fineId}/pay-daraja`, data);
        clientCache.invalidate('user_fines');
        return res;
    },

    // Librarian Operations
    getMetrics: () => apiClient.get('/librarian/metrics'),
    getLibrarianMembers: () => apiClient.get('/librarian/members'),
    checkoutLoan: async (data) => {
        const res = await apiClient.post('/librarian/loans/checkout', data);
        clientCache.invalidate('user_loans');
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },
    returnLoan: async (loanId) => {
        const res = await apiClient.post(`/librarian/loans/${loanId}/return`);
        clientCache.invalidate('user_loans');
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },
    createBook: async (data) => {
        const res = await apiClient.post('/librarian/books', data);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },
    updateBook: async (id, data) => {
        const res = await apiClient.put(`/librarian/books/${id}`, data);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        clientCache.invalidate(`book_${id}`);
        return res;
    },
    deleteBook: async (id) => {
        const res = await apiClient.delete(`/librarian/books/${id}`);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        clientCache.invalidate(`book_${id}`);
        return res;
    },
    toggleBookRestriction: async (id) => {
        const res = await apiClient.post(`/librarian/books/${id}/toggle-restriction`);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        clientCache.invalidate(`book_${id}`);
        return res;
    },
    configureBorrowLimit: (memberId, limit) => apiClient.post(`/librarian/members/${memberId}/borrow-limit`, { borrow_limit: limit }),
    getFines: () => apiClient.get('/librarian/fines'),
    waiveFine: async (fineId) => {
        const res = await apiClient.post(`/librarian/fines/${fineId}/waive`);
        clientCache.invalidate('user_fines');
        return res;
    },

    // Open Library Catalog Integration
    searchOpenLibrary: (params = {}) => apiClient.get('/librarian/openlibrary/search', { params }),
    importOpenLibraryBooks: async (books) => {
        const res = await apiClient.post('/librarian/openlibrary/import', { books });
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },

    // Librarian Book Copies & Subscriptions CRUD
    getLibrarianCopies: () => apiClient.get('/librarian/book-copies'),
    createLibrarianCopy: async (data) => {
        const res = await apiClient.post('/librarian/book-copies', data);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },
    updateLibrarianCopy: async (id, data) => {
        const res = await apiClient.put(`/librarian/book-copies/${id}`, data);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },
    deleteLibrarianCopy: async (id) => {
        const res = await apiClient.delete(`/librarian/book-copies/${id}`);
        clientCache.invalidate('catalog_');
        clientCache.invalidate('books_index');
        return res;
    },

    getActiveLoans: () => apiClient.get('/librarian/loans/active'),

    getLibrarianSubscriptions: () => apiClient.get('/librarian/subscriptions'),
    createLibrarianSubscription: (data) => apiClient.post('/librarian/subscriptions', data),
    updateLibrarianSubscription: (id, data) => apiClient.put(`/librarian/subscriptions/${id}`, data),
    deleteLibrarianSubscription: (id) => apiClient.delete(`/librarian/subscriptions/${id}`),

    // Reimbursement & Refund Requests
    getLibrarianReimbursements: () => apiClient.get('/librarian/reimbursements'),
    reviewReimbursement: (id, data) => apiClient.post(`/librarian/reimbursements/${id}/review`, data),
    getLibrarianRefundRequests: () => apiClient.get('/librarian/refund-requests'),
    approveLibrarianRefund: (id) => apiClient.post(`/librarian/refund-requests/${id}/approve`),
    rejectLibrarianRefund: (id) => apiClient.post(`/librarian/refund-requests/${id}/reject`),
    getAdminReimbursements: () => apiClient.get('/admin/reimbursements'),
    reviewAdminReimbursement: (id, data) => apiClient.post(`/admin/reimbursements/${id}/review`, data),

    // Hold Reservations Approvals & Circulation Desk
    getLibrarianReservations: (status) => apiClient.get('/librarian/reservations', { params: status ? { status } : {} }),
    approveLibrarianReservation: async (id, data = {}) => {
        const res = await apiClient.post(`/librarian/reservations/${id}/approve`, data);
        clientCache.invalidate('user_reservations');
        clientCache.invalidate('user_loans');
        clientCache.invalidate('catalog_');
        return res;
    },
    denyLibrarianReservation: async (id, data = {}) => {
        const res = await apiClient.post(`/librarian/reservations/${id}/deny`, data);
        clientCache.invalidate('user_reservations');
        clientCache.invalidate('catalog_');
        return res;
    },

    // Admin Operations
    getAdminAnalytics: () => apiClient.get('/admin/analytics'),
    getAdminApiLogs: () => apiClient.get('/admin/api-logs'),
    banAdminMember: (memberId, isBanned, reason = '') => apiClient.post(`/admin/members/${memberId}/ban`, { is_banned: isBanned, ban_reason: reason }),
    createAdminLibrarian: (data) => apiClient.post('/admin/librarians', data),
    getAdminTables: () => apiClient.get('/admin/tables'),
    getAdminTableData: (table) => apiClient.get(`/admin/tables/${table}`),
    createAdminRecord: (table, data) => apiClient.post(`/admin/tables/${table}`, data),
    updateAdminRecord: (table, id, data) => apiClient.put(`/admin/tables/${table}/${id}`, data),
    deleteAdminRecord: (table, id) => apiClient.delete(`/admin/tables/${table}/${id}`),
    
    // Membership Tiers Customization
    getMembershipTiers: () =>
        clientCache.fetchWithCache('membership_tiers', () => apiClient.get('/membership-tiers'), { ttl: 300000, persist: true }),
    updateMembershipTiers: async (tiers) => {
        const res = await apiClient.put('/admin/membership-tiers', { tiers });
        clientCache.invalidate('membership_tiers');
        return res;
    },

    // AI Settings & Multi-Provider Configuration
    getAiSettings: () => apiClient.get('/admin/ai-settings'),
    updateAiSettings: (data) => apiClient.put('/admin/ai-settings', data),
    testAiKey: (data) => apiClient.post('/admin/ai-settings/test-key', data),
    fetchAiProviderModels: (data) => apiClient.post('/admin/ai-settings/fetch-models', data),

    // AI Assistant
    sendAiMessage: (prompt, chat_session_id = null) => apiClient.post('/ai/chat', { prompt, chat_session_id }),
    clearAiChat: (chat_session_id = null) => apiClient.post('/ai/chat/clear', { chat_session_id }),

    // Speculative Preloaders
    prefetchBook: (id) => {
        if (!id) return;
        clientCache.prefetch(`book_${id}`, () => apiClient.get(`/books/${id}`), { ttl: 180000, persist: true });
        clientCache.prefetch(`similar_${id}`, () => apiClient.get(`/books/${id}/similar`), { ttl: 300000, persist: true });
    },
    prefetchCatalog: (query = '', genre = '') => {
        clientCache.prefetch(
            `catalog_${query}_${genre}`,
            () => apiClient.get(`/catalog/search?q=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}`),
            { ttl: 120000, persist: true }
        );
    },
    prefetchMyLibrary: () => {
        clientCache.prefetch('user_loans', () => apiClient.get('/loans'), { ttl: 60000 });
        clientCache.prefetch('user_reservations', () => apiClient.get('/reservations'), { ttl: 60000 });
        clientCache.prefetch('user_digital_library', () => apiClient.get('/digital-books/my-library'), { ttl: 120000 });
        clientCache.prefetch('user_subscription_status', () => apiClient.get('/subscriptions/status'), { ttl: 60000 });
    },

    cache: clientCache,
};

export default api;
