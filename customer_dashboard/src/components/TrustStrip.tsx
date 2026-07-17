import React from 'react';
import { Shield, Star, Truck, ShieldAlert } from 'lucide-react';

const TrustStrip: React.FC = () => {
  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 -mt-10 z-30 select-none">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-premium border border-slate-100/50 p-6 md:p-8 grid grid-cols-2 md:grid-cols-4 gap-6 divide-y-0 divide-x-0 sm:divide-y-0 sm:divide-x md:divide-x divide-slate-100">
        
        {/* Item 1: Warranty */}
        <div className="flex items-center gap-4 px-2 md:px-4 justify-start sm:justify-center md:justify-start">
          <div className="p-3 bg-[#e6f3f5] text-[#006670] rounded-2xl">
            <Shield className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-bold text-slate-800 leading-tight">2 Years Warranty</p>
            <p className="text-xs text-slate-500 mt-0.5">Assured clinical service</p>
          </div>
        </div>

        {/* Item 2: Quality */}
        <div className="flex items-center gap-4 px-2 md:px-4 justify-start sm:justify-center md:justify-start">
          <div className="p-3 bg-[#e6f3f5] text-[#006670] rounded-2xl">
            <Star className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-bold text-slate-800 leading-tight">Premium Quality</p>
            <p className="text-xs text-slate-500 mt-0.5">Top global standards</p>
          </div>
        </div>

        {/* Item 3: Delivery */}
        <div className="flex items-center gap-4 px-2 md:px-4 justify-start sm:justify-center md:justify-start">
          <div className="p-3 bg-[#e6f3f5] text-[#006670] rounded-2xl">
            <Truck className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-bold text-slate-800 leading-tight">Pan India Delivery</p>
            <p className="text-xs text-slate-500 mt-0.5">Fast and secure transit</p>
          </div>
        </div>

        {/* Item 4: Support */}
        <div className="flex items-center gap-4 px-2 md:px-4 justify-start sm:justify-center md:justify-start">
          <div className="p-3 bg-[#e6f3f5] text-[#006670] rounded-2xl">
            <ShieldAlert className="w-6 h-6 stroke-[1.8]" />
          </div>
          <div className="text-left">
            <p className="text-[15px] font-bold text-slate-800 leading-tight">Dedicated Support</p>
            <p className="text-xs text-slate-500 mt-0.5">Expert dentist advisory</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TrustStrip;
