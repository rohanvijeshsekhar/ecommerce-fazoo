'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import ProductsLandingPage from '../../../components/store/ProductsLandingPage';

export default function ProductsPage() {
  const router = useRouter();

  const handleCategoryClick = (categoryName: string) => {
    // Convert Category Name to slug
    const slug = categoryName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-');
    router.push(`/products/category/${slug}`);
  };

  const handleProductClick = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  const handleViewChange = (view: string) => {
    if (view === 'home') router.push('/');
  };

  return (
    <ProductsLandingPage
      onCategoryClick={handleCategoryClick}
      onProductClick={handleProductClick}
      setCurrentView={handleViewChange}
    />
  );
}
