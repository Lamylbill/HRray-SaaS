import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Calendar, DollarSign,
  Shield, Settings, X, LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees', icon: Users,            label: 'Employees' },
  { to: '/leave',     icon: Calendar,         label: 'Leave' },
  { to: '/payroll',   icon: DollarSign,       label: 'Payroll' },
  { to: '/compliance',icon: Shield,           label: 'Compliance' },
  { to: '/settings',  icon: Settings,         label: 'Settings' },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initial = user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 flex flex-col transition-transform duration-300 ease-out lg:static lg:translate-x-0',
        'bg-gradient-to-b from-[#0c1e4a] via-blue-900 to-[#0a1835]',
        'shadow-2xl shadow-blue-950/60',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/30">
              <span className="text-white font-bold text-sm">HR</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              HR<span className="text-orange-400">ray</span>
            </span>
          </div>
          <button onClick={onClose} className="lg:hidden text-blue-300 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }, i) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              style={{ animationDelay: `${i * 40}ms` }}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer group',
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-lg shadow-orange-500/25'
                  : 'text-blue-200/75 hover:bg-white/10 hover:text-white'
              )}
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={cn(
                      'flex-shrink-0 transition-transform duration-200',
                      !isActive && 'group-hover:scale-110'
                    )}
                  />
                  <span>{label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + logout */}
        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/8 mb-1">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
              {initial}
            </div>
            <p className="text-blue-200/80 text-xs truncate flex-1">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-blue-300/70 hover:bg-white/10 hover:text-white transition-all duration-200 cursor-pointer group"
          >
            <LogOut size={17} className="flex-shrink-0 group-hover:scale-110 transition-transform duration-200" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
