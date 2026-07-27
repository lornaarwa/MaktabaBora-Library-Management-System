import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import './css/index.css';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AiChatWidget from './components/AiChatWidget';

import PublicCatalog from './pages/PublicCatalog';
import MemberDashboard from './pages/MemberDashboard';
import LibrarianDashboard from './pages/LibrarianDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Explore from './pages/Explore';

function AppContent() {
    const [isAiOpen, setIsAiOpen] = useState(false);
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
    const isHomePage = location.pathname === '/';
    const isExplorePage = location.pathname === '/explore';
    const isMemberDashboard = location.pathname.startsWith('/member');
    const hideGlobalNav = isAuthPage || isMemberDashboard || isHomePage || isExplorePage;

    return (
        <div className="min-h-screen flex flex-col justify-between bg-background text-on-background">
            {!hideGlobalNav ? (
                <div>
                    <Navbar onOpenAiChat={() => setIsAiOpen(true)} />
                    <main>
                        <Routes>
                            <Route path="/" element={<PublicCatalog />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/member" element={<MemberDashboard />} />
                            <Route path="/librarian" element={<LibrarianDashboard />} />
                            <Route path="/admin" element={<AdminDashboard />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                        </Routes>
                    </main>
                </div>
            ) : (
                <Routes>
                    <Route path="/" element={<PublicCatalog />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/member/*" element={<MemberDashboard />} />
                </Routes>
            )}

            {!hideGlobalNav && <Footer />}

            <AiChatWidget isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
        </div>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <AppContent />
            </BrowserRouter>
        </AuthProvider>
    );
}

if (document.getElementById('app')) {
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(<App />);
}
