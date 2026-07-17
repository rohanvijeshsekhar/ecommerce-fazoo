'use client';

import React, { ReactNode } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { StoreProvider } from '../contexts/StoreContext';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <AuthProvider>
      <StoreProvider>
        {children}
      </StoreProvider>
    </AuthProvider>
  );
}
