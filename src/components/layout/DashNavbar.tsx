import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui-custom/Button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { getUserAvatar, getUserInitials } from '@/utils/formatters';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { NavItemType, getDashboardNavItems } from './NavItems';
import { NotificationBell } from '@/components/ui-custom/NotificationBell';

export const DashNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  const navItems: NavItemType[] = getDashboardNavItems();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/');
    if (isMobileMenuOpen) closeMobileMenu();
  };

  return (
    <>
      <header className="fixed z-50 w-full bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between" ref={containerRef}>
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 z-50" onClick={handleLogoClick}>
              <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0 h-auto">
                <span className="text-blue-700 font-display font-bold text-[30px]">HR</span>
                <span className="text-orange-500 font-display font-bold text-[30px]">ray</span>
              </Button>
            </Link>
          </div>

          {isAuthenticated && (
            <div className="hidden md:flex items-center space-x-1">
              <NavigationMenu className="max-w-none">
                <NavigationMenuList className="flex space-x-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          'inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                          isActive ? "bg-blue-700 text-white hover:bg-blue-800" : "text-blue-800 hover:bg-blue-100 hover:text-blue-700"
                        )}
                      >
                        {item.icon && <span className="mr-2 h-4 w-4 flex items-center justify-center">{item.icon}</span>}
                        {item.name}
                      </Link>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          )}

          <div className="flex items-center gap-3">
            {isAuthenticated && user ? (
              <>
                <NotificationBell className="h-9 w-9" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center space-x-2 focus:outline-none p-1 rounded-md hover:bg-gray-100">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getUserAvatar(user) || undefined} alt={user.user_metadata?.full_name || user.email || 'User Avatar'} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                          {getUserInitials(user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:block text-left">
                        <span className="block text-sm font-medium text-gray-700">My Account</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-50 bg-white shadow-lg border border-gray-200">
                    <DropdownMenuLabel className="font-medium text-gray-800 px-2 py-1.5">
                      {user.user_metadata?.full_name || user.email || "My Account"}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-red-600 hover:!text-red-700 hover:!bg-red-50 cursor-pointer">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/login">
                <Button variant="default" className="bg-blue-700 hover:bg-blue-800 text-white">Login</Button>
              </Link>
            )}

            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-700"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
  <div
    className="fixed inset-0 bg-black bg-opacity-30 z-50 transition-opacity duration-300"
    onClick={() => setIsMobileMenuOpen(false)}
  />
)}

      <aside
        className={cn(
          'fixed top-0 bottom-0 right-0 w-72 bg-white z-50 shadow-lg transition-transform duration-300 transform md:hidden',
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2" onClick={handleLogoClick}>
              <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0">
                <span className="text-blue-700 font-display font-bold text-[30px]">HR</span>
                <span className="font-display font-bold text-[30px] text-orange-500">ray</span>
              </Button>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-indigo-800">
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={closeMobileMenu}
                className={cn(
                  'flex items-center px-4 py-2 rounded-md text-sm font-medium',
                  location.pathname.startsWith(item.href)
                    ? 'bg-blue-700 text-white'
                    : 'text-indigo-800 hover:bg-indigo-600/10'
                )}
              >
                {item.icon && <span className="mr-3 h-5 w-5">{item.icon}</span>}
                {item.name}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link to="/settings" onClick={closeMobileMenu} className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-indigo-800 hover:bg-indigo-600/10">
                  <Settings className="mr-3 h-5 w-5" />
                  Settings
                </Link>
                <button onClick={() => { handleSignOut(); closeMobileMenu(); }} className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
                  <LogOut className="mr-3 h-5 w-5" />
                  Log out
                </button>
              </>
            )}
          </nav>
        </div>
      </aside>
    </>
  );
};
