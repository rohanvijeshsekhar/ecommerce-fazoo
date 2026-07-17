import React from 'react';
import type { Metadata } from 'next';
import { serverFetch } from '../../../../lib/server-api';
import ComboDetailClient from './ComboDetailClient';

export const revalidate = 300;

interface ComboDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ComboDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  
  // Fetch combo detail for SEO tags
  const res = await serverFetch<any>(`combos/${slug}/`, { revalidate });
  const combo = res.data ?? res;

  if (!combo || !combo.title) {
    return {
      title: 'Combo Deal Details | FAAZO Dental Solutions',
      description: 'Shop curated dental kits, combos, and bundles on FAAZO.',
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  return {
    title: `${combo.title} | FAAZO Premium Combo Deal`,
    description: combo.description || `Get the ${combo.title} package on FAAZO. Curated dental setup bundle with clinical equipment and materials at discount pricing.`,
    alternates: {
      canonical: `${baseUrl}/combo-deals/${slug}`,
    },
  };
}

export default async function ComboPage({ params }: ComboDetailPageProps) {
  const { slug } = await params;

  return (
    <ComboDetailClient slug={slug} />
  );
}
