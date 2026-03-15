'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Propriétés',
      href: '/properties',
      icon: <Building2 size={20} />,
    },
    {
      label: 'Calendrier',
      href: '/calendar',
      icon: <Calendar size={20} />,
    },
    {
      label: 'Réservations',
      href: '/reservations',
      icon: <BookOpen size={20} />,
    },
    {
      label: 'Messages',
      href: '/messages',
      icon: <MessageSquare size={20} />,
      badge: 3,
    },
    {
      label: 'Paramètres',
      href: '/settings',
      icon: <Settings size={20} />,
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-slate-900 border-r border-slate-800 flex flex-col h-screen transition-all duration-300 overflow-hidden`}
    >
      {/* Header with logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">CF</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-50">ChannelFlow</h1>
                <p className="text-xs text-slate-400">Channel Manager</p>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-lg">CF</span>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors duration-200"
            aria-label="Toggle sidebar"
          >
            <ChevronRight
              size={18}
              className={`text-slate-400 transition-transform duration-300 ${
                isCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <span
                  className={`flex-shrink-0 ${
                    isActive(item.href) ? 'text-white' : 'group-hover:text-slate-300'
                  }`}
                >
                  {item.icon}
                </span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-6 text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {isCollapsed && item.badge && item.badge > 0 && (
                  <span className="absolute -right-2 -top-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                {isActive(item.href) && !isCollapsed && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-lg" />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User profile section */}
      <div className="p-4 border-t border-slate-800">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex-shrink-0 flex items-center justify-center">
            <span className="text-white font-bold">
              {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {session?.user?.email || ''}
              </p>
            </div>
          )}
        </div>

        {/* Logout button */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className={`mt-4 w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={18} />
          {!isCollapsed && <span className="text-sm">Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
