import React, { Suspense, useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

import Index from "@/pages/Index";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import Dashboard from "@/pages/Dashboard";
import EmployeesPage from "@/pages/EmployeesPage";
import Leave from "@/pages/Leave";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

import { DashNavbar } from "@/components/layout/DashNavbar";
import { LandNavbar } from "@/components/layout/LandNavbar";
import { LoadingSpinner } from "@/components/ui-custom/LoadingSpinner";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();  // Ensure this is properly checking JWT
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login", { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};

  return isAuthenticated ? <>{children}</> : null; // Protect the route, show nothing if unauthenticated
};

// Dashboard Layout
const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <DashNavbar />
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 pt-20">
          <Suspense fallback={
            <div className="flex items-center justify-center h-[calc(100vh-128px)]">
              <LoadingSpinner size="lg" />
            </div>
          }>
            {children}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// Settings Wrapper
const SettingsWrapper = () => {
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  return <Settings returnTo={from} />;
};

// Routes Setup
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <>
          <LandNavbar showLogo={true} />
          <Index />
        </>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Dashboard />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/employees" element={
        <ProtectedRoute>
          <DashboardLayout>
            <EmployeesPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/leave" element={
        <ProtectedRoute>
          <DashboardLayout>
            <Leave />
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/payroll" element={
        <ProtectedRoute>
          <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Payroll</h1>
            <p>Manage employee compensation and payments.</p>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/activity" element={
        <ProtectedRoute>
          <DashboardLayout>
            <h1 className="text-3xl font-bold mb-6">Activity Log</h1>
            <p>Track all activities and changes in the system.</p>
          </DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <SettingsWrapper />
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
