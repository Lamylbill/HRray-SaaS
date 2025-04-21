import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashNavbar } from './DashNavbar';

const Layout: React.FC = () => {
  const location = useLocation();
  const isLeavePage = location.pathname === '/leave';

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col`}>
      <DashNavbar />
      <main className="flex-grow">
        <div
          className={`container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl ${
            isLeavePage ? '' : 'pt-20 pb-12'
          }`}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
