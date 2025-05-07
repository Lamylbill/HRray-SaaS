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
      
      const pricingTableEl = document.getElementById('pricing-table');
      const pricingEl = document.getElementById('pricing');
      
      if ((pricingTableEl && scrollPos >= pricingTableEl.offsetTop && scrollPos < pricingTableEl.offsetTop + pricingTableEl.offsetHeight) || 
          (pricingEl && scrollPos >= pricingEl.offsetTop && scrollPos < pricingEl.offsetTop + pricingEl.offsetHeight)) {
        setActiveSection('pricing');
      } else {
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
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const publicNavItems = getNavItems();

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    let sectionId;

    if (id === "/#pricing-table" || id === "#pricing-table" || id === "pricing-table") {
      sectionId = "pricing-table";
    } else if (id === '/#pricing' || id === '#pricing' || id === 'pricing') {
      sectionId = 'pricing-comparison'; 
    } else if (id.startsWith('/#')) {
      sectionId = id.substring(2);
    } else if (id.startsWith('#')) {
      sectionId = id.substring(1);
    } else if (id === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setActiveSection('home');
      setIsMobileMenuOpen(false);
      return;
    } else if (id.startsWith('/')) {
      navigate(id);
      setIsMobileMenuOpen(false);
      return;
    } else {
      sectionId = id;
    }

    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({ top: element.offsetTop - 100, behavior: 'smooth' });
      setActiveSection(sectionId);
      setIsMobileMenuOpen(false);
    } else if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
          window.scrollTo({ top: targetElement.offsetTop - 100, behavior: 'smooth' });
          setActiveSection(sectionId);
        }
      }, 100);
    }
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSection('home');
    setIsMobileMenuOpen(false);
  };

  const isSectionActive = (section: string) => {
    if (section.toLowerCase() === 'pricing') {
      return activeSection === 'pricing' || activeSection === 'pricing-table';
    }
    return activeSection === section.toLowerCase();
  };

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-white shadow-sm border-b border-gray-200' : 'bg-white'
      )}
    >
      <nav className="container mx-auto px-6 py-3 flex items-center justify-between" ref={containerRef}>
        <Link to="/" className="flex items-center gap-2 z-50" onClick={handleHomeClick}>
          <Button variant="ghost" className="gap-0 text-inherit text-left normal-case p-0">
            <span className="text-blue-700 font-display font-bold text-[30px]">HR</span>
            <span className="font-display font-bold text-[30px] text-orange-500">ray</span>
          </Button>
        </Link>

        <div className={cn('hidden md:flex', isCompact ? 'justify-center w-full' : 'ml-10')}>
          <NavigationMenu>
            <NavigationMenuList>
              {publicNavItems.map((item) => (
                <NavigationMenuItem key={item.name}>
                  <a
                    href={item.href}
                    onClick={(e) =>
                      item.name === 'Home' ? handleHomeClick(e) : scrollToSection(e, item.href)
                    }
                    className={cn(
                      'inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
                      isSectionActive(item.name)
                        ? 'bg-blue-700 text-white hover:bg-blue-800'
                        : 'text-blue-800 hover:bg-blue-50 hover:text-blue-800'
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

        <div className="hidden md:flex items-center gap-2 hide_mobile">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center space-x-2 focus:outline-none">
                  <Avatar className="h-8 w-8">
                    {getUserAvatar() ? (
                      <AvatarImage src={getUserAvatar()} alt="avatar" />
                    ) : (
                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                        {getUserInitials()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <span className="block text-sm font-medium text-gray-700">My Account</span>
                  </div>
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
                <Button variant="outline" size="sm" className="text-indigo-700 border-indigo-200 hover:bg-indigo-50">
                  Log In
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
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
          className="md:hidden text-indigo-800 z-50"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity duration-300" onClick={() => setIsMobileMenuOpen(false)} />
        )}

        <aside
          className={cn(
            'fixed top-0 bottom-0 right-0 w-72 bg-white z-50 shadow-lg transition-transform duration-300 transform',
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          )}
        >
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <Link to="/" className="flex items-center gap-2" onClick={handleHomeClick}>
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
              {publicNavItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={(e) => {
                    item.name === 'Home' ? handleHomeClick(e) : scrollToSection(e, item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={cn(
                    'flex items-center px-4 py-2 rounded-md text-sm font-medium',
                    isSectionActive(item.name)
                      ? 'bg-blue-700 text-white'
                      : 'text-indigo-800 hover:bg-indigo-600/10'
                  )}
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </Link>
              ))}

              {isAuthenticated ? (
                <>
                  <Link to="/settings" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-indigo-800 hover:bg-indigo-600/10">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </Link>
                  <button onClick={() => { logout(); setIsMobileMenuOpen(false); }} className="flex items-center px-4 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
                    <LogOut className="mr-3 h-5 w-5" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-indigo-800 hover:bg-indigo-50 rounded-md">
                    Log In
                  </Link>
                  <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-2 text-indigo-800 hover:bg-indigo-50 rounded-md">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </aside>
      </nav>
    </header>
  );
};