
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, BarChart, FileText, Phone, Info, Calendar, Users, Briefcase, ShieldCheck, Layers, DollarSign, MessageCircle } from 'lucide-react';
import {
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

// Export the navigation items for reuse
export const getNavItems = () => {
  return [
    {
      name: 'Home',
      href: '/',
      icon: <Home className="h-5 w-5" />,
    },
    {
      name: 'Features',
      href: '/#features',
      icon: <Layers className="h-5 w-5" />,
    },
    {
      name: 'Pricing',
      href: '/#pricing',
      icon: <DollarSign className="h-5 w-5" />,
    },
    {
      name: 'Blog',
      href: '/blog',
      icon: <FileText className="h-5 w-5" />,
    },
    {
      name: 'Contact',
      href: '/#contact',
      icon: <MessageCircle className="h-5 w-5" />,
    },
    {
      name: 'About',
      href: '/#about',
      icon: <Info className="h-5 w-5" />,
    },
  ];
};

// Ensure feature items have consistent typing for icon as ReactNode
export const getFeaturesItems = () => [
  { 
    title: "Employee Management", 
    description: "Centralized database for employee records",
    icon: <Users className="h-5 w-5 text-hrflow-blue" />,
    href: "#features-employee"
  },
  { 
    title: "Payroll & Compliance", 
    description: "Automated calculations with Singapore compliance",
    icon: <Calendar className="h-5 w-5 text-hrflow-blue" />,
    href: "#features-payroll"
  },
  { 
    title: "Leave Management", 
    description: "Streamlined approval workflows",
    icon: <Calendar className="h-5 w-5 text-hrflow-blue" />,
    href: "#features-leave"
  },
  { 
    title: "Performance Tracking", 
    description: "Set and track performance goals",
    icon: <BarChart className="h-5 w-5 text-hrflow-blue" />,
    href: "#features-performance"
  },
  { 
    title: "Recruitment & Onboarding", 
    description: "AI-powered job matching with automated document collection",
    icon: <Briefcase className="h-5 w-5 text-hrflow-blue" />,
    href: "#features-recruitment"
  },
  { 
    title: "Compliance & Security", 
    description: "Meet regulatory requirements with secure document storage",
    icon: <ShieldCheck className="h-5 w-5 text-hrflow-blue" />,
    href: "#features-compliance"
  },
];

// Simple navigation item component
export const NavItem = ({ 
  item, 
  onClick 
}: { 
  item: { name: string; href: string; icon: React.ReactNode }; 
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void 
}) => {
  const navigate = useNavigate();
  
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    if (href.startsWith('/#')) {
      // Handle hash navigation on home page
      const targetId = href.substring(2); // Remove the /# prefix
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100, // Offset for header
          behavior: 'smooth'
        });
      } else {
        // If element doesn't exist on current page, navigate to home with hash
        navigate('/');
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            window.scrollTo({
              top: element.offsetTop - 100,
              behavior: 'smooth'
            });
          }
        }, 100);
      }
    } else if (href === '/') {
      // Handle home navigation
      navigate('/');
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else if (href.startsWith('#')) {
      // Handle hash navigation on current page
      const targetId = href.substring(1);
      const targetElement = document.getElementById(targetId);
      
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: 'smooth'
        });
      }
    } else {
      // For regular routes like /blog, /dashboard, etc.
      navigate(href);
    }
    
    // Call the additional onClick handler if provided
    if (onClick) {
      onClick(e, href);
    }
  };
  
  return (
    <NavigationMenuItem>
      <Link 
        to={item.href} 
        className={navigationMenuTriggerStyle()}
        onClick={(e) => handleClick(e, item.href)}
      >
        {item.icon}
        <span className="font-medium">{item.name}</span>
      </Link>
    </NavigationMenuItem>
  );
};

export default NavItem;
