import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// Attach Bearer token to all requests if available in localStorage or sessionStorage
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('smartlib_token') || sessionStorage.getItem('smartlib_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));

// Unified response handling
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message || 'An unexpected API error occurred.';
        const customError = new Error(errorMsg);
        customError.status = error.response?.status;
        customError.data = error.response?.data;
        return Promise.reject(customError);
    }
);

export const api = {
    // Auth
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    refreshToken: () => apiClient.post('/auth/refresh'),
    logout: () => apiClient.post('/auth/logout'),
    getMe: () => apiClient.get('/auth/me'),

    // Catalog & Books
    searchCatalog: (queryOrParams = '', genre = '') => {
        if (typeof queryOrParams === 'object') {
            const queryParams = new URLSearchParams(queryOrParams).toString();
            return apiClient.get(`/catalog/search?${queryParams}`);
        }
        return apiClient.get(`/catalog/search?q=${encodeURIComponent(queryOrParams)}&genre=${encodeURIComponent(genre)}`);
    },
    getBooks: () => apiClient.get('/books'),
    getBookDetails: (id) => apiClient.get(`/books/${id}`),

    // Subscriptions
    checkoutSubscription: (data) => apiClient.post('/subscriptions/checkout', data),
    getSubscriptionStatus: () => apiClient.get('/subscriptions/status'),

    // Digital Book Store
    getMyDigitalLibrary: () => apiClient.get('/digital-books/my-library'),
    purchaseDigitalBook: (id, data) => apiClient.post(`/digital-books/${id}/purchase`, data),
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

    // Admin Operations
    getAdminAnalytics: () => apiClient.get('/admin/analytics'),
    banAdminMember: (memberId, isBanned, reason = '') => apiClient.post(`/admin/members/${memberId}/ban`, { is_banned: isBanned, ban_reason: reason }),
    createAdminLibrarian: (data) => apiClient.post('/admin/librarians', data),
    getAdminTables: () => apiClient.get('/admin/tables'),
    getAdminTableData: (table) => apiClient.get(`/admin/tables/${table}`),
    createAdminRecord: (table, data) => apiClient.post(`/admin/tables/${table}`, data),
    updateAdminRecord: (table, id, data) => apiClient.put(`/admin/tables/${table}/${id}`, data),
    deleteAdminRecord: (table, id) => apiClient.delete(`/admin/tables/${table}/${id}`),

    // AI Assistant
    sendAiMessage: (prompt) => apiClient.post('/ai/chat', { prompt }),
};

export default api;
