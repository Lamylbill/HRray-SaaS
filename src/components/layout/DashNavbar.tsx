
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Menu, 
  X,
  Settings,
  LogOut,
  ChevronDown,
  Bell
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
import { getInitials } from '@/utils/formatters';
import { NotificationBell } from '@/components/ui-custom/NotificationBell';
import { DateTimeBar } from '@/components/ui-custom/DateTimeBar';
import { useMobileView } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import NavItem, { getDashboardNavItems } from './NavItems';

export const DashNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobileView();

  // Get dashboard navigation items
  const navItems = getDashboardNavItems();
  
  useEffect(() => {
    // Close mobile menu when route changes
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed z-40 w-full bg-white shadow-sm">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-xl font-bold text-blue-700">HR</span>
            <span className="text-xl font-bold text-gray-700">Flow</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-1">
            <NavigationMenu className="max-w-none">
              <NavigationMenuList className="flex space-x-1">
                {navItems.map((item) => (
                  <NavItem key={item.href} item={item} />
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        )}

        {/* Right side - User Menu or Login button */}
        <div className="flex items-center gap-2">
          {!isMobile && <DateTimeBar />}
          
          {isAuthenticated ? (
            <>
              {/* Notification Bell */}
              <NotificationBell />
              
              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border border-gray-200">
                      <AvatarImage src="" alt={user?.email || ''} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {getInitials(user?.email || '')}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50 bg-white">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link to="/login">
              <Button variant="default">Login</Button>
            </Link>
          )}
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div 
        className={cn(
          "fixed inset-0 z-30 bg-white transform transition-transform duration-300 ease-in-out pt-16",
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-4">
          {isAuthenticated && (
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link 
                  key={item.href}
                  to={item.href} 
                  className="flex items-center p-2 space-x-3 rounded-md hover:bg-gray-100 text-gray-700"
                  onClick={closeMobileMenu}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 my-2 pt-2">
                <Link 
                  to="/settings" 
                  className="flex items-center p-2 space-x-3 rounded-md hover:bg-gray-100 text-gray-700"
                  onClick={closeMobileMenu}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                <button 
                  className="flex items-center w-full p-2 space-x-3 rounded-md hover:bg-gray-100 text-gray-700"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5" />
                  <span>Log out</span>
                </button>
              </div>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
};
