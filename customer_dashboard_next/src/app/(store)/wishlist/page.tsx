'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import FlipkartWishlist from '@/components/store/FlipkartWishlist';

export default function WishlistPage() {
  const router = useRouter();
  const store = useStore();

  const handleProductClick = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const handleViewChange = (view: string) => {
    if (view === 'home') router.push('/');
    else if (view === 'portfolio') router.push('/products');
    else if (view === 'cart') router.push('/cart');
    else if (view === 'checkout') router.push('/checkout');
    else if (view === 'my-orders') {
      store.setDashboardSection('orders');
      router.push('/profile');
    }
  };

  return (
    <FlipkartWishlist
      wishlistItems={store.wishlistItems}
      setWishlistItems={store.setWishlistItems}
      setCartItems={store.setCartItems}
      setCurrentView={handleViewChange}
      onProductClick={handleProductClick}
      showToast={store.showToast}
      onOpenLoginModal={store.openLoginModal}
    />
  );
}
