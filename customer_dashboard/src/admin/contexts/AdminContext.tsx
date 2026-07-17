import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AdminRole, AdminPermission, AdminSection, ToastMessage } from '../types/admin';
import { ROLE_PERMISSIONS } from '../types/admin';

// ─────────────────────────────────────────────────────────────────────────────
// Admin Context
// ─────────────────────────────────────────────────────────────────────────────

interface AdminContextType {
  // Role & permissions
  adminRole: AdminRole;
  hasPermission: (permission: AdminPermission) => boolean;

  // Navigation
  activeSection: AdminSection;
  setActiveSection: (section: AdminSection) => void;

  // Sidebar
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Mobile sidebar overlay
  isMobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;

  // Toast system
  toasts: ToastMessage[];
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;

  // Global search
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Notification badge count
  unreadNotifCount: number;
  setUnreadNotifCount: (n: number) => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

interface AdminProviderProps {
  children: ReactNode;
  initialRole?: AdminRole;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({
  children,
  initialRole = 'administrator',
}) => {
  const [adminRole] = useState<AdminRole>(initialRole);
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifCount, setUnreadNotifCount] = useState(2);

  const hasPermission = useCallback(
    (permission: AdminPermission): boolean => {
      // Phase 5A: role-based check (always true for administrator)
      return ROLE_PERMISSIONS[adminRole]?.includes(permission) ?? false;
    },
    [adminRole],
  );

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const full: ToastMessage = { ...toast, id, duration: toast.duration ?? 4000 };
    setToasts((prev) => [...prev, full]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, full.duration);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <AdminContext.Provider
      value={{
        adminRole,
        hasPermission,
        activeSection,
        setActiveSection,
        isSidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        isMobileSidebarOpen,
        setMobileSidebarOpen,
        toasts,
        showToast,
        dismissToast,
        isSearchOpen,
        setSearchOpen,
        searchQuery,
        setSearchQuery,
        unreadNotifCount,
        setUnreadNotifCount,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export const useAdmin = (): AdminContextType => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside <AdminProvider>');
  return ctx;
};
