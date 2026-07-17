import React from 'react';
import type { Metadata } from 'next';
import ComboListingClient from './ComboListingClient';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'FAAZO Premium Dental Combo Deals | Save More',
  description: 'Shop curated dental kits, combos, and bundles on FAAZO. Get premium dental equipment and supplies at discounted package prices with clinical warranty.',
};

export default function ComboListingPage() {
  return (
    <ComboListingClient />
  );
}
