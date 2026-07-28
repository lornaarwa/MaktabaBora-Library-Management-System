import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpenIcon, 
  LibraryIcon, 
  QrCodeIcon, 
  LayersIcon, 
  ShieldCheckIcon, 
  MenuIcon, 
  XIcon, 
  BotIcon 
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function AppShell({ children, onOpenAiChat }) {
  const { role } = useLibrary();
  const auth = useAuth() || {};
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRole = auth.user?.role || role || 'member';

  const navigation = [
    { name: 'Catalog', href: '/', icon: BookOpenIcon, allow: ['member', 'librarian', 'admin'] },
    { name: 'My Library', href: '/member', icon: LibraryIcon, allow: ['member'] },
    { name: 'Librarian Dashboard', href: '/librarian', icon: QrCodeIcon, allow: ['librarian', 'admin'] },
    { name: 'Inventory Catalog', href: '/librarian?tab=inventory', icon: LayersIcon, allow: ['librarian', 'admin'] },
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon, allow: ['admin'] },
  ];

  const allowedNav = navigation.filter((item) => item.allow.includes(activeRole));

  return (
    <div className="flex min-h-screen bg-paper text-bark-900 mb-grain">
      
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-bark-100 bg-paper/90 p-5 md:flex justify-between sticky top-0 h-screen">
        <div className="space-y-6">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-bark-700 font-bold text-cream-light shadow-card">
              <BookOpenIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-bark-900 leading-none">
                Maktaba<span className="text-tan-dark">Bora</span>
              </h1>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-bark-500">Library System</p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="space-y-1.5">
            {allowedNav.map((item) => {
              const active = location.pathname === item.href || (item.href.includes('?') && location.search.includes('inventory'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-bark-700 text-cream-light shadow-card'
                      : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? 'text-cream-light' : 'text-bark-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info */}
        <div className="border-t border-bark-100 pt-4 space-y-3">
          <Button
            variant="ghost"
            onClick={onOpenAiChat}
            className="w-full justify-start border border-bark-100 bg-cream-light/30"
          >
            <BotIcon className="h-4 w-4 text-bark-700" />
            <span>AI Librarian</span>
          </Button>

          <div className="flex items-center justify-between px-2">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-bark-900">{auth.user?.name || 'Amina Wanjiru'}</p>
              <p className="truncate font-mono text-[10px] text-bark-500 capitalize">{activeRole} Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        
        {/* Mobile Header Bar */}
        <header className="flex h-16 items-center justify-between border-b border-bark-100 bg-paper/95 px-4 md:hidden sticky top-0 z-30 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-bark-700 text-cream-light">
              <BookOpenIcon className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-bark-900">MaktabaBora</span>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-bark-100 p-2 text-bark-700"
          >
            {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </header>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="border-b border-bark-100 bg-paper p-4 md:hidden space-y-3">
            <nav className="space-y-1">
              {allowedNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-cream"
                >
                  <item.icon className="h-4 w-4 text-bark-500" />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
