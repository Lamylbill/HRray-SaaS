import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  ChevronDown,
  Bell,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui-custom/Button';
import DateTimeBar from '@/components/ui-custom/DateTimeBar';
import { NotificationBell } from '@/components/ui-custom/NotificationBell';
import { cn } from '@/lib/utils';

export const DashNavbar = () => {
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

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

  const isActive = (path: string) => location.pathname === path;
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'bg-white shadow-sm border-b border-gray-200' : 'bg-white'
      )}
    >
      <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Left - Logo */}
        <Link to="/" className="flex items-center gap-2" onClick={() => navigate('/')}>
          <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0">
            <span className="text-blue-700 font-display font-bold text-[30px]">HR</span>
            <span className="font-display font-bold text-[30px] text-orange-500">ray</span>
          </Button>
        </Link>

        {/* Center - Nav */}
        <div className="hidden md:flex items-center space-x-1">
          <Link
            to="/dashboard"
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
              isActive('/dashboard')
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <LayoutDashboard className="mr-2 h-5 w-5" />
            Dashboard
          </Link>
          <Link
            to="/employees"
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
              isActive('/employees')
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <Users className="mr-2 h-5 w-5" />
            Employees
          </Link>
          <Link
            to="/payroll"
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
              isActive('/payroll')
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Payroll
          </Link>
          <Link
            to="/leave"
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
              isActive('/leave')
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <Calendar className="mr-2 h-5 w-5" />
            Leave
          </Link>
          <Link
            to="/compliance"
            className={`px-4 py-2 rounded-full text-sm font-medium flex items-center transition-colors ${
              isActive('/compliance')
                ? 'bg-blue-700 text-white hover:bg-blue-800'
                : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
            }`}
          >
            <ShieldCheck className="mr-2 h-5 w-5" />
            Compliance
          </Link>
        </div>

        {/* Right - User & Notification */}
        <div className="flex items-center space-x-4">
          <NotificationBell />

          <div className="relative">
            <button
              onClick={toggleDropdown}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                  {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <span className="block text-sm font-medium text-gray-700">My Account</span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
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
      </nav>
    </header>
  );
};
