import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText,
  Calendar, Shield, Bell, LogOut, Settings, Menu, X, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui-custom/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const DashNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Employees', path: '/employees', icon: <Users className="h-5 w-5" /> },
    { name: 'Payroll', path: '/payroll', icon: <FileText className="h-5 w-5" /> },
    { name: 'Leave', path: '/leave', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Compliance', path: '/compliance', icon: <Shield className="h-5 w-5" /> },
  ];

  const mobileMenuItems = [
    { name: 'Home', path: '/', icon: <Home className="h-5 w-5" /> },
    ...navigationItems,
    { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
    { name: 'Log out', path: '/logout', icon: <LogOut className="h-5 w-5" />, onClick: () => logout() },
  ];

  const logo = (
    <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0">
      <span className="text-blue-700 font-display font-bold text-[30px]">HR</span>
      <span className="font-display font-bold text-[30px] text-orange-500">ray</span>
    </Button>
  );

  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const metadata = user.user_metadata || {};
    if (metadata.full_name) {
      return metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  const avatarImageUrl = user?.user_metadata?.avatar_url || null;

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setIsCompact(entry.contentRect.width < 880);
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };

    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50" ref={containerRef}>
      <nav className="container mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/" replace className="flex items-center gap-2 z-50">
          {logo}
        </Link>

        <div className="hidden md:flex flex-1 justify-center">
          <div className={cn("flex space-x-1", isCompact && "justify-center")}>
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                  location.pathname === item.path
                    ? "bg-blue-700 text-white hover:bg-blue-800"
                    : "text-indigo-800 hover:bg-indigo-100"
                )}
              >
                {item.icon}
                {!isCompact && <span className="ml-2">{item.name}</span>}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button className="text-indigo-800 hover:text-indigo-800 hover:bg-indigo-50 p-2 rounded-full hidden md:inline">
            <Bell className="h-5 w-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium text-indigo-800 border-indigo-200 hover:bg-indigo-50">
                My Account
                <Avatar className="h-7 w-7 border-2 border-indigo-600/20">
                  {avatarImageUrl ? (
                    <AvatarImage src={avatarImageUrl} alt="Profile" className="object-cover w-full h-full rounded-full" />
                  ) : (
                    <AvatarFallback className="bg-indigo-600 text-white text-sm font-medium">
                      {getUserInitials()}
                    </AvatarFallback>
                  )}
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white shadow-lg border border-gray-200 z-50">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Link
                  to="/settings"
                  className="flex w-full items-center text-gray-700 hover:text-indigo-700"
                  state={{ from: location.pathname }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => logout()}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="text-indigo-800"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>

      <div
        className={cn(
          "fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity duration-300 md:hidden",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        ref={mobileMenuRef}
        className={cn(
          "fixed top-0 bottom-0 right-0 w-72 bg-white shadow-lg z-50 transition-transform duration-300 md:hidden",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2">
              {logo}
            </Link>
          </div>
          <nav className="flex flex-col space-y-4">
            {mobileMenuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (item.onClick) item.onClick();
                }}
                className={cn(
                  "flex items-center px-4 py-2 rounded-md text-sm font-medium",
                  item.name === 'Log out'
                    ? "text-red-600 hover:bg-red-50"
                    : location.pathname === item.path
                    ? "bg-blue-700 text-white"
                    : "text-indigo-800 hover:bg-indigo-100"
                )}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </aside>
    </header>
  );
};
