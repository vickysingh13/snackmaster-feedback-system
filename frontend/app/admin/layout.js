'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  MessageSquareWarning,
  RefreshCcw,
  Star,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/submissions', icon: MessageSquareWarning, label: 'All Submissions' },
  { href: '/admin/refunds', icon: RefreshCcw, label: 'Refunds' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/forms', icon: Settings, label: 'Form Builder' },
];

export default function AdminLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [admin, setAdmin] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('sm_admin_token');
    const user = localStorage.getItem('sm_admin_user');
    if (!token) {
      router.replace('/admin/login');
      return;
    }
    if (user) setAdmin(JSON.parse(user));
  }, []);

  function logout() {
    localStorage.removeItem('sm_admin_token');
    localStorage.removeItem('sm_admin_user');
    router.push('/admin/login');
  }

  if (pathname === '/admin/login') return children;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 flex flex-col
          transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:flex`}
        style={{ background: '#1A0A00' }}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white border-opacity-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🍿</span>
              <div>
                <p
                  className="text-white font-bold text-base leading-tight"
                  style={{ fontFamily: 'Syne, sans-serif' }}
                >
                  SnackMaster
                </p>
                <p className="text-orange-400 text-xs">Admin Panel</p>
              </div>
            </div>
            <button
              className="lg:hidden text-gray-400 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all
                  ${active
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white hover:bg-white hover:bg-opacity-5'
                  }`}
                style={active ? { background: 'linear-gradient(135deg, #FF6B00, #FFB800)' } : {}}
              >
                <Icon size={18} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* Admin user + logout */}
        <div className="px-4 py-4 border-t border-white border-opacity-10">
          {admin && (
            <div className="flex items-center gap-3 mb-3 px-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #FF6B00, #FFB800)' }}
              >
                {admin.name?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{admin.name}</p>
                <p className="text-gray-500 text-xs truncate">{admin.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-900 hover:bg-opacity-20 transition-all text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍿</span>
            <span className="font-bold text-gray-800" style={{ fontFamily: 'Syne, sans-serif' }}>
              SnackMaster
            </span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
