import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpenIcon,
  LibraryIcon,
  QrCodeIcon,
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
  ShieldCheckIcon as ShieldNavIcon,
  SunIcon,
  MoonIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from 'lucide-react';
import { useLibrary } from '../../context/LibraryContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/Button';
import { Brand } from '../ui/Brand';

const navLinkBase =
  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60';
const navLinkActive = 'bg-bark-700 text-cream-light shadow-card';
const navLinkIdle = 'text-bark-700 hover:bg-cream-light/60 hover:text-bark-900';

export function AppShell({ children, onOpenAiChat }) {
  const { role, cartCount } = useLibrary();
  const auth = useAuth() || {};
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Collapsible Sidebar State (persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('smartlib_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('smartlib_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isGuestHomepage = location.pathname === '/' && !auth.user;
  const activeRole = auth.user?.role || role || null;

  const navigation = [
    { name: 'Catalog', href: '/catalog', icon: BookOpenIcon, allow: ['member'] },
    { name: 'My Cart', href: '/cart', icon: ShoppingCartIcon, allow: ['member'], badge: cartCount },
    { name: 'My Library', href: '/member', icon: LibraryIcon, allow: ['member'] },
    { name: 'Profile', href: '/profile', icon: UserIcon, allow: ['member', 'librarian', 'admin'] },
    { name: 'Librarian Dashboard', href: '/librarian', icon: QrCodeIcon, allow: ['librarian', 'admin'] },
    { name: 'Admin Dashboard', href: '/admin', icon: ShieldCheckIcon, allow: ['admin'] },
  ];

  const publicLinks = [
    { name: 'About', href: '/about', icon: InfoIcon },
    { name: 'Contact', href: '/contact', icon: PhoneIcon },
    { name: 'Privacy Policy', href: '/privacy', icon: ShieldNavIcon },
    { name: 'Membership', href: '/membership', icon: UserPlusIcon },
  ];

  const allowedNav = activeRole ? navigation.filter((item) => item.allow.includes(activeRole)) : [];
  const isActive = (href) => location.pathname === href || (href.includes('?') && location.search.includes('inventory'));

  return (
    <div className="flex min-h-screen bg-paper text-bark-900 mb-grain">

      {/* Desktop Sidebar (Only shown when not on Guest Homepage) */}
      {!isGuestHomepage && (
        <aside
          className={`hidden flex-col border-r border-bark-100 bg-paper/90 md:flex justify-between sticky top-0 h-screen transition-all duration-300 ease-in-out ${
            isSidebarCollapsed ? 'w-20 p-3' : 'w-64 p-5'
          }`}
        >
          <div className="space-y-6">
            {/* Brand Logo & Controls */}
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <Link
                  to="/"
                  className="group flex items-center justify-center p-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                  aria-label="MaktabaBora home"
                  title="MaktabaBora Home"
                >
                  <Brand variant="mark" className="h-9 w-9 rounded-xl shadow-sm" />
                </Link>
                <div className="flex flex-col items-center gap-1.5 pt-1">
                  <button
                    onClick={toggleSidebar}
                    type="button"
                    className="p-2 rounded-xl border border-bark-100 bg-cream-light/40 hover:bg-cream text-bark-700 hover:text-bark-900 transition shadow-sm"
                    title="Expand Sidebar"
                    aria-label="Expand Sidebar"
                  >
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="p-2 rounded-xl border border-bark-100 bg-cream-light/40 hover:bg-cream text-bark-700 hover:text-bark-900 transition shadow-sm"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle dark mode"
                  >
                    {isDark ? <SunIcon className="h-4 w-4 text-amber-400" /> : <MoonIcon className="h-4 w-4 text-bark-700" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <Link
                  to="/"
                  className="group flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
                  aria-label="MaktabaBora home"
                >
                  <Brand />
                </Link>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleTheme}
                    type="button"
                    className="p-2 rounded-xl border border-bark-100 bg-cream-light/40 hover:bg-cream text-bark-700 hover:text-bark-900 transition shadow-sm"
                    title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    aria-label="Toggle dark mode"
                  >
                    {isDark ? <SunIcon className="h-4 w-4 text-amber-400" /> : <MoonIcon className="h-4 w-4 text-bark-700" />}
                  </button>
                  <button
                    onClick={toggleSidebar}
                    type="button"
                    className="p-2 rounded-xl border border-bark-100 bg-cream-light/40 hover:bg-cream text-bark-700 hover:text-bark-900 transition shadow-sm"
                    title="Collapse Sidebar"
                    aria-label="Collapse Sidebar"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Role-scoped Navigation Items */}
            <nav
              className={`space-y-1.5 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}
              aria-label="Primary navigation"
            >
              {allowedNav.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                if (isSidebarCollapsed) {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={item.name}
                      className={`relative flex items-center justify-center h-10 w-10 rounded-xl transition-colors ${
                        active ? navLinkActive : navLinkIdle
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-tan-light' : 'text-bark-500'}`} />
                      {item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-tan text-[9px] font-mono font-bold text-bark-900 shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${navLinkBase} ${active ? navLinkActive : navLinkIdle}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-tan-light' : 'text-bark-500'}`} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-tan text-[9px] font-mono font-bold text-bark-900 shadow-sm">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Public links — always visible */}
            <nav
              className={`space-y-1.5 border-t border-bark-100 pt-4 ${isSidebarCollapsed ? 'flex flex-col items-center' : ''}`}
              aria-label="Company links"
            >
              {publicLinks.map((item) => {
                const active = location.pathname === item.href;
                const Icon = item.icon;
                if (isSidebarCollapsed) {
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={item.name}
                      className={`flex items-center justify-center h-10 w-10 rounded-xl transition-colors ${
                        active ? navLinkActive : navLinkIdle
                      }`}
                      aria-current={active ? 'page' : undefined}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-tan-light' : 'text-bark-500'}`} />
                    </Link>
                  );
                }
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${navLinkBase} ${active ? navLinkActive : navLinkIdle}`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-tan-light' : 'text-bark-500'}`} />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer User Info */}
          <div className="border-t border-bark-100 pt-4 space-y-3">
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenAiChat}
                  title="Library Assistant"
                  className="flex items-center justify-center h-10 w-10 rounded-xl border border-bark-100 bg-cream-light/40 hover:bg-cream text-bark-700 hover:text-bark-900 transition shadow-sm"
                >
                  <BotIcon className="h-4 w-4" />
                </button>

                {auth.user ? (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      title={`${auth.user.name} (${auth.user.role})`}
                      className="cursor-default"
                    >
                      {auth.user.avatar_base64 ? (
                        <img
                          src={auth.user.avatar_base64}
                          alt={auth.user.name}
                          className="h-9 w-9 rounded-xl object-cover border border-tan-dark/40 shadow-sm"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-bark-700 text-cream-light font-extrabold text-xs shadow-sm">
                          {auth.user.name ? auth.user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => auth.logout()}
                      title="Sign Out"
                      className="p-2 rounded-xl text-bark-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                      <LogOutIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Link to="/login?mode=signin" title="Log In">
                      <button className="flex items-center justify-center h-9 w-9 rounded-xl bg-bark-700 text-cream-light hover:bg-bark-900 transition shadow-sm">
                        <LogInIcon className="h-4 w-4" />
                      </button>
                    </Link>
                    <Link to="/login?mode=signup" title="Register Account">
                      <button className="flex items-center justify-center h-9 w-9 rounded-xl border border-bark-200 text-bark-700 hover:bg-cream transition shadow-sm">
                        <UserPlusIcon className="h-4 w-4" />
                      </button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={onOpenAiChat}
                  className="w-full justify-start border border-bark-100 bg-cream-light/30"
                >
                  <BotIcon className="h-4 w-4 text-bark-700" />
                  <span>Library Assistant</span>
                </Button>

                {auth.user ? (
                  <div className="space-y-2 px-1">
                    <div className="flex items-center gap-3 min-w-0">
                      {auth.user.avatar_base64 ? (
                        <img
                          src={auth.user.avatar_base64}
                          alt={auth.user.name}
                          className="h-9 w-9 rounded-xl object-cover border border-tan-dark/40 shadow-sm flex-shrink-0"
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
              </>
            )}
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">

        {/* Mobile Header Bar */}
        {!isGuestHomepage && (
          <header className="flex h-16 items-center justify-between border-b border-bark-100 bg-paper/95 px-4 md:hidden sticky top-0 z-30 backdrop-blur-md">
            <Link to="/" className="flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60" aria-label="MaktabaBora home">
              <Brand variant="mark" className="h-9 w-9 rounded-lg" />
              <span className="text-base font-extrabold tracking-tight text-bark-900">
                Maktaba<span className="text-tan-dark">Bora</span>
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                type="button"
                className="p-2 rounded-lg border border-bark-100 bg-cream-light/40 hover:bg-cream text-bark-700 hover:text-bark-900 transition shadow-sm"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label="Toggle dark mode"
              >
                {isDark ? <SunIcon className="h-4 w-4 text-amber-400" /> : <MoonIcon className="h-4 w-4 text-bark-700" />}
              </button>
              <button
                onClick={() => setMobileMenuOpen((open) => !open)}
                aria-expanded={mobileMenuOpen}
                aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
                className="rounded-lg border border-bark-100 p-2 text-bark-700 transition hover:bg-cream-light/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-tan-dark/60"
              >
                {mobileMenuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
              </button>
            </div>
          </header>
        )}

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden border-b border-bark-100 bg-paper md:hidden"
            >
              <nav className="space-y-1 p-4" aria-label="Mobile navigation">
                {allowedNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${navLinkBase} ${isActive(item.href) ? navLinkActive : navLinkIdle}`}
                  >
                    <item.icon className="h-4 w-4 text-bark-500" />
                    <span className="flex-1">{item.name}</span>
                    {item.badge > 0 && (
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-tan text-[9px] font-mono font-bold text-bark-900">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
                {publicLinks.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`${navLinkBase} ${location.pathname === item.href ? navLinkActive : navLinkIdle}`}
                  >
                    <item.icon className="h-4 w-4 text-bark-500" />
                    <span className="flex-1">{item.name}</span>
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAiChat();
                  }}
                  className={`${navLinkBase} w-full border border-bark-100 bg-cream-light/40 text-left`}
                >
                  <BotIcon className="h-4 w-4 text-bark-700" />
                  <span className="flex-1">Library Assistant</span>
                </button>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Content (animated on route change) */}
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex-1"
        >
          {children}
        </motion.main>

        {/* Footer */}
        <footer className="border-t border-bark-100 bg-paper/80 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <Brand variant="mark" className="h-9 w-9 rounded-lg" />
              <p className="text-[11px] text-bark-500">
                &copy; {new Date().getFullYear()} MaktabaBora Library System. All rights reserved.
              </p>
            </div>
            <nav className="flex flex-wrap items-center justify-center gap-4" aria-label="Footer links">
              <Link to="/about" className="text-[11px] font-semibold text-bark-500 transition hover:text-bark-700">About</Link>
              <Link to="/contact" className="text-[11px] font-semibold text-bark-500 transition hover:text-bark-700">Contact</Link>
              <Link to="/privacy" className="text-[11px] font-semibold text-bark-500 transition hover:text-bark-700">Privacy Policy</Link>
              <Link to="/membership" className="text-[11px] font-semibold text-bark-500 transition hover:text-bark-700">Membership</Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}