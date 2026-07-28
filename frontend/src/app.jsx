import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './css/index.css';
import { AuthProvider } from './context/AuthContext';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { AppShell } from './components/layout/AppShell';
import AiChatWidget from './components/AiChatWidget';
import { ToastStack } from './components/ui/ToastStack';

import PublicCatalog from './pages/PublicCatalog';
import MemberDashboard from './pages/MemberDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';

function RequireRole({ allow, children }) {
  const { role } = useLibrary();
  if (allow && !allow.includes(role)) {
    return (
      <div className="mx-auto max-w-md my-16 rounded-xl border border-bark-100 bg-paper px-6 py-14 text-center shadow-card">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-bark-500">403 Forbidden</p>
        <p className="mt-2 text-sm font-bold text-bark-900">This area requires {allow.join(' or ')} permission</p>
        <p className="mt-1 text-sm text-bark-500">Switch active role in the sidebar to view this section.</p>
      </div>
    );
  }
  return <>{children}</>;
}

function Shell() {
  const [isAiOpen, setIsAiOpen] = useState(false);
  const { toasts, dismissToast } = useLibrary();

  return (
    <AppShell onOpenAiChat={() => setIsAiOpen(true)}>
      <Routes>
        <Route path="/" element={<PublicCatalog />} />
        <Route path="/catalog" element={<PublicCatalog />} />
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
