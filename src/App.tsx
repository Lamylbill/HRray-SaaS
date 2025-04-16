
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/AppRoutes';
import { HelmetProvider } from 'react-helmet-async';

function App() {
  return (
    <AuthProvider>
      <HelmetProvider>
        <BrowserRouter>
          <Toaster />
          <AppRoutes />
        </BrowserRouter>
      </HelmetProvider>
    </AuthProvider>
  );
}

export default App;
