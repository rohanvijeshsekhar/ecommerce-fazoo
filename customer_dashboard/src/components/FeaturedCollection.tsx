import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';

interface CollectionData {
  id: string;
  title: string;
  description: string;
}

const FeaturedCollection: React.FC = () => {
  const [collection, setCollection] = useState<CollectionData | null>(null);

  useEffect(() => {
    api.get('homepage/featured-collections/')
      .then(res => {
        const data = res.data?.data ?? res.data?.results ?? res.data ?? [];
        const active = Array.isArray(data) ? data.find((c: any) => c.is_visible) : null;
        if (active) {
          setCollection({
            id: active.id,
            title: active.title,
            description: active.description
          });
        }
      })
      .catch(() => {});
  }, []);

  const displayTitle = collection ? collection.title : "Advanced Solutions for Every Practice";
  const displayDescription = collection ? collection.description : "Engineered for precision. Designed for comfort. Built to elevate patient care. Experience the future of clinical operation.";

  return (
    <>
      {/* Desktop view */}
      <section className="hidden lg:block max-w-[1400px] mx-auto px-6 py-12 select-none">
        <div className="bg-gradient-mint rounded-3xl overflow-hidden border border-[#E2EBEA] grid grid-cols-12 items-center h-[460px]">
          
          {/* Left Column: Content */}
          <div className="col-span-5 min-w-0 p-12 text-left flex flex-col items-start justify-between h-full">
            <div>
              <span className="text-xs font-extrabold text-[#006670] tracking-widest uppercase mb-3 block">
                FEATURED COLLECTION
              </span>
              <h2 className="text-4xl font-black text-slate-800 tracking-tight font-display mb-4 leading-tight break-words w-full line-clamp-2">
                {displayTitle}
              </h2>
              <p className="text-base text-slate-600 mb-8 max-w-md font-medium leading-relaxed break-words w-full line-clamp-3">
                {displayDescription}
              </p>
            </div>
            <a 
              href="#featured"
              className="group inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#006670] hover:bg-[#004e56] text-white text-sm font-bold shadow-md hover:shadow-premium transition-all cursor-pointer"
            >
              Explore Collection
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          {/* Right Column: Visual Rendering */}
          <div className="col-span-7 min-w-0 h-full w-full flex justify-center items-center relative">
            {/* Accent lighting sphere */}
            <div className="absolute w-[70%] aspect-square rounded-full bg-white/40 blur-3xl -z-10" />
            
            <img 
              src="/images/hero_equipment.png" 
              alt="Advanced Dental Solutions Suite" 
              className="w-full max-w-[500px] h-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.05)] transform hover:scale-[1.02] transition-transform duration-500"
            />
          </div>

        </div>
      </section>

      {/* Mobile view */}
      <section className="block lg:hidden w-full px-5 py-6 select-none" id="featured-collection-mobile">
        <div className="bg-gradient-mint rounded-2xl border border-[#E2EBEA] p-6 flex flex-col items-start text-left w-full overflow-hidden h-[500px] justify-between">
          <div className="w-full">
            <span className="text-[10px] font-extrabold text-[#006670] tracking-widest uppercase mb-2 block font-sans">
              FEATURED COLLECTION
            </span>
            <h2 className="text-[28px] font-black text-slate-800 tracking-tight font-display mb-3 leading-tight break-words w-full line-clamp-2">
              {displayTitle}
            </h2>
            <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed font-sans break-words w-full line-clamp-3">
              {displayDescription}
            </p>
          </div>
          
          <div className="w-full">
            <a 
              href="#featured"
              className="group inline-flex items-center justify-center gap-2 w-full px-5 py-3 rounded-full bg-[#006670] hover:bg-[#004e56] text-white text-xs font-bold shadow-md transition-all cursor-pointer mb-6"
            >
              Explore Collection
              <ArrowRight className="w-3.5 h-3.5" />
            </a>

            {/* Image visual */}
            <div className="w-full flex justify-center items-center relative py-2 bg-white/30 rounded-xl">
              <img 
                src="/images/hero_equipment.png" 
                alt="Advanced Dental Solutions Suite" 
                className="w-full max-w-[280px] h-auto object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default FeaturedCollection;
