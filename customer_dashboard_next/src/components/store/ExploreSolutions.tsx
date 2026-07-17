'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronRight, Stethoscope, Scissors, Activity, Heart, Shield } from 'lucide-react';
import { api, getAbsoluteImageUrl } from '../../lib/api';

interface SolutionItem {
  id: string;
  title: string;
  image: string;
  icon: React.ReactNode;
}



const ICON_MAP: Record<string, React.ReactNode> = {
  general: <Stethoscope className="w-4 h-4 text-[#006670]" />,
  surgery: <Scissors className="w-4 h-4 text-[#006670]" />,
  ortho: <Activity className="w-4 h-4 text-[#006670]" />,
  endo: <Heart className="w-4 h-4 text-[#006670]" />,
  lab: <Shield className="w-4 h-4 text-[#006670]" />
};

// ─── Static fallback used when backend returns no data ──────────────────
const STATIC_SOLUTIONS: SolutionItem[] = [
  {
    id: 'general-dentistry',
    title: 'General Dentistry',
    image: '/images/category_chairs.png',
    icon: <Stethoscope className="w-4 h-4 text-[#006670]" />,
  },
  {
    id: 'oral-surgery-implantology',
    title: 'Oral Surgery & Implantology',
    image: '/images/category_imaging.png',
    icon: <Scissors className="w-4 h-4 text-[#006670]" />,
  },
  {
    id: 'orthodontics',
    title: 'Orthodontics',
    image: '/images/loginimg.png',
    icon: <Activity className="w-4 h-4 text-[#006670]" />,
  },
  {
    id: 'endodontics',
    title: 'Endodontics',
    image: '/images/bestseller_locator.png',
    icon: <Heart className="w-4 h-4 text-[#006670]" />,
  },
  {
    id: 'dental-lab',
    title: 'Dental Lab',
    image: '/images/category_instruments.png',
    icon: <Shield className="w-4 h-4 text-[#006670]" />,
  },
];

