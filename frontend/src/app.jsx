import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
    const [isAiOpen, setIsAiOpen] = useState(false);

    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100">
                    <div>
                        <Navbar onOpenAiChat={() => setIsAiOpen(true)} />
                        <main>
                            <Routes>
                                <Route path="/" element={<PublicCatalog />} />
                                <Route path="/member" element={<MemberDashboard />} />
                                <Route path="/librarian" element={<LibrarianDashboard />} />
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/login" element={<Login />} />
                            </Routes>
                        </main>
                    </div>

                    <Footer />

                    <AiChatWidget isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

if (document.getElementById('app')) {
    const root = ReactDOM.createRoot(document.getElementById('app'));
    root.render(<App />);
}
