'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import ComboDetailPage from '@/components/store/ComboDetailPage';

interface ComboDetailClientProps {
  slug: string;
}

export default function ComboDetailClient({ slug }: ComboDetailClientProps) {
  const router = useRouter();
  const store = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleProductClick = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
  };

  const handleViewChange = (view: string) => {
    if (view === 'home') router.push('/');
    else if (view === 'combo-deals') router.push('/combo-deals');
  };

  return (
    <ComboDetailPage
      activeComboId={slug}
      setCurrentView={handleViewChange}
      setActiveProductId={handleProductClick}
      setCartItems={store.setCartItems}
      setIsCartOpen={setIsCartOpen}
      wishlistItems={store.wishlistItems}
      setWishlistItems={store.setWishlistItems}
      showToast={store.showToast}
      onOpenLoginModal={store.openLoginModal}
      onProductClick={handleProductClick}
      onBuyNowDirect={(item) => {
        store.handleBuyNowDirect(item);
        router.push('/checkout');
      }}
    />
  );
}
