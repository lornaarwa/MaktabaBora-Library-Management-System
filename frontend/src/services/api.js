import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

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
    logout: () => apiClient.post('/auth/logout'),
    getMe: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
    changeFirstLoginPassword: (data) => apiClient.post('/auth/change-first-login-password', data),

    // Catalog & Books
    searchCatalog: (query = '', genre = '') => apiClient.get(`/catalog/search?q=${encodeURIComponent(query)}&genre=${encodeURIComponent(genre)}`),
    getBooks: () => apiClient.get('/books'),
    getBookDetails: (id) => apiClient.get(`/books/${id}`),
    getSimilarBooks: (id) => apiClient.get(`/books/${id}/similar`),
    getRecommendations: () => apiClient.get('/recommendations'),

    // Subscriptions
    checkoutSubscription: (data) => apiClient.post('/subscriptions/checkout', data),
    getSubscriptionStatus: () => apiClient.get('/subscriptions/status'),
    cancelSubscription: () => apiClient.post('/subscriptions/cancel'),
    requestRefund: (data) => apiClient.post('/subscriptions/refund', data),
    getReimbursementStatus: () => apiClient.get('/subscriptions/refund-status'),
    getMyFines: () => apiClient.get('/fines'),

    // Digital Book Store
    getMyDigitalLibrary: () => apiClient.get('/digital-books/my-library'),
    purchaseDigitalBook: (id, data) => apiClient.post(`/digital-books/${id}/purchase`, data),
    checkoutCart: (data) => apiClient.post('/digital-books/checkout-cart', data),
    readDigitalBook: (id) => apiClient.get(`/digital-books/${id}/read`),

    // Loans & Reservations
    getLoans: () => apiClient.get('/loans'),
    reserveBook: (bookId) => apiClient.post('/reservations', { book_id: bookId }),
    payFineDaraja: (fineId, data) => apiClient.post(`/fines/${fineId}/pay-daraja`, data),

    // Librarian Operations
    getMetrics: () => apiClient.get('/librarian/metrics'),
    getLibrarianMembers: () => apiClient.get('/librarian/members'),
    checkoutLoan: (data) => apiClient.post('/librarian/loans/checkout', data),
    returnLoan: (loanId) => apiClient.post(`/librarian/loans/${loanId}/return`),
    createBook: (data) => apiClient.post('/librarian/books', data),
    updateBook: (id, data) => apiClient.put(`/librarian/books/${id}`, data),
    deleteBook: (id) => apiClient.delete(`/librarian/books/${id}`),
    toggleBookRestriction: (id) => apiClient.post(`/librarian/books/${id}/toggle-restriction`),
    configureBorrowLimit: (memberId, limit) => apiClient.post(`/librarian/members/${memberId}/borrow-limit`, { borrow_limit: limit }),
    getFines: () => apiClient.get('/librarian/fines'),
    waiveFine: (fineId) => apiClient.post(`/librarian/fines/${fineId}/waive`),

    // Librarian Book Copies & Subscriptions CRUD
    getLibrarianCopies: () => apiClient.get('/librarian/book-copies'),
    createLibrarianCopy: (data) => apiClient.post('/librarian/book-copies', data),
    updateLibrarianCopy: (id, data) => apiClient.put(`/librarian/book-copies/${id}`, data),
    deleteLibrarianCopy: (id) => apiClient.delete(`/librarian/book-copies/${id}`),

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
    getMembershipTiers: () => apiClient.get('/admin/membership-tiers'),
    updateMembershipTiers: (tiers) => apiClient.put('/admin/membership-tiers', { tiers }),

    // AI Assistant
    sendAiMessage: (prompt) => apiClient.post('/ai/chat', { prompt }),
};

export default api;
