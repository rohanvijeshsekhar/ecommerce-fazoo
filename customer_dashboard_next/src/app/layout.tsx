import React from 'react';
import type { Metadata } from 'next';
import { Inter, Manrope, Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google';
import './globals.css';
import Providers from '../providers/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FAAZO Dental Solutions | Premium Dental Equipment Marketplace',
  description: "FAAZO Dental Solutions is India's leading clinical dental equipment marketplace. Shop genuine dental handpieces, imaging systems, dental chairs, and clinical materials.",
  keywords: ['dental equipment', 'clinical dentistry', 'dental materials', '3M', 'Dentsply Sirona', 'NSK', 'Planmeca', 'dental clinic supply'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html 
      lang="en" 
      className={`scroll-smooth ${inter.variable} ${manrope.variable} ${plusJakartaSans.variable} ${playfairDisplay.variable}`}
    >
      <body className="bg-gradient-to-tr from-[#E6F3F5] via-[#F4F9FA] to-[#EAF2F4] text-[#0B1D26] font-sans antialiased selection:bg-[#006670]/20 selection:text-[#006670] min-h-screen relative overflow-x-clip">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
