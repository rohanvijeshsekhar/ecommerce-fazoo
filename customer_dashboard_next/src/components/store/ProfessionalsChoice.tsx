'use client';

import React from 'react';
import { ShieldCheck, Tags, LockKeyhole, Box, ShieldEllipsis } from 'lucide-react';

const ProfessionalsChoice: React.FC = () => {
  const points = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#006670]" />,
      title: "Curated Range",
      desc: "Carefully selected products from trusted global brands."
    },
    {
      icon: <Tags className="w-5 h-5 text-[#006670]" />,
      title: "Best Value",
      desc: "Competitive pricing with offers that add more value."
    },
    {
      icon: <LockKeyhole className="w-5 h-5 text-[#006670]" />,
      title: "Secure Shopping",
      desc: "100% secure payments and protected transactions."
    },
    {
      icon: <Box className="w-5 h-5 text-[#006670]" />,
      title: "Fast & Reliable Delivery",
      desc: "Quick dispatch and on-time delivery across India."
    },
    {
      icon: <ShieldEllipsis className="w-5 h-5 text-[#006670]" />,
      title: "Dedicated Support",
      desc: "Expert assistance before and after your purchase."
    }
  ];

  return (
    <>
      {/* Desktop view */}
      <section className="hidden md:block max-w-7xl mx-auto px-8 py-8 select-none">
        <div className="bg-[#e6f3f5]/55 rounded-3xl border border-[#D5E6E5]/40 p-8 grid grid-cols-5 gap-6 divide-x divide-[#CBD9D8]">
          {points.map((pt, i) => (
            <div key={i} className="flex flex-col items-start text-left px-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm mb-4 border border-[#D5E6E5]">
                {pt.icon}
              </div>
              <h4 className="text-[13.5px] font-bold text-slate-800 leading-tight">
                {pt.title}
              </h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed font-medium">
                {pt.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Mobile view */}
      <section className="block md:hidden w-full px-5 py-6 select-none" id="professionals-choice-mobile">
        <div className="bg-[#e6f3f5]/55 rounded-2xl border border-[#D5E6E5]/40 p-6 flex flex-col gap-6">
          {points.map((pt, i) => (
            <div key={i} className="flex gap-4 items-start text-left">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-[#D5E6E5]">
                {pt.icon}
              </div>
              <div>
                <h4 className="text-[13px] font-bold text-slate-800 leading-none">
                  {pt.title}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans">
                  {pt.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default ProfessionalsChoice;
