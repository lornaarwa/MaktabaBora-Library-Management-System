import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './css/index.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { AppShell } from './components/layout/AppShell';
import AiChatWidget from './components/AiChatWidget';
import { ToastStack } from './components/ui/ToastStack';
import { Loader2 } from 'lucide-react';

import Home from './pages/Home';
import PublicCatalog from './pages/PublicCatalog';
import MemberDashboard from './pages/MemberDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

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
        <Route
          path="/catalog"
          element={
            <RequireRole allow={['member', 'librarian', 'admin']}>
              <PublicCatalog />
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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Login />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <AiChatWidget isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
      <ToastStack toasts={toasts} dismissToast={dismissToast} />
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LibraryProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </LibraryProvider>
    </AuthProvider>
  );
}

if (document.getElementById('app')) {
  const root = ReactDOM.createRoot(document.getElementById('app'));
  root.render(<App />);
}
