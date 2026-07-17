import React from 'react';
import StoreShell from './components/StoreShell';

interface StoreLayoutProps {
  children: React.ReactNode;
}

export default function StoreLayout({ children }: StoreLayoutProps) {
  return (
    <StoreShell>
      {children}
    </StoreShell>
  );
}
