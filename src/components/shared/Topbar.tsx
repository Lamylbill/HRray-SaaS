import React from 'react';
import { Menu, Bell, ChevronRight } from 'lucide-react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/dashboard':  { title: 'Dashboard',        subtitle: 'Overview of your workforce' },
  '/employees':  { title: 'Employees',         subtitle: 'Manage your team' },
  '/leave':      { title: 'Leave Management',  subtitle: 'Track and approve leave' },
  '/payroll':    { title: 'Payroll',           subtitle: 'Process and manage compensation' },
  '/compliance': { title: 'Compliance',        subtitle: 'Stay on top of regulations' },
  '/settings':   { title: 'Settings',         subtitle: 'Configure your workspace' },
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const meta = PAGE_META[pathname] ?? { title: 'HRray', subtitle: '' };
  const initial = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <header className="h-16 bg-white/95 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>HRray</span>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-medium">{meta.title}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative text-gray-400 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </button>

        <Link
          to="/settings"
          className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          title={user?.email}
        >
          {initial}
        </Link>
      </div>
    </header>
  );
}
