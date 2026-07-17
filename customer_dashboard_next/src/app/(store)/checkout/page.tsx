'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { useAuth } from '@/hooks/useAuth';
import { useStore } from '@/contexts/StoreContext';
import CheckoutPage from '@/components/store/CheckoutPage';

export default function CheckoutRoute() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const store = useStore();

  // Authentication Guard: Redirect to homepage if user is unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      store.showToast('Please login to access checkout.');
      store.openLoginModal();
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router, store]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#006670] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Secure Checkout...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useEffect
  }

  const handleViewChange = (view: string) => {
    if (view === 'home') router.push('/');
    else if (view === 'portfolio') router.push('/products');
    else if (view === 'cart') router.push('/cart');
    else if (view === 'wishlist') router.push('/wishlist');
    else if (view === 'order-success') router.push('/order-success');
    else if (view === 'my-orders') {
      store.setDashboardSection('orders');
      router.push('/profile');
    }
  };

  const handlePlaceOrderSuccess = (orderData: any) => {
    store.setCompletedOrderData(orderData);
    // Clear cart items
    store.setCartItems([]);
    store.setBuyNowItem(null);
    router.push('/order-success');
  };

  const handleBackCheckout = () => {
    if (store.checkoutSource === 'buy-now' && store.buyNowItem) {
      router.push(`/products/${store.buyNowItem.id}`);
    } else {
      router.push('/cart');
    }
  };

  // Determine cart items source (Direct Buy Now item or general Shopping Cart items)
  const activeCheckoutItems = store.checkoutSource === 'buy-now' && store.buyNowItem
    ? [store.buyNowItem]
    : store.cartItems;

  return (
    <>
      {/* Load Razorpay script dynamically for secure payments */}
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      <CheckoutPage
        cartItems={activeCheckoutItems}
        setCurrentView={handleViewChange}
        checkoutSource={store.checkoutSource}
        onBackCheckout={handleBackCheckout}
        showToast={store.showToast}
        onPlaceOrderSuccess={handlePlaceOrderSuccess}
      />
    </>
  );
}
