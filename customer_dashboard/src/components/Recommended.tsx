import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation, Autoplay } from 'swiper/modules';
import { ArrowRight, Star, ShoppingCart, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGuestGuard } from '../hooks/useGuestGuard';
import { api, getAbsoluteImageUrl } from '../services/api';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

interface RecProduct {
  id: string;
  title: string;
  manufacturer: string;
  rating: number;
  reviews: number;
  price: number;
  originalPrice?: number;
  image: string;
  discount: string;
  scale: number;
  gradient: string;
  glowColor: string;
}



interface MockCartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  image: string;
  originalPrice?: number;
}

interface RecommendedProps {
  onProductClick: (id: string) => void;
  onOpenLoginModal: () => void;
  setCartItems: React.Dispatch<React.SetStateAction<MockCartItem[]>>;
  wishlistItems: MockCartItem[];
  setWishlistItems: React.Dispatch<React.SetStateAction<MockCartItem[]>>;
  showToast?: (message: string) => void;
}

// ─── Static fallback products used when backend returns none ──────────────
const STATIC_REC_PRODUCTS: RecProduct[] = [
  {
    id: 'nsk-ti-max-z900l',
    title: 'NSK Ti-Max Z900L',
    manufacturer: 'NSK',
    rating: 4.8,
    reviews: 124,
    price: 24999,
    originalPrice: 29999,
    image: '/images/nsk_handpiece_portrait.png',
    discount: '17% OFF',
    scale: 1.25,
    gradient: 'linear-gradient(135deg, #FCFCFC 0%, #F4F8F7 50%, #E2EDEC 100%)',
    glowColor: 'rgba(0, 43, 46, 0.05)',
  },
  {
    id: 'woodpecker-uds-e',
    title: 'Woodpecker UDS-E LED',
    manufacturer: 'Woodpecker',
    rating: 4.7,
    reviews: 87,
    price: 12499,
    originalPrice: 15000,
    image: '/images/bestseller_scaler.png',
    discount: '17% OFF',
    scale: 1.35,
    gradient: 'linear-gradient(135deg, #FCFCFC 0%, #F2F7F8 55%, #DFEEF0 100%)',
    glowColor: 'rgba(0, 43, 46, 0.05)',
  },
  {
    id: 'dentsply-x-smart',
    title: 'Dentsply X-Smart Plus',
    manufacturer: 'Dentsply Sirona',
    rating: 4.9,
    reviews: 63,
    price: 38500,
    originalPrice: 45000,
    image: '/images/bestseller_scaler.png',
    discount: '14% OFF',
    scale: 1.45,
    gradient: 'linear-gradient(135deg, #FAFBFB 0%, #EFF5F5 45%, #DCECEC 100%)',
    glowColor: 'rgba(0, 43, 46, 0.05)',
  },
  {
    id: 'planmeca-compact-i',
    title: 'Planmeca Compact i5',
    manufacturer: 'Planmeca',
    rating: 4.9,
    reviews: 42,
    price: 189000,
    originalPrice: 210000,
    image: '/images/category_chairs.png',
    discount: '10% OFF',
    scale: 1.15,
    gradient: 'linear-gradient(135deg, #FCFCFC 0%, #F1F6F5 60%, #DEEAE8 100%)',
    glowColor: 'rgba(0, 43, 46, 0.05)',
  },
  {
    id: 'ivoclar-emax',
    title: 'Ivoclar IPS e.max',
    manufacturer: 'Ivoclar',
    rating: 4.8,
    reviews: 56,
    price: 8750,
    originalPrice: 9999,
    image: '/images/category_materials.png',
    discount: '13% OFF',
    scale: 1.3,
    gradient: 'linear-gradient(135deg, #FAFAFA 0%, #F3F7F7 50%, #E1ECEB 100%)',
    glowColor: 'rgba(0, 43, 46, 0.05)',
  },
];

