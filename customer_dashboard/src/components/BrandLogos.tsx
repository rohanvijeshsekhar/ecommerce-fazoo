import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import {
  Brand3M,
  BrandDentsply,
  BrandIvoclar,
  BrandNSK,
  BrandWoodpecker,
  BrandColtene,
  BrandPlanmeca
} from './DentalIcons';

const DEFAULT_BRANDS = [
  { id: '3m',         name: '3M ESPE',             component: <Brand3M /> },
  { id: 'dentsply',   name: 'Dentsply Sirona',     component: <BrandDentsply /> },
  { id: 'ivoclar',    name: 'Ivoclar Vivadent',    component: <BrandIvoclar /> },
  { id: 'nsk',        name: 'NSK Dental',          component: <BrandNSK /> },
  { id: 'woodpecker', name: 'Woodpecker Medical',  component: <BrandWoodpecker /> },
  { id: 'coltene',    name: 'Coltene Dental',      component: <BrandColtene /> },
  { id: 'planmeca',   name: 'Planmeca',            component: <BrandPlanmeca /> },
];

interface ApiBrand {
  id: string;
  brand_name: string;
  logo_url: string | null;
}

const BrandLogos: React.FC = () => {
  const [apiBrands, setApiBrands] = useState<ApiBrand[]>([]);

  useEffect(() => {
    const mapBrand = (b: any): ApiBrand => {
      return {
        id: b.id,
        brand_name: b.name,
        logo_url: b.logo || null
      };
    };

    const mapHomepageBrand = (b: any): ApiBrand => {
      return {
        id: b.id,
        brand_name: b.brand_name,
        logo_url: b.logo_url || null
      };
    };

    api.get('homepage/brands/')
      .then(res => {
        const data = res.data?.data ?? res.data?.results ?? res.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setApiBrands(data.map(mapHomepageBrand));
        } else {
          // Fallback to active catalog brands
          api.get('brands/')
            .then(bRes => {
              const bData = bRes.data?.data ?? bRes.data?.results ?? bRes.data ?? [];
              setApiBrands(bData.map(mapBrand));
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const hasApiBrands = apiBrands.length > 0;

  const getMarqueeItems = () => {
    if (hasApiBrands) {
      const items = apiBrands;
      if (items.length === 0) return [];
      const repeat = Math.ceil(12 / items.length);
      const res: ApiBrand[] = [];
      for (let i = 0; i < repeat; i++) {
        res.push(...items);
      }
      return res;
    } else {
      const items = DEFAULT_BRANDS;
      const repeat = Math.ceil(12 / items.length);
      const res: typeof DEFAULT_BRANDS = [];
      for (let i = 0; i < repeat; i++) {
        res.push(...items);
      }
      return res;
    }
  };

  const marqueeItems = getMarqueeItems();
  const hasItems = marqueeItems.length > 0;
  const desktopDuration = marqueeItems.length * 2.5;
  const mobileDuration = marqueeItems.length * 3.5;

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee-ltr {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-track-desktop {
          display: flex;
          width: max-content;
          animation: marquee-ltr ${desktopDuration}s linear infinite;
        }
        .marquee-track-desktop:hover {
          animation-play-state: paused;
        }
        .marquee-track-mobile {
          display: flex;
          width: max-content;
          animation: marquee-ltr ${mobileDuration}s linear infinite;
        }
      `}} />

      <section className="hidden md:block max-w-7xl mx-auto px-8 py-8 select-none">
        <div className="bg-[#F0F7F5] rounded-3xl p-8 border border-[#e2efec]">

          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight font-display">
              Trusted by Leading Global Brands
            </h2>
            <a
              href="#"
              className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#006670] hover:text-[#004e56] transition-colors"
            >
              View All Brands
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>

          {/* Logos Carousel/Row */}
          <div className="relative w-full overflow-hidden">
            {/* Soft gradient fade on sides */}
            <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-[#F0F7F5] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-[#F0F7F5] to-transparent z-10 pointer-events-none" />

            <div className="marquee-track-desktop flex items-center gap-12 py-2">
              {hasItems && [...marqueeItems, ...marqueeItems].map((brand: any, idx) => (
                <div 
                  key={`${brand.id}-${idx}`} 
                  className="flex items-center justify-center flex-shrink-0 cursor-pointer py-2 px-4"
                >
                  <span 
                    className="text-[19px] font-bold text-slate-700 hover:text-[#006670] transition-all duration-300 tracking-tight select-none"
                  >
                    {brand.brand_name ?? brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      <section className="block md:hidden w-full px-5 py-6 select-none" id="brands-mobile">
        <div className="bg-[#F0F7F5] rounded-2xl p-5 border border-[#e2efec]">
          {/* Header */}
          <div className="flex flex-col items-start gap-2 mb-6">
            <h2 className="text-[22px] font-black text-slate-800 tracking-tight font-display leading-tight text-left">
              Trusted by Leading Global Brands
            </h2>
            <a
              href="#"
              className="group inline-flex items-center gap-1 text-xs font-bold text-[#006670] hover:text-[#004e56] transition-colors"
            >
              <span>View All Brands</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Logos Carousel/Row */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#F0F7F5] to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#F0F7F5] to-transparent z-10 pointer-events-none" />

            <div className="marquee-track-mobile flex items-center gap-8 py-1">
              {hasItems && [...marqueeItems, ...marqueeItems].map((brand: any, idx) => (
                <div 
                  key={`${brand.id}-mob-${idx}`} 
                  className="flex items-center justify-center flex-shrink-0 py-1.5 px-3"
                >
                  <span 
                    className="text-[15px] font-bold text-slate-700 tracking-tight select-none"
                  >
                    {brand.brand_name ?? brand.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BrandLogos;
