'use client';

import { ShieldCheck, Truck, Users, Headphones, ArrowRight } from 'lucide-react';

const WhyChooseBanner: React.FC = () => {
  return (
    <>
      {/* Desktop view */}
      <section className="hidden md:block w-full py-6 px-8 select-none">
        <div className="max-w-7xl mx-auto bg-gradient-teal rounded-3xl p-8 flex items-center justify-center shadow-premium">
          <div className="flex flex-wrap items-center justify-center gap-x-8 md:gap-x-12 lg:gap-x-16 gap-y-6 text-white text-sm font-semibold w-full">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">100% Genuine Products</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">Pan India Delivery</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">Trusted by 500+ Clinics</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Headphones className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">Expert Customer Support</span>
            </div>
            
            <a 
              href="#about"
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/20 hover:border-white text-white text-sm font-bold bg-white/5 hover:bg-white/10 transition-all select-none cursor-pointer"
            >
              Explore Now
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Mobile view */}
      <section className="block md:hidden w-full py-4 px-5 select-none" id="why-choose-banner-mobile">
        <div className="bg-gradient-teal rounded-2xl p-6 shadow-premium">
          <div className="flex flex-col items-start gap-4 text-white text-xs font-semibold w-full">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">100% Genuine Products</span>
            </div>
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">Pan India Delivery</span>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">Trusted by 500+ Clinics</span>
            </div>
            <div className="flex items-center gap-3">
              <Headphones className="w-5 h-5 text-emerald-400 stroke-[2]" />
              <span className="text-slate-100">Expert Customer Support</span>
            </div>
            
            <a 
              href="#about"
              className="group inline-flex items-center justify-center gap-2 w-full mt-2 px-5 py-3 rounded-full border border-white/20 hover:border-white text-white text-xs font-bold bg-white/5 hover:bg-white/10 transition-all select-none cursor-pointer"
            >
              Explore Now
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

export default WhyChooseBanner;
