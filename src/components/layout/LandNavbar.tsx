import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronDown, Menu, X, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { useAuth } from '@/context/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu, NavigationMenuItem, NavigationMenuList
} from '@/components/ui/navigation-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface NavbarProps {
  showLogo?: boolean;
}

const sectionMap = [
  { id: 'home', label: 'Home' },
  { id: 'features', label: 'Core Features' },
  { id: 'why-hrray', label: 'Why HRray?' },
  { id: 'roadmap', label: 'Product Roadmap' },
  { id: 'get-started', label: 'Get Started' },
  { id: 'blog', label: 'Blog', type: 'route' },
  { id: 'about', label: 'About' },
];

export const LandNavbar: React.FC<NavbarProps> = ({ showLogo = true }) => {
  const { isAuthenticated, user, logout } = useAuth();
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
      const scrollPos = window.scrollY + 120;
      for (const section of sectionMap) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const bottom = top + Math.max(el.offsetHeight, window.innerHeight / 2);
          if (scrollPos >= top && scrollPos < bottom) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop - 100, behavior: 'smooth' });
      setActiveSection(id);
      setIsMobileMenuOpen(false);
    } else if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const delayedEl = document.getElementById(id);
        if (delayedEl) {
          window.scrollTo({ top: delayedEl.offsetTop - 100, behavior: 'smooth' });
          setActiveSection(id);
        }
      }, 500);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <nav className="container mx-auto px-6 py-2.5 flex items-center justify-between min-h-[60px]" ref={containerRef}>
        <Link to="/" className="flex items-center gap-2 z-50" onClick={(e) => scrollToSection(e, 'home')}>
          <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0 h-auto">
            <span className="text-blue-800 font-display font-bold text-[30px] leading-none">HR</span>
            <span className="text-orange-500 font-display font-bold text-[30px] leading-none">ray</span>
          </Button>
        </Link>

        <div className={cn('hidden md:flex', isCompact ? 'justify-center w-full' : 'ml-10')}>
          <NavigationMenu>
            <NavigationMenuList>
              {sectionMap.map((item) => (
                <NavigationMenuItem key={item.id}>
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      if (item.type === 'route') {
                        e.preventDefault();
                        navigate(`/${item.id}`);
                        setIsMobileMenuOpen(false);
                      } else {
                        scrollToSection(e, item.id);
                      }
                    }}
                    
                    className={cn(
                      'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                      activeSection === item.id
                        ? 'bg-blue-800 text-white hover:bg-blue-800'
                        : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
                    )}
                  >
                    {item.label}
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
                <button className="flex items-center gap-2 focus:outline-none rounded-md hover:bg-gray-100 px-2">
                  <Avatar className="h-8 w-8">
                    {getUserAvatar() ? (
                      <AvatarImage src={getUserAvatar()} alt="avatar" />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span className="text-sm font-medium text-gray-700 leading-none">My Account</span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
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
                <Button variant="outline" size="sm" className="text-blue-800 border-blue-300 hover:bg-blue-50">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-blue-800 hover:bg-blue-900 text-white">
                  Sign Up <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden text-blue-800 z-50"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </nav>

      {isMobileMenuOpen && (
        <aside className="fixed top-0 bottom-0 right-0 w-72 bg-white z-50 shadow-lg transition-transform duration-300 transform translate-x-0 md:hidden">
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2" onClick={(e) => scrollToSection(e, 'home')}>
                <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0 h-auto">
                  <span className="text-blue-800 font-display font-bold text-[30px]">HR</span>
                  <span className="text-orange-500 font-display font-bold text-[30px]">ray</span>
                </Button>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)} className="text-blue-800">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex flex-col space-y-4">
              {sectionMap.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    if (item.type === 'route') {
                      e.preventDefault();
                      navigate(`/${item.id}`);
                      setIsMobileMenuOpen(false);
                    } else {
                      scrollToSection(e, item.id);
                    }
                  }}
                  
                  className={cn(
                    'flex items-center px-4 py-2 rounded-md text-sm font-medium',
                    activeSection === item.id
                      ? 'bg-blue-700 text-white'
                      : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
                  )}
                >
                  {item.label}
                </a>
              ))}
              {isAuthenticated && (
                <>
                  <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-blue-800 hover:bg-blue-50">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="mr-3 h-5 w-5" />
                    Log out
                  </button>
                </>
              )}
            </nav>
          </div>
        </aside>
      )}
    </header>
  );
};

export default LandNavbar;
