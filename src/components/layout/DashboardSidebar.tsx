
import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  X, 
  Home, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Clock, 
  Activity,
  BarChart,
  FileText,
  DollarSign
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Close sidebar on location change (mobile navigation)
    onClose();
  }, [location.pathname, onClose]);

  // Add event listener to close sidebar when clicking outside
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

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Check if a nav item is active
  const isActive = (path: string) => location.pathname === path;

  // Main navigation items
  const mainNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { path: '/employees', label: 'Employees', icon: <Users className="h-5 w-5" /> },
    { path: '/leave', label: 'Leave', icon: <Calendar className="h-5 w-5" /> },
    { path: '/payroll', label: 'Payroll', icon: <DollarSign className="h-5 w-5" /> },
  ];

  // Secondary navigation items
  const secondaryNavItems = [
    { path: '/activity', label: 'Activity Log', icon: <Activity className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        id="sidebar-backdrop"
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <div
        id="dashboard-sidebar"
        className={`fixed inset-y-0 left-0 w-64 bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b">
            <Link to="/dashboard" className="flex items-center" onClick={onClose}>
              <span className="font-bold text-xl text-blue-700">HRFlow</span>
            </Link>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* User Info */}
          <div className="px-4 py-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-700 text-white h-10 w-10 rounded-full flex items-center justify-center font-semibold">
                {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
              </div>
              <div className="space-y-0.5">
                <div className="font-medium">{user?.full_name || 'User'}</div>
                <div className="text-sm text-gray-500 truncate max-w-[180px]">{user?.email}</div>
              </div>
            </div>
          </div>
          
          {/* Main Navigation */}
          <div className="flex-1 px-2 py-4 overflow-auto">
            <div className="space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium w-full ${
                    isActive(item.path)
                      ? 'bg-blue-700 text-white'
                      : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <h3 className="px-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                System
              </h3>
              <div className="mt-2 space-y-1">
                {secondaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium w-full ${
                      isActive(item.path)
                        ? 'bg-blue-700 text-white'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-4 border-t">
            <button
              onClick={handleSignOut}
              className="flex items-center px-3 py-2.5 rounded-md text-sm font-medium w-full text-red-600 hover:bg-red-50"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;
