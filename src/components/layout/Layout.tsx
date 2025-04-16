
import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashNavbar } from './DashNavbar';

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashNavbar />
      <main className="pt-16 pb-8">
        <div className="container mx-auto px-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
