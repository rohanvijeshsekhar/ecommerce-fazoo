'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import ComboListingPage from '@/components/store/ComboListingPage';

export default function ComboListingClient() {
  const router = useRouter();
  const store = useStore();

  const handleComboClick = (slug: string) => {
    router.push(`/combo-deals/${slug}`);
  };

  const handleViewChange = (view: string) => {
    if (view === 'home') router.push('/');
  };

  return (
    <ComboListingPage
      setCurrentView={handleViewChange}
      setActiveComboId={handleComboClick}
      setCartItems={store.setCartItems}
      wishlistItems={store.wishlistItems}
      setWishlistItems={store.setWishlistItems}
      showToast={store.showToast}
      onOpenLoginModal={store.openLoginModal}
    />
  );
}
