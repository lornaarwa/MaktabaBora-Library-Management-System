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
  BotIcon,
  LogOutIcon,
  LogInIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  InfoIcon,
  PhoneIcon,
  UserIcon,
  ShieldCheckIcon as ShieldNavIcon
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';

export function AppShell({ children, onOpenAiChat }) {
  const { role, cartCount } = useLibrary();
  const auth = useAuth() || {};
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeRole = auth.user?.role || role || null;

  const navigation = [
    { name: 'Catalog', href: '/catalog', icon: BookOpenIcon, allow: ['member'] },
    { name: 'My Cart', href: '/cart', icon: ShoppingCartIcon, allow: ['member'], badge: cartCount },
    { name: 'My Library', href: '/member', icon: LibraryIcon, allow: ['member'] },
    { name: 'Profile', href: '/profile', icon: UserIcon, allow: ['member', 'librarian', 'admin'] },
    { name: 'Librarian Dashboard', href: '/librarian', icon: QrCodeIcon, allow: ['librarian', 'admin'] },
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon, allow: ['admin'] },
  ];

  const allowedNav = activeRole ? navigation.filter((item) => item.allow.includes(activeRole)) : [];

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
                  <span className="flex-1">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-tan-dark font-mono text-[9px] font-bold text-paper shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Public About link — always visible */}
          <Link
            to="/about"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              location.pathname === '/about'
                ? 'bg-bark-700 text-cream-light shadow-card'
                : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
            }`}
          >
            <InfoIcon className={`h-4 w-4 ${location.pathname === '/about' ? 'text-cream-light' : 'text-bark-500'}`} />
            <span className="flex-1">About</span>
          </Link>

          {/* Public Contact link — always visible */}
          <Link
            to="/contact"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              location.pathname === '/contact'
                ? 'bg-bark-700 text-cream-light shadow-card'
                : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
            }`}
          >
            <PhoneIcon className={`h-4 w-4 ${location.pathname === '/contact' ? 'text-cream-light' : 'text-bark-500'}`} />
            <span className="flex-1">Contact</span>
          </Link>

          {/* Public Privacy Policy link — always visible */}
          <Link
            to="/privacy"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              location.pathname === '/privacy'
                ? 'bg-bark-700 text-cream-light shadow-card'
                : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
            }`}
          >
            <ShieldNavIcon className={`h-4 w-4 ${location.pathname === '/privacy' ? 'text-cream-light' : 'text-bark-500'}`} />
            <span className="flex-1">Privacy Policy</span>
          </Link>

          {/* Public Membership Registration link — always visible */}
          <Link
            to="/membership"
            className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
              location.pathname === '/membership'
                ? 'bg-bark-700 text-cream-light shadow-card'
                : 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900'
            }`}
          >
            <UserPlusIcon className={`h-4 w-4 ${location.pathname === '/membership' ? 'text-cream-light' : 'text-bark-500'}`} />
            <span className="flex-1">Membership</span>
          </Link>
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

          {auth.user ? (
            <div className="space-y-2 px-1">
              <div className="flex items-center gap-3 min-w-0">
                {auth.user.avatar_base64 ? (
                  <img
                    src={auth.user.avatar_base64}
                    alt={auth.user.name}
                    className="h-9 w-9 rounded-xl object-cover border border-tan-dark shadow-sm flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bark-700 text-cream-light font-extrabold text-xs shadow-sm flex-shrink-0">
                    {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-bark-900">{auth.user.name}</p>
                  <p className="truncate font-mono text-[10px] text-bark-500 capitalize">{auth.user.role} Account</p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={() => auth.logout()}
                className="w-full justify-start text-xs border border-bark-100 hover:bg-cream"
              >
                <LogOutIcon className="h-4 w-4 text-bark-700" />
                <span>Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link to="/login?mode=signin">
                <Button variant="primary" className="w-full justify-center text-xs">
                  <LogInIcon className="h-3.5 w-3.5" /> Log In
                </Button>
              </Link>
              <Link to="/login?mode=signup">
                <Button variant="secondary" className="w-full justify-center text-xs">
                  <UserPlusIcon className="h-3.5 w-3.5" /> Register
                </Button>
              </Link>
            </div>
          )}
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
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-cream"
            >
              <InfoIcon className="h-4 w-4 text-bark-500" />
              <span>About</span>
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-cream"
            >
              <PhoneIcon className="h-4 w-4 text-bark-500" />
              <span>Contact</span>
            </Link>
            <Link
              to="/privacy"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-cream"
            >
              <ShieldNavIcon className="h-4 w-4 text-bark-500" />
              <span>Privacy Policy</span>
            </Link>
            <Link
              to="/membership"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-bark-700 hover:bg-cream"
            >
              <UserPlusIcon className="h-4 w-4 text-bark-500" />
              <span>Membership</span>
            </Link>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="border-t border-bark-100 bg-paper/80 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-[11px] text-bark-400">
              &copy; {new Date().getFullYear()} MaktabaBora Library System. All rights reserved.
            </p>
            <nav className="flex items-center gap-4">
              <Link to="/about" className="text-[11px] font-semibold text-bark-400 transition hover:text-bark-700">About</Link>
              <Link to="/contact" className="text-[11px] font-semibold text-bark-400 transition hover:text-bark-700">Contact</Link>
              <Link to="/privacy" className="text-[11px] font-semibold text-bark-400 transition hover:text-bark-700">Privacy Policy</Link>
              <Link to="/membership" className="text-[11px] font-semibold text-bark-400 transition hover:text-bark-700">Membership</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
