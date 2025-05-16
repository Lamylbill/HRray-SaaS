
import React, { useState, useEffect, useCallback } from 'react'; // Added useCallback
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
import { Button } from '@/components/ui-custom/Button'; // Ensure this Button matches LandNavbar's if different
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
// IMPORTANT: Ensure these functions are correctly defined in your formatters.ts
// and that they correctly access user.user_metadata
import { getUserAvatar, getUserInitials } from '@/utils/formatters';
// NotificationBell was imported but not used in your provided DashNavbar.
// If you intend to use it, integrate it where the <Bell> icon is.
// import { NotificationBell } from '@/components/ui-custom/NotificationBell';
import { useIsMobile } from '@/hooks/use-mobile'; // Assuming this hook is correctly defined
import { cn } from '@/lib/utils';
// Import the getDashboardNavItems function and NavItemType from NavItems
import { NavItemType, getDashboardNavItems } from './NavItems';
import { NotificationBell } from '@/components/ui-custom/NotificationBell'; // ⬅️ make sure this path is correct


export const DashNavbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  const navItems: NavItemType[] = getDashboardNavItems();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/'); // Redirect to landing/home after sign out
  };

  // Navigate to landing page on logo click
  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/');
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  };

  return (
    <header className="fixed z-40 w-full bg-white shadow-sm border-b border-gray-200"> {/* Added border to match LandNavbar scrolled */}
      {/* Container matched to LandNavbar's padding and no fixed height */}
      <div className="container mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo - Styled like LandNavbar */}
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2 z-50" onClick={handleLogoClick}>
            <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0 h-auto"> {/* h-auto for natural height */}
              <span className="text-blue-700 font-display font-bold text-[30px]">HR</span>
              <span className="text-orange-500 font-display font-bold text-[30px]">ray</span>
            </Button>
          </Link>
        </div>

        {/* Desktop Navigation */}
        {isAuthenticated && (
          <div className="hidden md:flex items-center space-x-1"> {/* Reduced space-x if nav items are many */}
            <NavigationMenu className="max-w-none">
              <NavigationMenuList className="flex space-x-1"> {/* Reduced space for tighter pills */}
                {navItems.map((item) => {
                  // Use startsWith for active state if item.href is a base path
                  const isActive = location.pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        'inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200', // Adjusted padding
                        isActive
                          ? "bg-blue-700 text-white hover:bg-blue-800" // Matched LandNavbar active
                          : "text-blue-800 hover:bg-blue-100 hover:text-blue-700" // Matched LandNavbar inactive/hover
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

        {/* Right side - User Menu or Login button */}
        <div className="flex items-center gap-3"> {/* Consistent gap */}
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
<NotificationBell className="h-9 w-9" />

              {/* User Menu - Styled like LandNavbar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 focus:outline-none p-1 rounded-md hover:bg-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={getUserAvatar(user) || undefined} alt={user.user_metadata?.full_name || user.email || 'User Avatar'} />
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {getUserInitials(user)}
                      </AvatarFallback>
                    </Avatar>
                    {/* Text "My Account" from LandNavbar */}
                    <div className="hidden md:block text-left">
                      <span className="block text-sm font-medium text-gray-700">My Account</span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 z-50 bg-white shadow-lg border border-gray-200">
                  <DropdownMenuLabel className="font-medium text-gray-800 px-2 py-1.5">
                     {/* Display full name or email */}
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
              {/* Matching LandNavbar's default login button style */}
              <Button variant="default" className="bg-blue-700 hover:bg-blue-800 text-white">Login</Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-700 hover:text-blue-700" // Consistent hover
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-white transform transition-transform duration-300 ease-in-out pt-16 md:hidden", // Only for md:hidden
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="container mx-auto px-4 py-4 space-y-4">
          {isAuthenticated && navItems && (
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                      "flex items-center p-3 space-x-3 rounded-lg text-base", // Adjusted padding & text size
                      location.pathname.startsWith(item.href)
                        ? "bg-blue-700 text-white" // Active style matching desktop
                        : "text-gray-700 hover:bg-blue-100 hover:text-blue-700" // Inactive style
                  )}
                  onClick={closeMobileMenu}
                >
                  {item.icon && <span className="h-5 w-5 flex items-center justify-center">{item.icon}</span>}
                  <span>{item.name}</span>
                </Link>
              ))}
              <div className="border-t border-gray-200 my-2 pt-2">
                <Link
                  to="/settings"
                  className="flex items-center p-3 space-x-3 rounded-lg text-gray-700 hover:bg-blue-100 hover:text-blue-700"
                  onClick={closeMobileMenu}
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                <button
                  className="flex items-center w-full p-3 space-x-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700" // Consistent styling
                  onClick={() => { handleSignOut(); closeMobileMenu(); }} // Ensure menu closes on sign out
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
