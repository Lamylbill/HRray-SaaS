import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronRight, Menu, X, LogOut, Settings
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu, NavigationMenuItem,
  NavigationMenuLink, NavigationMenuList
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getNavItems } from './NavItems';
import { cn } from '@/lib/utils';

interface NavbarProps {
  showLogo?: boolean;
}

export const LandNavbar: React.FC<NavbarProps> = ({ showLogo = true }) => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const getUserInitials = () => {
    if (user?.user_metadata?.full_name) {
      const parts = user.user_metadata.full_name.split(' ');
      return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  const getUserAvatar = () => user?.user_metadata?.avatar_url || null;

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setIsCompact(entry.contentRect.width < 880);
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);

      const sections = ['home', 'features', 'pricing', 'contact', 'about'];
      const scrollPos = window.scrollY + 120;
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + el.offsetHeight;
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const publicNavItems = getNavItems();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('home');
  };

  const isSectionActive = (section: string) => activeSection === section.toLowerCase();

  return (
    <header className={cn(
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled ? 'bg-white shadow-sm border-b border-gray-200' : 'bg-white'
    )}>
      <nav className="container mx-auto px-6 py-3" ref={containerRef}>
        <div className="flex items-center justify-between">
          {showLogo && (
            <Link to="/" className="flex items-center gap-2">
              <span className="bg-indigo-600 text-white font-display font-bold px-2 py-1 rounded-md">HR</span>
              <span className="font-display font-bold text-xl text-indigo-800">Flow</span>
            </Link>
          )}

          <div className="hidden md:block">
            <NavigationMenu>
              <NavigationMenuList>
                {publicNavItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <a
                      href={item.href}
                      onClick={(e) => item.name === 'Home' ? handleHomeClick(e) : scrollToSection(e, item.href.slice(1))}
                      className={cn(
                        'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                        isSectionActive(item.name) ?
                          'bg-indigo-600 text-white hover:bg-indigo-700' :
                          'text-indigo-800 hover:bg-indigo-100'
                      )}
                      aria-label={item.name}
                    >
                      {item.icon}
                      {!isCompact && <span className="ml-2">{item.name}</span>}
                    </a>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium text-indigo-800 border-indigo-200 hover:bg-indigo-50">
                    My Account
                    <Avatar className="h-7 w-7 border-2 border-indigo-600/20">
                      {getUserAvatar() ? (
                        <AvatarImage src={getUserAvatar()} alt="avatar" />
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
                    <Link to="/settings" state={{ from: location.pathname }} className="flex w-full items-center text-gray-700 hover:text-indigo-700">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="text-indigo-700 border-indigo-200 hover:bg-indigo-50">Log In</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Sign Up <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-indigo-800">
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
};