const Recommended: React.FC<RecommendedProps> = ({ onProductClick, onOpenLoginModal, setCartItems, showToast }) => {

  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [recProducts, setRecProducts] = useState<RecProduct[]>([]);
  const { guardAction } = useGuestGuard(onOpenLoginModal, showToast);

  useEffect(() => {
    const mapRecProduct = (item: any, index: number): RecProduct => {
      const price = item.pricing ? parseFloat(item.pricing.effective_price || item.pricing.selling_price || '0') : (item.price || 10499);
      const mrp = item.pricing ? parseFloat(item.pricing.mrp || '0') : item.originalPrice;
      const discountPct = item.pricing?.discount_percentage;
      const discountStr = discountPct && discountPct > 0 ? `${Math.round(discountPct)}% OFF` : '';

      const scales = [1.25, 1.35, 1.45, 1.15, 1.3];
      const gradients = [
        'linear-gradient(135deg, #FCFCFC 0%, #F4F8F7 50%, #E2EDEC 100%)',
        'linear-gradient(135deg, #FCFCFC 0%, #F2F7F8 55%, #DFEEF0 100%)',
        'linear-gradient(135deg, #FAFBFB 0%, #EFF5F5 45%, #DCECEC 100%)',
        'linear-gradient(135deg, #FCFCFC 0%, #F1F6F5 60%, #DEEAE8 100%)',
        'linear-gradient(135deg, #FAFAFA 0%, #F3F7F7 50%, #E1ECEB 100%)'
      ];

      return {
        id:           item.product_slug ?? item.product ?? item.slug,
        title:        item.product_name ?? item.name,
        manufacturer: item.brand_name || 'Brand',
        rating:       4.8,
        reviews:      50 + (index * 7) % 80,
        price:        price,
        originalPrice: mrp && mrp > price ? mrp : undefined,
        image:        getAbsoluteImageUrl(item.primary_image || item.image) || '/images/bestseller_scaler.png',
        discount:     discountStr,
        scale:        scales[index % scales.length],
        gradient:     gradients[index % gradients.length],
        glowColor:    'rgba(0, 43, 46, 0.05)'
      };
    };

    api.get('homepage/recommended/')
      .then(res => {
        const data = res.data?.data ?? res.data?.results ?? res.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setRecProducts(data.map((item, idx) => mapRecProduct(item, idx)));
        } else {
          // Fallback to active catalog products
          api.get('products/?page_size=10')
            .then(pRes => {
              const pData = pRes.data?.data ?? pRes.data?.results ?? pRes.data ?? [];
              if (Array.isArray(pData) && pData.length > 0) {
                setRecProducts(pData.map((item: any, idx: number) => mapRecProduct(item, idx)));
              }
              // else: keep static defaults showing
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // Use static fallback when no backend products loaded yet
  const displayProducts = recProducts.length > 0 ? recProducts : STATIC_REC_PRODUCTS;

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const p = recProducts.find(prod => prod.id === id);
    if (!p) return;
    const item: MockCartItem = { id: p.id, name: p.title, category: 'Clinical Equipment', price: p.price, qty: 1, image: p.image, originalPrice: p.originalPrice };
    if (!guardAction({ type: 'wishlist-toggle', payload: { item } })) return;
    setFavorites(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCartClick = (e: React.MouseEvent, prod: RecProduct) => {
    e.stopPropagation();
    const item: MockCartItem = { id: prod.id, name: prod.title, category: 'Clinical Equipment', price: prod.price, qty: 1, image: prod.image, originalPrice: prod.originalPrice };
    if (!guardAction({ type: 'add-to-cart', payload: { item } })) return;
    setCartItems(prev => {
      const existing = prev.find(c => c.id === prod.id);
      if (existing) return prev.map(c => c.id === prod.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, item];
    });
    if (showToast) showToast('Added to Cart');
  };


  return (

    <>
      {/* Desktop view */}
      <section className="hidden md:block max-w-7xl mx-auto px-8 py-14 select-none">
        {/* CSS overrides for the custom swiper dots and card layout */}
        <style>{`
          .rec-swiper-pagination .swiper-pagination-bullet {
            background: #CBD5E1 !important;
            opacity: 1 !important;
            width: 8px !important;
            height: 4px !important;
            border-radius: 2px !important;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            margin: 0 3px !important;
          }
          .rec-swiper-pagination .swiper-pagination-bullet-active {
            background: #006670 !important;
            width: 24px !important;
          }
          .product-img {
            transform: scale(var(--base-scale));
          }
        `}</style>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006670] shrink-0 mb-0.5"></span>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight font-display">
                Recommended for You
              </h2>
            </div>
            <p className="text-sm text-slate-500 font-medium pl-[18px]">
              Handpicked solutions based on what professionals like you use.
            </p>
          </div>
          <a 
            href="#" 
            className="group inline-flex items-center gap-1.5 text-sm font-bold text-[#006670] hover:text-[#004e56] transition-colors"
          >
            View All Recommendations
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Swiper Slider */}
        <div className="w-full relative px-0">
          <Swiper
            modules={[Pagination, Navigation, Autoplay]}
            pagination={{ clickable: true, el: '.rec-swiper-pagination' }}
            navigation={{
              prevEl: '.rec-prev',
              nextEl: '.rec-next',
            }}
            autoplay={{
              delay: 3500,
              disableOnInteraction: false,
            }}
            loop={displayProducts.length > 5}
            spaceBetween={24}
            slidesPerView={5}
            className="pb-16"
          >
            {displayProducts.map((prod) => (
              <SwiperSlide key={prod.id}>
                <div 
                  style={{ 
                    '--base-scale': prod.scale,
                    '--card-gradient': prod.gradient
                  } as React.CSSProperties}
                  className="group relative bg-white hover:bg-[#f4f8f9] rounded-[24px] p-5 border border-slate-100/90 hover:border-[#006670]/25 shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95),0_12px_36px_-12px_rgba(0,0,0,0.035),0_2px_4px_-1px_rgba(0,0,0,0.01)] hover:shadow-[inset_0_1px_1.5px_rgba(255,255,255,0.95),0_12px_36px_-12px_rgba(0,0,0,0.03),0_2px_4px_-1px_rgba(0,0,0,0.01),0_0_16px_3px_rgba(0, 43, 46,0.055)] transition-all duration-500 ease-out cursor-pointer h-[465px] overflow-hidden"
                  onClick={() => onProductClick(prod.id)}
                >
                  
                  {/* Image Container */}
                  <div 
                    style={{ background: 'var(--card-gradient)' }}
                    className="relative w-full h-[265px] rounded-[18px] overflow-hidden flex items-center justify-center border border-white/70 shadow-[0_8px_25px_-10px_rgba(0,0,0,0.03),0_0_15px_0_rgba(0, 43, 46,0.01)] mb-4 shrink-0"
                  >
                    <div className="absolute inset-0 rounded-[18px] bg-gradient-to-tr from-transparent via-white/5 to-white/15 shadow-[inset_0_2px_4px_rgba(255,255,255,0.7),inset_0_-2px_4px_rgba(0, 43, 46,0.015)] pointer-events-none z-10" />

                    <img 
                      src={prod.image} 
                      alt={prod.title} 
                      className="product-img w-full h-full object-cover z-0"
                    />
                    
                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => toggleFavorite(prod.id, e)}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/45 backdrop-blur-md border border-white/75 text-slate-500 hover:text-[#006670] flex items-center justify-center transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer z-20"
                    >
                      <Heart 
                        className={`w-4 h-4 transition-all duration-300 ${
                          favorites[prod.id] 
                            ? 'fill-[#006670] stroke-[#006670] text-[#006670]' 
                            : 'stroke-slate-500'
                        }`} 
                      />
                    </button>

                    {/* Discount Badge */}
                    {prod.discount && (
                      <span className="absolute top-3 left-3 px-2.5 py-1 text-[9px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#006670] to-[#004e56] rounded-full shadow-[0_2px_8px_rgba(0, 43, 46,0.15)] z-20">
                        {prod.discount}
                      </span>
                    )}
                  </div>

                  {/* Product Information */}
                  <div className="text-left flex-grow flex flex-col justify-between px-1">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 group-hover:text-[#006670] tracking-widest uppercase mb-0.5 transition-colors duration-500">
                        {prod.manufacturer}
                      </p>
                      <h3 className="text-[13px] font-semibold text-slate-800 font-display leading-snug line-clamp-2 min-h-[38px] mb-1">
                        {prod.title}
                      </h3>
                      
                      {/* Star Ratings */}
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <div className="flex items-center text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-3.5 h-3.5 fill-amber-500 stroke-amber-500`} 
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-slate-400 mt-0.5">
                          ({prod.reviews})
                        </span>
                      </div>
                    </div>

                    {/* Pricing and Cart */}
                    <div className="flex items-center justify-between mt-auto pt-0.5">
                      <div className="flex flex-col text-left">
                        <span className="text-[17px] font-extrabold text-slate-900 font-display leading-tight">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-xs text-slate-500 line-through font-medium mt-0.5">
                            ₹{prod.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => handleCartClick(e, prod)}
                        className="flex items-center justify-center h-10 w-10 rounded-full bg-[#006670] hover:bg-[#004e56] text-white shadow-[0_3px_10px_rgba(0, 43, 46,0.14)] hover:shadow-[0_6px_16px_rgba(0, 43, 46,0.22)] hover:scale-[1.03] active:scale-[0.97] cursor-pointer shrink-0 transition-all duration-300">
                        <ShoppingCart className="w-4 h-4 shrink-0 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>
          
          {/* Navigation Controls */}
          <button 
            className="rec-prev absolute -left-12 top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-[#006670] hover:shadow-md transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
            aria-label="Previous recommendation"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </button>

          <button 
            className="rec-next absolute -right-12 top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white border border-slate-100 hover:border-slate-200 text-slate-600 hover:text-[#006670] hover:shadow-md transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95 disabled:opacity-40"
            aria-label="Next recommendation"
          >
            <ChevronRight className="w-5 h-5 stroke-[2]" />
          </button>

          {/* Bullets Pagination */}
          <div className="rec-swiper-pagination flex justify-center items-center gap-1.5 absolute bottom-0 left-0 right-0 z-10" />
        </div>
      </section>

      {/* Mobile view */}
      <section className="block md:hidden w-full px-5 py-6 select-none" id="recommended-mobile">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 text-left">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#006670] shrink-0"></span>
              <h2 className="text-[28px] font-black text-slate-800 tracking-tight font-display leading-tight">
                Recommended
              </h2>
            </div>
            <p className="text-xs text-slate-500 font-medium pl-[18px]">
              Handpicked solutions for your clinic.
            </p>
          </div>
          <a 
            href="#" 
            className="group inline-flex items-center gap-1 text-xs font-bold text-[#006670] hover:text-[#004e56] transition-colors shrink-0"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Swiper Slider */}
        <div className="w-full relative px-0">
          <Swiper
            modules={[Pagination, Autoplay]}
            pagination={{ clickable: true, el: '.rec-swiper-pagination-mobile' }}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}
            loop={displayProducts.length > 1}
            spaceBetween={16}
            slidesPerView={1}
            className="pb-10"
          >
            {displayProducts.map((prod) => (
              <SwiperSlide key={prod.id}>
                <div 
                  className="group relative bg-white rounded-2xl p-4 border border-slate-100/90 shadow-sm flex flex-col justify-between h-[360px] overflow-hidden cursor-pointer"
                  onClick={() => onProductClick(prod.id)}
                >
                  {/* Image Container */}
                  <div 
                    style={{ background: prod.gradient }}
                    className="relative w-full h-[180px] rounded-xl overflow-hidden flex items-center justify-center border border-white/70 mb-3 shrink-0"
                  >
                    <img 
                      src={prod.image} 
                      alt={prod.title} 
                      className="w-[85%] h-[85%] object-contain mix-blend-multiply"
                    />
                    
                    {/* Wishlist Button */}
                    <button 
                      onClick={(e) => toggleFavorite(prod.id, e)}
                      className="absolute top-2.5 right-2.5 w-7.5 h-7.5 rounded-full bg-white/85 text-slate-500 flex items-center justify-center shadow-sm cursor-pointer z-20"
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 ${
                          favorites[prod.id] 
                            ? 'fill-[#006670] stroke-[#006670]' 
                            : 'stroke-slate-500'
                        }`} 
                      />
                    </button>

                    {/* Discount Badge */}
                    {prod.discount && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[8px] font-bold text-white uppercase tracking-wider bg-gradient-to-r from-[#006670] to-[#004e56] rounded-full z-20">
                        {prod.discount}
                      </span>
                    )}
                  </div>

                  {/* Product Information */}
                  <div className="text-left flex-grow flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-0.5">
                        {prod.manufacturer}
                      </p>
                      <h3 className="text-[12.5px] font-semibold text-slate-800 font-display leading-tight line-clamp-2 min-h-[34px] mb-1">
                        {prod.title}
                      </h3>
                      
                      {/* Star Ratings */}
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-amber-500 stroke-amber-500" />
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                          {prod.rating} ({prod.reviews})
                        </span>
                      </div>
                    </div>

                    {/* Pricing and Cart */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        <span className="text-[15px] font-extrabold text-slate-900 font-display">
                          ₹{prod.price.toLocaleString('en-IN')}
                        </span>
                        {prod.originalPrice && (
                          <span className="text-[10px] text-slate-400 line-through font-medium leading-none mt-0.5">
                            ₹{prod.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => handleCartClick(e, prod)}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-[#006670] text-white cursor-pointer shrink-0">
                        <ShoppingCart className="w-3.5 h-3.5 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>

                </div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Bullets Pagination */}
          <div className="rec-swiper-pagination-mobile flex justify-center items-center gap-1.5 absolute bottom-0 left-0 right-0 z-10" />
        </div>
      </section>
    </>
  );
};

export default Recommended;
