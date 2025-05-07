
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MenuIcon,
  Users,
  Home,
  Calendar,
  Settings,
  ChevronDown,
  Bell,
  DollarSign
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui-custom/Button';
import DateTimeBar from '@/components/ui-custom/DateTimeBar';
import { NotificationBell } from '@/components/ui-custom/NotificationBell';
import DashboardSidebar from './DashboardSidebar';

export const DashNavbar = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();

  // Handle scroll event to add shadow to navbar when scrolled
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Navigation items for the dashboard
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { path: '/employees', label: 'Employees', icon: <Users className="h-5 w-5" /> },
    { path: '/leave', label: 'Leave', icon: <Calendar className="h-5 w-5" /> },
    { path: '/payroll', label: 'Payroll', icon: <DollarSign className="h-5 w-5" /> },
    { path: '/settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  // Check if the current path matches a nav item
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <div className={`fixed top-0 w-full z-40 bg-blue-700 shadow-md transition-all ${scrolled ? 'shadow-lg' : ''}`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Logo and toggle button */}
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleSidebar}
                className="text-white focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md p-1"
              >
                <MenuIcon className="h-6 w-6" />
              </button>
              <Link to="/dashboard" className="flex items-center">
                <span className="text-white text-lg font-bold">HRFlow</span>
              </Link>
            </div>

            {/* Center - Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                    isActive(item.path)
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Right side - User controls */}
            <div className="flex items-center space-x-4">
              <DateTimeBar className="hidden md:block" />
              <NotificationBell />
              
              <div className="relative">
                <button
                  onClick={toggleDropdown}
                  className="flex items-center text-white space-x-2 focus:outline-none focus:ring-2 focus:ring-white/50 rounded-md p-1"
                >
                  <Avatar className="h-8 w-8 bg-blue-600">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {(user?.full_name || user?.email || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.full_name || user?.email || 'User'}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {/* Dropdown menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar for mobile */}
      <DashboardSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </>
  );
};
