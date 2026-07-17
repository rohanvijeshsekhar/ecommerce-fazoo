import React from 'react';
import type { Metadata } from 'next';
import CategoryListingClient from './CategoryListingClient';
import { getCategoryDisplayName } from '@/lib/utils';

export const revalidate = 300;

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryName = getCategoryDisplayName(slug);
  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  return {
    title: `${categoryName} | FAAZO Dental Solutions`,
    description: `Shop authentic clinical ${categoryName.toLowerCase()} on FAAZO. Compare leading brands like NSK, Woodpecker, and Dentsply Sirona with full clinical warranty.`,
    alternates: {
      canonical: `${baseUrl}/products/category/${slug}`,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  return (
    <CategoryListingClient slug={slug} />
  );
}
