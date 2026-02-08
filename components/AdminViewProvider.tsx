"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AdminViewContextType {
  isAdmin: boolean;
  adminViewEnabled: boolean;
  toggleAdminView: () => void;
}

const AdminViewContext = createContext<AdminViewContextType>({
  isAdmin: false,
  adminViewEnabled: false,
  toggleAdminView: () => {},
});

export function useAdminView() {
  return useContext(AdminViewContext);
}

interface AdminViewProviderProps {
  children: ReactNode;
  isUserAdmin?: boolean;
}

export function AdminViewProvider({ children, isUserAdmin = false }: AdminViewProviderProps) {
  const [isAdmin] = useState(isUserAdmin);
  const [adminViewEnabled, setAdminViewEnabled] = useState(false);

  // Load admin view state from localStorage on mount
  useEffect(() => {
    if (isAdmin) {
      const saved = localStorage.getItem('adminViewEnabled');
      if (saved === 'true') {
        setAdminViewEnabled(true);
      }
    }
  }, [isAdmin]);

  const toggleAdminView = () => {
    if (!isAdmin) return;
    
    const newState = !adminViewEnabled;
    setAdminViewEnabled(newState);
    localStorage.setItem('adminViewEnabled', String(newState));
  };

  return (
    <AdminViewContext.Provider value={{ isAdmin, adminViewEnabled, toggleAdminView }}>
      {children}
    </AdminViewContext.Provider>
  );
}
