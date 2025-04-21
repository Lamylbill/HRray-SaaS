import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Calendar, 
  Shield, 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Download,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui-custom/Button';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DateTimeBar from '@/components/ui-custom/DateTimeBar';
import { NotificationBell } from '@/components/ui-custom/NotificationBell';
import { generateEmployeeTemplate } from '@/utils/excelUtils';

const SidebarNavItem = ({ 
  item, 
  collapsed, 
  isActive 
}: { 
  item: { name: string; path: string; icon: React.ReactNode }; 
  collapsed: boolean; 
  isActive: boolean 
}) => {
  return (
    <Tooltip disableHoverableContent={!collapsed}>
      <TooltipTrigger asChild>
        <Link
          to={item.path}
          className={cn(
            "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors my-1",
            isActive 
              ? "bg-indigo-600 text-white" 
              : "text-indigo-800 hover:bg-indigo-50 hover:text-indigo-700",
            collapsed ? "justify-center" : ""
          )}
        >
          <div className={cn("flex-shrink-0", collapsed ? "" : "mr-3")}>
            {item.icon}
          </div>
          {!collapsed && <span className="truncate text-sm">{item.name}</span>}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" align="center" className={collapsed ? "" : "hidden"}>
        {item.name}
      </TooltipContent>
    </Tooltip>
  );
};

export const DashboardSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty(
        '--sidebar-width', 
        collapsed ? '70px' : '250px'
      );
    }
  }, [collapsed]);

  const navigationItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { name: 'Employees', path: '/employees', icon: <Users className="h-5 w-5" /> },
    { name: 'Payroll', path: '/payroll', icon: <FileText className="h-5 w-5" /> },
    { name: 'Leave', path: '/leave', icon: <Calendar className="h-5 w-5" /> },
    { name: 'Compliance', path: '/compliance', icon: <Shield className="h-5 w-5" /> },
  ];

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

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const downloadCSVTemplate = () => {
    generateEmployeeTemplate();
  };

  const navigateToSettings = () => {
    navigate('/settings', { state: { from: location.pathname } });
  };

  const navigateToLanding = () => {
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'h-screen fixed left-0 top-0 z-30 flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-sm',
        collapsed ? 'w-[70px]' : 'w-[250px]'
      )}
    >
      <div className={cn(
        'h-16 flex items-center px-4 border-b border-gray-200',
        collapsed ? 'justify-center' : 'justify-between'
      )}>
        {!collapsed && (
          <div
            onClick={navigateToLanding}
            className="flex items-center gap-1 cursor-pointer"
          >
            <span className="bg-indigo-600 text-white font-display font-bold px-1 py-0.5 rounded text-xs">HR</span>
            <span className="font-display font-bold text-sm text-indigo-800">ray</span>
          </div>
        )}
        {collapsed && (
          <div
            onClick={navigateToLanding}
            className="flex items-center justify-center cursor-pointer"
          >
            <span className="bg-indigo-600 text-white font-display font-bold px-1 py-0.5 rounded text-xs">HR</span>
          </div>
        )}
        
        {!collapsed && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleCollapse} 
            className="text-white bg-indigo-600 hover:bg-indigo-700 h-7 w-7 rounded-md"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="text-white bg-indigo-600 hover:bg-indigo-700 h-7 w-7 rounded-md mx-auto mt-4"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}

      <div className="border-b border-gray-200">
        <DateTimeBar collapsed={collapsed} />
      </div>

      <div className={cn(
        'p-4 border-b border-gray-200 flex items-center',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div 
          className="cursor-pointer" 
          onClick={navigateToSettings}
          aria-label="Go to settings"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className={cn("bg-indigo-600", collapsed ? "h-10 w-10" : "h-10 w-10")}>
                {avatarImageUrl ? (
                  <AvatarImage 
                    src={avatarImageUrl} 
                    alt="Profile" 
                    className="object-cover w-full h-full rounded-full"
                  />
                ) : (
                  <AvatarFallback className="text-white font-medium">
                    {getUserInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>Go to Settings</TooltipContent>
          </Tooltip>
        </div>
        
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-indigo-800 truncate">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-xs text-indigo-500 truncate">
              {user?.email || 'user@example.com'}
            </p>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className={cn("space-y-1 px-2", collapsed ? "items-center" : "")}>
          <TooltipProvider delayDuration={0}>
            {navigationItems.map((item) => (
              <SidebarNavItem 
                key={item.path} 
                item={item} 
                collapsed={collapsed} 
                isActive={location.pathname === item.path}
              />
            ))}
            
            <SidebarNavItem 
              key="/settings"
              item={{ 
                name: 'Settings', 
                path: '/settings', 
                icon: <Settings className="h-5 w-5" /> 
              }} 
              collapsed={collapsed} 
              isActive={location.pathname === '/settings'}
            />
          </TooltipProvider>

          <div className={cn(
            "my-2 px-3 py-2",
            collapsed ? "flex justify-center" : "flex items-center justify-between"
          )}>
            {!collapsed && <span className="text-xs font-medium text-indigo-800">Notifications</span>}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(collapsed ? "" : "ml-auto")}>
                  <NotificationBell className="text-indigo-700 hover:text-indigo-500" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Notifications
              </TooltipContent>
            </Tooltip>
          </div>

          {location.pathname === '/employees' && !collapsed && (
            <div className="mt-4 px-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs flex items-center justify-start text-indigo-800 border-indigo-200"
                onClick={downloadCSVTemplate}
              >
                <Download className="h-3.5 w-3.5 mr-2" />
                <span>Download Template</span>
              </Button>
            </div>
          )}
          
          {location.pathname === '/employees' && collapsed && (
            <Tooltip disableHoverableContent={!collapsed}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-full mt-4 flex justify-center text-indigo-800 border-indigo-200"
                  onClick={downloadCSVTemplate}
                >
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" align="center">
                Download Employee Template
              </TooltipContent>
            </Tooltip>
          )}
        </nav>
      </div>

      <div className={cn(
        "p-4 border-t border-gray-200",
        collapsed ? "flex justify-center" : ""
      )}>
        <TooltipProvider delayDuration={0}>
          <Tooltip disableHoverableContent={!collapsed}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "text-red-500 w-full flex items-center border-red-200 text-xs",
                  collapsed ? "justify-center px-2" : "justify-start"
                )}
                onClick={() => logout()}
              >
                <LogOut className={cn("h-3.5 w-3.5", !collapsed && "mr-2")} />
                {!collapsed && <span>Logout</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className={collapsed ? "" : "hidden"}>
              Logout
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </aside>
  );
};

export const useSidebarWidth = () => {
  const [collapsed, setCollapsed] = useState(false);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setCollapsed(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return collapsed ? '70px' : '250px';
};
