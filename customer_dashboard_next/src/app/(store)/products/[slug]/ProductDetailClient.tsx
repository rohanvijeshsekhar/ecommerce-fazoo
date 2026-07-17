'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import ProductDetailPage from '@/components/store/ProductDetailPage';

interface ProductDetailClientProps {
  slug: string;
}

export default function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const router = useRouter();
  const store = useStore();
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleProductClick = (productSlug: string) => {
    router.push(`/products/${productSlug}`);
  };

  return (
    <ProductDetailPage
      activeProductId={slug}
      setCartItems={store.setCartItems}
      setIsCartOpen={setIsCartOpen}
      onBackToHome={handleBackToHome}
      onProductClick={handleProductClick}
      onBuyNowDirect={(item) => {
        store.handleBuyNowDirect(item);
        router.push('/checkout');
      }}
      showToast={store.showToast}
      wishlistItems={store.wishlistItems}
      setWishlistItems={store.setWishlistItems}
      onOpenLoginModal={store.openLoginModal}
    />
  );
}
