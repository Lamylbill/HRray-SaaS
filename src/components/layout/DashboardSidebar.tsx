
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  X,
  Home,
  Users,
  Calendar,
  Settings,
  LogOut,
  Activity,
  DollarSign,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('dashboard-sidebar');
      const backdrop = document.getElementById('sidebar-backdrop');
      if (sidebar && backdrop &&
          !sidebar.contains(event.target as Node) &&
          backdrop.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard',  icon: <Home className="h-5 w-5" /> },
    { path: '/employees', label: 'Employees',  icon: <Users className="h-5 w-5" /> },
    { path: '/leave',     label: 'Leave',       icon: <Calendar className="h-5 w-5" /> },
    { path: '/payroll',   label: 'Payroll',     icon: <DollarSign className="h-5 w-5" /> },
    { path: '/compliance',label: 'Compliance',  icon: <ShieldCheck className="h-5 w-5" /> },
  ];

  const secondaryNavItems = [
    { path: '/activity', label: 'Activity Log', icon: <Activity className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings',     icon: <Settings className="h-5 w-5" /> },
  ];

  const userInitial = (user?.email || 'U')[0].toUpperCase();
  const userName = user?.user_metadata?.full_name || 'User';

  return (
    <>
      {/* Backdrop */}
      <div
        id="sidebar-backdrop"
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <div
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 w-64 bg-blue-900 z-50 transform transition-transform duration-300 ease-in-out shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-blue-800">
            <Link to="/dashboard" className="flex items-center gap-1" onClick={onClose}>
              <span className="font-bold text-xl text-white">HR</span>
              <span className="font-bold text-xl text-orange-400">ray</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-md text-blue-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-blue-800">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 text-white h-10 w-10 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0">
                {userInitial}
              </div>
              <div className="min-w-0">
                <div className="font-medium text-white truncate">{userName}</div>
                <div className="text-xs text-blue-300 truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          {/* Main Navigation */}
          <div className="flex-1 px-2 py-4 overflow-auto">
            <div className="space-y-0.5">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors duration-150 ${
                    isActive(item.path)
                      ? 'bg-orange-500 text-white'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="mr-3 flex-shrink-0">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="px-3 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
                System
              </h3>
              <div className="space-y-0.5">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium w-full transition-colors duration-150 ${
                      isActive(item.path)
                        ? 'bg-orange-500 text-white'
                        : 'text-blue-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 flex-shrink-0">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium w-full text-red-300 hover:bg-white/10 hover:text-red-200 transition-colors duration-150 cursor-pointer"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
