'use client';

import React from 'react';
import { ShieldCheck, Truck, Award, Headphones } from 'lucide-react';

const TopBar: React.FC = () => {
  return (
    <div className="w-full bg-[#006670] text-slate-200 py-2.5 px-4 md:px-8 border-b border-[#00525b] text-xs font-medium">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
        {/* Left Side: Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>100% Genuine Products</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pan India Delivery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trusted by 500+ Clinics</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Headphones className="w-3.5 h-3.5 text-emerald-400" />
            <span>Expert Support</span>
          </div>
        </div>

        {/* Right Side: Phone Number */}
        <div className="flex items-center gap-1">
          <span className="text-slate-400 font-normal">Need help? Call us:</span>
          <a href="tel:+911234567890" className="text-white hover:text-emerald-400 transition-colors font-semibold">
            +91 12345 67890
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
