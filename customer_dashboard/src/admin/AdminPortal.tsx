import React from 'react';

import { useAuth } from '../hooks/useAuth';
import { AdminProvider } from './contexts/AdminContext';
import { BreadcrumbProvider } from './contexts/BreadcrumbContext';
import AdminRoutes from './AdminRoutes';
import AdminLogin from './pages/AdminLogin';
import LoadingOverlay from './components/LoadingOverlay';

// ─────────────────────────────────────────────────────────────────────────────
// AdminPortal — Root shell
// 1. isLoading → spinner
// 2. Not authenticated → AdminLogin
// 3. Authenticated but not is_staff → Access denied (handled inside AdminLogin)
// 4. Authenticated + is_staff → AdminRoutes (wrapped in providers)
// ─────────────────────────────────────────────────────────────────────────────

const AdminPortal: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingOverlay message="Initialising FAAZO Admin…" />;
  }

  // Not logged in → go to admin login
  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  // Logged in but not admin role → show access denied (AdminLogin renders it)
  if (user?.role !== 'admin') {
    return <AdminLogin />;
  }

  // Fully authorised → render the admin portal
  return (
    <AdminProvider>
      <BreadcrumbProvider>
        <AdminRoutes />
      </BreadcrumbProvider>
    </AdminProvider>
  );
};

export default AdminPortal;
