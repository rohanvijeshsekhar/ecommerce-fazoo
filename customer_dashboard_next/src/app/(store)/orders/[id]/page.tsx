'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useStore } from '@/contexts/StoreContext';
import OrderDetailPage from '@/components/store/OrderDetailPage';

export default function OrderDetailRoute() {
  const router = useRouter();
  const params = useParams();
  const store = useStore();
  const orderId = params?.id as string;

  const handleProductClick = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const handleBack = () => {
    router.push('/profile'); // In the original app, order details go back to the orders list inside profile
  };

  if (!orderId) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#006670] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Order Details...</p>
      </div>
    );
  }

  return (
    <OrderDetailPage
      orderId={orderId}
      onBack={handleBack}
      onProductClick={handleProductClick}
      showToast={store.showToast}
    />
  );
}
