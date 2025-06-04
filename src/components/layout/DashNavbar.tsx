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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-6 py-2.5 flex items-center justify-between min-h-[60px]" ref={containerRef}>
        <Link to="/" className="flex items-center gap-2 z-50" onClick={handleLogoClick}>
          <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0 h-auto">
            <span className="text-blue-800 font-display font-bold text-[30px] leading-none">HR</span>
            <span className="text-orange-500 font-display font-bold text-[30px] leading-none">ray</span>
          </Button>
        </Link>

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
                        'inline-flex items-center justify-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                        isActive ? "bg-blue-800 text-white hover:bg-blue-800" : "text-blue-800 hover:bg-blue-50 hover:text-blue-800"
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
              <NotificationBell className="h-6 w-6" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none rounded-md hover:bg-gray-100 px-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserAvatar(user) || undefined} alt={user.user_metadata?.full_name || user.email || 'User Avatar'} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:block text-sm font-medium text-gray-700 leading-none">My Account</span>
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
  );
};

export default DashNavbar;
