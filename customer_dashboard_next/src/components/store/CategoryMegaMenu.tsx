'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  ChevronRight,
  Wrench,
  Camera,
  Zap,
  HeartPulse,
  Tv,
  Wind,
  Settings
} from 'lucide-react';
import { api } from '../../lib/api';
import { useCategories, CATEGORIES } from '../../hooks/useCategories';
import type { Category } from '../../hooks/useCategories';

const getCategoryIcon = (id: string) => {
  const key = id.toLowerCase();
  if (key.includes('handpiece')) return <Wrench className="w-3.5 h-3.5" />;
  if (key.includes('camera') || key.includes('imaging')) return <Camera className="w-3.5 h-3.5" />;
  if (key.includes('cure') || key.includes('led') || key.includes('light')) return <Zap className="w-3.5 h-3.5" />;
  if (key.includes('chair') || key.includes('stool')) return <HeartPulse className="w-3.5 h-3.5" />;
  if (key.includes('scanner') || key.includes('3d') || key.includes('oral')) return <Tv className="w-3.5 h-3.5" />;
  if (key.includes('compressor') || key.includes('air') || key.includes('suction')) return <Wind className="w-3.5 h-3.5" />;
  return <Settings className="w-3.5 h-3.5" />;
};


// ─── Component ─────────────────────────────────────────────────────────────────
interface CategoryMegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onItemClick: (itemName: string, e: React.MouseEvent) => void;
  onProductClick?: (productId: string, e: React.MouseEvent) => void;
}

