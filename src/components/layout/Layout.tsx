
import React from 'react'; // Keep this import
import { Outlet, useLocation } from 'react-router-dom';
import { DashNavbar } from './DashNavbar';

const Layout: React.FC = () => {
  const location = useLocation();
  const isLeavePage = location.pathname === '/leave';

  return (
    <div
      className={`min-h-screen bg-gray-50 ${
        isLeavePage ? '' : 'pt-20 pb-12'
      }`}
    >
      <DashNavbar />
      <main>
          <div className="container mx-auto px-4">
            <Outlet />
          </div>

      </main>
    </div>
  );
};

export default Layout;