const ExploreSolutions: React.FC<{ onViewPortfolio?: () => void }> = ({ onViewPortfolio }) => {
  const [solutions, setSolutions] = useState<SolutionItem[]>([]);

  useEffect(() => {
    const getCategoryFallbackImage = (slug: string): string => {
      const s = slug.toLowerCase();
      if (s.includes('handpiece')) return '/images/category_handpieces.png';
      if (s.includes('camera') || s.includes('scan') || s.includes('imaging') || s.includes('x-ray')) return '/images/category_imaging.png';
      if (s.includes('instrument')) return '/images/category_instruments.png';
      if (s.includes('compressor') || s.includes('suction') || s.includes('equipment')) return '/images/category_equipment.png';
      if (s.includes('chair') || s.includes('seating') || s.includes('stool')) return '/images/category_chairs.png';
      return '/images/category_materials.png';
    };

    const mapCategoryToSolution = (cat: any, index: number): SolutionItem => {
      const defaultIcons = ['general', 'surgery', 'ortho', 'endo', 'lab'];
      const defaultIconKey = defaultIcons[index % defaultIcons.length];
      const slug = cat.slug || '';
      return {
        id: cat.slug || String(cat.id),
        title: cat.name,
        image: getAbsoluteImageUrl(cat.image) || getCategoryFallbackImage(slug),
        icon: ICON_MAP[cat.slug] || ICON_MAP[defaultIconKey] || <Stethoscope className="w-4 h-4 text-[#006670]" />
      };
    };

    api.get('homepage/explore-solutions/')
      .then(res => {
        const data = res.data?.data ?? res.data?.results ?? res.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          const mapped: SolutionItem[] = data.map((item: any, index: number) => {
            const defaultIcons = ['general', 'surgery', 'ortho', 'endo', 'lab'];
            const defaultIconKey = defaultIcons[index % defaultIcons.length];
            const slug = item.category_slug ?? item.category ?? '';
            return {
              id: item.category_slug ?? item.category,
              title: item.display_heading || item.category_name || '',
              image: getAbsoluteImageUrl(item.image_url) || getCategoryFallbackImage(slug),
              icon: ICON_MAP[item.category_slug] || ICON_MAP[defaultIconKey] || <Stethoscope className="w-4 h-4 text-[#006670]" />
            };
          });
          setSolutions(mapped);
        } else {
          // Fallback to active parent categories
          api.get('categories/?parent__isnull=true')
            .then(cRes => {
              const cData = cRes.data?.data ?? cRes.data?.results ?? cRes.data ?? [];
              if (Array.isArray(cData) && cData.length > 0) {
                setSolutions(cData.map((cat: any, idx: number) => mapCategoryToSolution(cat, idx)));
              }
              // else: keep static defaults showing
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // Use static fallback when no backend solutions loaded yet
  const displaySolutions = solutions.length > 0 ? solutions : STATIC_SOLUTIONS;

  return (

    <>
      {/* Desktop view */}
      <section className="hidden md:block max-w-7xl mx-auto px-8 py-12 select-none" id="solutions">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 tracking-tight font-display">
            Explore by Solution
          </h2>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onViewPortfolio && onViewPortfolio(); }}
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#006670] hover:text-[#004e56] transition-colors"
          >
            View All Solutions
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Solutions Cards Grid */}
        <div className="flex flex-wrap justify-start gap-5">
          {displaySolutions.map((sol) => (
            <div 
              key={sol.id} 
              onClick={() => onViewPortfolio && onViewPortfolio()}
              className="group relative w-[280px] h-[380px] rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 shadow-sm hover:shadow-hover transition-all duration-500 cursor-pointer flex flex-col justify-end p-4"
            >
              {/* Background image overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={sol.image} 
                  alt={sol.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9] group-hover:brightness-[0.95]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
              </div>

              {/* Content box overlapping background at bottom */}
              <div className="relative z-10 w-full bg-white/95 backdrop-blur-sm rounded-xl p-3.5 flex items-center justify-between border border-white/20 shadow-sm group-hover:bg-white transition-colors duration-300">
                <div className="flex items-center gap-2.5 text-left">
                  <div className="w-7 h-7 rounded-lg bg-[#e6f3f5] flex items-center justify-center flex-shrink-0">
                    {sol.icon}
                  </div>
                  <span className="text-[12.5px] font-extrabold text-slate-800 leading-tight tracking-tight font-display line-clamp-1">
                    {sol.title}
                  </span>
                </div>
                
                <ChevronRight className="w-4 h-4 text-[#006670] group-hover:translate-x-0.5 transition-transform stroke-[2.5]" />
              </div>

            </div>
          ))}
        </div>
      </section>

      {/* Mobile view */}
      <section className="block md:hidden w-full px-5 py-6 select-none" id="solutions-mobile">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[28px] font-black text-slate-800 tracking-tight font-display leading-tight">
            Explore by Solution
          </h2>
          <a 
            href="#" 
            onClick={(e) => { e.preventDefault(); onViewPortfolio && onViewPortfolio(); }}
            className="group inline-flex items-center gap-1 text-xs font-bold text-[#006670] hover:text-[#004e56] transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Solutions Cards Grid (Single Column mobile layout) */}
        <div className="grid grid-cols-1 gap-4">
          {displaySolutions.map((sol) => (
            <div 
              key={sol.id} 
              onClick={() => onViewPortfolio && onViewPortfolio()}
              className="group relative h-48 rounded-xl overflow-hidden border border-slate-100 flex flex-col justify-end p-4 cursor-pointer"
            >
              {/* Background image overlay */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={sol.image} 
                  alt={sol.title} 
                  className="w-full h-full object-cover brightness-[0.8]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
              </div>

              {/* Content box */}
              <div className="relative z-10 w-full bg-white/95 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between border border-white/20">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-6.5 h-6.5 rounded bg-[#e6f3f5] flex items-center justify-center flex-shrink-0">
                    {sol.icon}
                  </div>
                  <span className="text-[12px] font-bold text-slate-800 tracking-tight font-display line-clamp-1">
                    {sol.title}
                  </span>
                </div>
                
                <ChevronRight className="w-3.5 h-3.5 text-[#006670] stroke-[2.5]" />
              </div>

            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default ExploreSolutions;
