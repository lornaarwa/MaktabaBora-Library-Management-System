import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './css/index.css';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { AppShell } from './components/layout/AppShell';
import AiChatWidget from './components/AiChatWidget';
import { ToastStack } from './components/ui/ToastStack';
import { Loader2 } from 'lucide-react';

import Home from './pages/Home';
import PublicCatalog from './pages/PublicCatalog';
import BookDetails from './pages/BookDetails';
import CartPage from './pages/CartPage';
import MemberDashboard from './pages/MemberDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import About from './pages/About';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import MembershipRegistration from './pages/MembershipRegistration';
import Profile from './pages/Profile';

function RequireRole({ allow, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-bark-700" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allow && !allow.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'librarian') return <Navigate to="/librarian" replace />;
    return <Navigate to="/member" replace />;
  }

  return <>{children}</>;
}

function Shell() {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const { toasts, dismissToast } = useLibrary();

  return (
    <AppShell onOpenAiChat={() => setIsAiOpen(true)}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/membership" element={<MembershipRegistration />} />
        <Route
          path="/catalog"
          element={
            <RequireRole allow={['member', 'librarian', 'admin']}>
              <PublicCatalog />
            </RequireRole>
          }
        />
        <Route
          path="/books/:id"
          element={
            <RequireRole allow={['member', 'librarian', 'admin']}>
              <BookDetails />
            </RequireRole>
          }
        />
        <Route
          path="/cart"
          element={
            <RequireRole allow={['member', 'librarian', 'admin']}>
              <CartPage />
            </RequireRole>
          }
        />
        <Route
          path="/member"
          element={
            <RequireRole allow={['member']}>
              <MemberDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/profile"
          element={
            <RequireRole allow={['member', 'librarian', 'admin']}>
              <Profile />
            </RequireRole>
          }
        />
        <Route
          path="/librarian"
          element={
            <RequireRole allow={['librarian', 'admin']}>
              <LibrarianDashboard />
            </RequireRole>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRole allow={['admin']}>
              <AdminDashboard />
            </RequireRole>
          }
        />
        <Route path="/login" element={<MembershipRegistration />} />
        <Route path="/register" element={<MembershipRegistration />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AiChatWidget isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      <ToastStack toasts={toasts} dismissToast={dismissToast} />
    </AppShell>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LibraryProvider>
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </LibraryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

if (document.getElementById('app')) {
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
}