const CategoryMegaMenu: React.FC<CategoryMegaMenuProps> = ({
  isOpen,
  onMouseEnter,
  onMouseLeave,
  onItemClick,
  onProductClick,
}) => {
  // ── raw data from API / DB ────────────────────────────────────────
  interface RawCategory { id: string; name: string; slug: string; active_product_count: number; children: RawCategory[]; }
  const dbCategories = useCategories();
  const [rawTree, setRawTree] = useState<RawCategory[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [hoveredSubCatIdx, setHoveredSubCatIdx] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      api.get('products/?page_size=200')
        .then(res => {
          const prods = res.data?.data ?? res.data ?? [];
          if (Array.isArray(prods)) {
            setDbProducts(prods);
          }
        })
        .catch(err => console.error('Failed to load products in mega menu:', err));

      // Also fetch the raw tree so we can get active_product_count for root categories
      api.get('categories/tree/')
        .then(res => {
          const tree = res.data?.data ?? res.data ?? [];
          if (Array.isArray(tree)) setRawTree(tree);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  // Sync initial selected ID once categories load or on start
  useEffect(() => {
    if (dbCategories.length > 0 && !selectedCatId) {
      setSelectedCatId(dbCategories[0].id);
    }
  }, [dbCategories, selectedCatId]);


  const activeCat = dbCategories.find(c => c.id === selectedCatId) ?? dbCategories[0] ?? CATEGORIES[0];

  // Does this category have any subcategories at all?
  const isLeafRoot = activeCat ? activeCat.subCategories.length === 0 : false;

  // Determine which subcategory's sub-items to show on the right panel
  const rightPanelSubCat =
    activeCat && !isLeafRoot && hoveredSubCatIdx !== null
      ? activeCat.subCategories[hoveredSubCatIdx] ?? null
      : !isLeafRoot ? activeCat?.subCategories?.[0] ?? null : null;

  const subCatProducts = rightPanelSubCat
    ? dbProducts.filter(p => p.category_name?.toLowerCase() === rightPanelSubCat.name.toLowerCase())
    : [];

  // For leaf root categories, get products assigned directly to the category
  const directProducts = isLeafRoot && activeCat
    ? dbProducts.filter(p => p.category_name?.toLowerCase() === activeCat.label.toLowerCase())
    : [];

  // Get the raw tree node for the active category to read its active_product_count
  const rawActiveCat = rawTree.find(r => r.slug === activeCat?.id || r.name?.toLowerCase() === activeCat?.label?.toLowerCase());

  // Filter categories based on search
  const filteredCategories = searchQuery.trim()
    ? dbCategories.filter(
        cat =>
          cat.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cat.subCategories.some(
            sub =>
              sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sub.subItems.some(item =>
                item.name.toLowerCase().includes(searchQuery.toLowerCase())
              )
          )
      )
    : dbCategories;

  const handleCatSelect = (catId: string) => {
    setSelectedCatId(catId);
    setHoveredSubCatIdx(null);
  };

  const handleCatClick = (cat: Category, e: React.MouseEvent) => {
    handleCatSelect(cat.id);
    onItemClick(cat.label, e);
  };

  if (!activeCat) return null;

  return (
    <div
      className={`
        hidden lg:block absolute left-1/2 -translate-x-1/2 w-full max-w-7xl px-6 md:px-12
        z-[45] transition-all duration-250 ease-out text-left select-none
        ${isOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto visible'
          : 'opacity-0 -translate-y-2 pointer-events-none invisible'
        }
      `}
      style={{ top: 'calc(100% + 8px)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={() => {
        onMouseLeave();
        setHoveredSubCatIdx(null);
      }}
    >
      <div className="w-full bg-white border border-slate-200/75 rounded-2xl shadow-[0_20px_50px_rgba(0,77,84,0.15)] overflow-hidden flex flex-col">
      {/* Search Bar */}
      <div className="border-b border-slate-100 px-4 py-2.5">
        <div className="flex items-center gap-2.5 bg-[#f4f8f9] border border-[#006670]/20 rounded-full px-4 py-2 max-w-md w-full hover:border-[#006670]/40 focus-within:border-[#006670]/60 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
            }}
            placeholder="Search Category"
            className="bg-transparent border-none outline-none focus:ring-0 text-[12px] w-full text-slate-700 placeholder-slate-400 font-sans"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex" style={{ height: '480px', maxHeight: 'calc(100vh - 230px)' }}>

        {/* ── Column 1: Main Categories ────────────────────────────────── */}
        <div className="w-[220px] shrink-0 border-r border-slate-100 overflow-y-auto flex flex-col">
          <div className="px-3 py-2 border-b border-slate-100">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">CATEGORY</span>
          </div>
          {filteredCategories.map(cat => {
            const isActive = cat.id === selectedCatId;
            return (
              <button
                key={cat.id}
                onMouseEnter={() => handleCatSelect(cat.id)}
                onClick={(e) => handleCatClick(cat, e)}
                className={`
                  flex items-center justify-between gap-2.5 w-full text-left px-4 py-2.5
                  transition-all duration-150 group cursor-pointer
                  ${isActive
                    ? 'bg-[#e6f3f5] text-[#006670] font-black border-l-2 border-[#006670]'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-[#006670] font-bold border-l-2 border-transparent'
                  }
                `}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`
                    w-6.5 h-6.5 rounded-full flex items-center justify-center shrink-0 transition-colors
                    ${isActive ? 'bg-[#cccccc] text-[#006670]' : 'bg-[#e0e0e0] text-slate-500 group-hover:text-[#006670] group-hover:bg-[#cccccc]'}
                  `}>
                    {getCategoryIcon(cat.slug || cat.id)}
                  </span>
                  <span className="text-[13.5px] leading-tight">{cat.label}</span>
                </div>
                {isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-[#006670] shrink-0" />
                )}
              </button>
            );
          })}
          {filteredCategories.length === 0 && (
            <div className="py-10 text-center text-xs text-slate-400 font-sans">No results</div>
          )}
        </div>

        {/* ── Column 2: Sub-Categories ─────────────────────────────────── */}
        <div className="w-[260px] shrink-0 border-r border-slate-100 overflow-y-auto">
          {/* Category title header */}
          <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
            <h3 className="text-[14px] font-black text-slate-800">{activeCat.label}</h3>
            <span className="bg-[#e6f3f5] text-[#006670] text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {isLeafRoot
                ? (rawActiveCat?.active_product_count ?? directProducts.length)
                : activeCat.subCategories.reduce((acc, s) => acc + s.count, 0)
              } Items
            </span>
          </div>

          {isLeafRoot ? (
            /* Direct products for a leaf root category */
            <div className="p-4 flex flex-col gap-y-1 overflow-y-auto max-h-[380px] no-scrollbar">
              {directProducts.map((p, idx) => (
                <a
                  key={idx}
                  href={`#product-${p.slug}`}
                  onClick={e => {
                    if (onProductClick) {
                      onProductClick(p.slug, e);
                    } else {
                      onItemClick(p.name, e);
                    }
                  }}
                  className="
                    flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13.5px] font-bold text-slate-700
                    hover:text-[#006670] hover:bg-[#e6f3f5]/50 transition-all duration-150
                    group cursor-pointer border border-transparent hover:border-[#006670]/10
                  "
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#006670] shrink-0 transition-colors" />
                  <span className="truncate">{p.name}</span>
                </a>
              ))}
              {directProducts.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400 font-sans">
                  No products listed under this category
                </div>
              )}
            </div>
          ) : (
            <div className="py-1">
              {activeCat.subCategories.map((sub, idx) => {
                const isHovered = hoveredSubCatIdx === idx || (hoveredSubCatIdx === null && idx === 0);
                return (
                  <button
                    key={idx}
                    onMouseEnter={() => setHoveredSubCatIdx(idx)}
                    onClick={e => onItemClick(sub.name, e)}
                    className={`
                      flex items-center justify-between w-full text-left px-4 py-2.5 gap-2
                      transition-all duration-150 group cursor-pointer
                      ${isHovered
                        ? 'bg-[#e6f3f5] text-[#006670]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#006670]'
                      }
                    `}
                  >
                    <span className={`text-[13.5px] leading-tight ${isHovered ? 'font-black' : 'font-bold'}`}>
                      {sub.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`text-[11px] font-bold tabular-nums ${isHovered ? 'text-[#006670]' : 'text-slate-400'}`}>
                        {sub.count}
                      </span>
                      <ChevronRight className={`w-3 h-3 transition-colors ${isHovered ? 'text-[#006670]' : 'text-slate-300'}`} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Column 3: Sub-Sub-Categories / Products ──────────────────── */}
        <div className="flex-1 overflow-y-auto">
          {/* For leaf root categories, column 3 is empty — products are shown in column 2 */}
          {isLeafRoot && (
            <div className="h-full flex items-center justify-center">
              <div className="text-center px-6">
                <p className="text-[13px] text-slate-400 font-bold">
                  {directProducts.length > 0 ? `${directProducts.length} product${directProducts.length > 1 ? 's' : ''} in ${activeCat.label}` : ''}
                </p>
              </div>
            </div>
          )}
          {!isLeafRoot && rightPanelSubCat && (
            <>
              {/* Sub-category header */}
              <div className="px-5 py-2.5 border-b border-slate-100 flex items-center gap-2">
                <h4 className="text-[13.5px] font-black text-slate-800">{rightPanelSubCat.name}</h4>
                <span className="bg-orange-100 text-orange-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  {rightPanelSubCat.count} items
                </span>
              </div>

              {/* Grid of sub-sub items or products list */}
              {rightPanelSubCat.subItems.length > 0 ? (
                <>
                  <div className="p-4 grid grid-cols-2 gap-x-6 gap-y-0.5">
                    {rightPanelSubCat.subItems.map((item, idx) => (
                      <a
                        key={idx}
                        href="#products"
                        onClick={e => onItemClick(item.name, e)}
                        className="
                          flex items-center gap-1.5 py-1.5 text-[13.5px] font-bold text-slate-700
                          hover:text-[#006670] transition-all duration-150
                          group cursor-pointer
                        "
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300 group-hover:bg-[#006670] shrink-0 transition-colors" />
                        {item.name}
                      </a>
                    ))}
                  </div>

                  {/* "View All" link at bottom */}
                  <div className="px-5 pb-4">
                    <a
                      href="#products"
                      onClick={e => onItemClick(rightPanelSubCat.name, e)}
                      className="inline-flex items-center gap-1 text-[12px] font-black text-[#006670] hover:underline transition-all"
                    >
                      View All {rightPanelSubCat.name}
                      <ChevronRight className="w-3 h-3" />
                    </a>
                  </div>
                </>
              ) : (
                <div className="p-4 flex flex-col gap-y-1 overflow-y-auto max-h-[380px] no-scrollbar">
                  {subCatProducts.map((p, idx) => (
                    <a
                      key={idx}
                      href={`#product-${p.slug}`}
                      onClick={e => {
                        if (onProductClick) {
                          onProductClick(p.slug, e);
                        } else {
                          onItemClick(p.name, e);
                        }
                      }}
                      className="
                        flex items-center gap-2.5 py-2 px-3 rounded-lg text-[13.5px] font-bold text-slate-700
                        hover:text-[#006670] hover:bg-[#e6f3f5]/50 transition-all duration-150
                        group cursor-pointer border border-transparent hover:border-[#006670]/10
                      "
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-[#006670] shrink-0 transition-colors" />
                      <span className="truncate">{p.name}</span>
                    </a>
                  ))}
                  {subCatProducts.length === 0 && (
                    <div className="py-8 text-center text-xs text-slate-400 font-sans">
                      No products listed under this category
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Decorative vertical label */}
          <div
            className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-[#004d54]/5 uppercase tracking-widest text-[40px] select-none pointer-events-none"
            style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}
          >
            {activeCat.label}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default CategoryMegaMenu;
export { getCategoryIcon };
