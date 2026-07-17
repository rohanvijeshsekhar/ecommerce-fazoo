'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { api, getAbsoluteImageUrl } from '../../lib/api';

import 'swiper/css';

interface ProductItem {
  id: string;
  title: string;
  subtitle: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
}


interface MockCartItem {
  id: string;
  name: string;
  category: string;
  price: number;
  qty: number;
  image: string;
  originalPrice?: number;
  rating?: number;
}

interface BestSellersProps {
  onProductClick?: (productId: string) => void;
  onOpenLoginModal?: () => void;
  setCartItems: React.Dispatch<React.SetStateAction<MockCartItem[]>>;
  wishlistItems: MockCartItem[];
  setWishlistItems: React.Dispatch<React.SetStateAction<MockCartItem[]>>;
  showToast?: (msg: string) => void;
  initialProducts?: ProductItem[];
}

// ─── Static fallback products used when backend returns none ──────────────
const STATIC_BEST_SELLERS: ProductItem[] = [
  {
    id: 'nsk-ti-max-z900l',
    title: 'NSK Ti-Max Z900L',
    subtitle: 'High-Speed Turbine Handpiece',
    price: 24999,
    rating: 4.8,
    reviews: 124,
    image: '/images/nsk_handpiece_portrait.png',
  },
  {
    id: 'woodpecker-uds-e',
    title: 'Woodpecker UDS-E LED',
    subtitle: 'Ultrasonic Scaler with LED',
    price: 12499,
    rating: 4.7,
    reviews: 87,
    image: '/images/bestseller_scaler.png',
  },
  {
    id: 'dentsply-x-smart',
    title: 'Dentsply X-Smart Plus',
    subtitle: 'Endodontic Motor System',
    price: 38500,
    rating: 4.9,
    reviews: 63,
    image: '/images/bestseller_scaler.png',
  },
];

const BestSellers: React.FC<BestSellersProps> = ({ 
  onProductClick,
  initialProducts
}) => {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts || []);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) return;
    const mapBestSeller = (b: any): ProductItem => {
      const price = b.pricing ? parseFloat(b.pricing.effective_price || b.pricing.selling_price || '0') : 0;
      return {
        id:       b.product_slug ?? b.product,
        title:    b.display_heading || b.product_name,
        subtitle: b.display_short_description || '',
        price:    price,
        rating:   4.8,
        reviews:  12,
        image:    getAbsoluteImageUrl(b.display_image_url) || '/images/nsk_handpiece_portrait.png',
      };
    };

    const mapProductToBestSeller = (p: any): ProductItem => {
      const price = p.pricing ? parseFloat(p.pricing.effective_price || p.pricing.selling_price || '0') : 0;
      return {
        id:       p.slug,
        title:    p.name,
        subtitle: p.short_description || '',
        price:    price,
        rating:   4.8,
        reviews:  12,
        image:    getAbsoluteImageUrl(p.primary_image) || '/images/nsk_handpiece_portrait.png',
      };
    };

    api.get('homepage/best-sellers/')
      .then(res => {
        const data = res.data?.data ?? res.data?.results ?? res.data ?? [];
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data.map(mapBestSeller));
        } else {
          // Fallback to active catalog products
          api.get('products/?page_size=10')
            .then(pRes => {
              const pData = pRes.data?.data ?? pRes.data?.results ?? pRes.data ?? [];
              if (Array.isArray(pData) && pData.length > 0) {
                setProducts(pData.map(mapProductToBestSeller));
              }
              // else: keep static defaults showing
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [initialProducts]);

  // Use static fallback when no backend products loaded yet
  const displayProducts = products.length > 0 ? products : STATIC_BEST_SELLERS;

  return (

    <>
      {/* Desktop view */}
      <section className="hidden md:block w-full bg-white py-20 select-none overflow-hidden" id="products">
        <div className="max-w-[1400px] mx-auto px-4 md:px-12 text-center relative">

          {/* Header Section */}
          <div className="mb-14">
            <span className="block text-[11px] font-extrabold tracking-[0.25em] text-[#006670] uppercase mb-3 font-sans">
              BEST SELLERS
            </span>
            <h2 className="text-4xl md:text-5xl lg:text-[52px] font-medium text-slate-800 tracking-tight leading-tight mb-4">
              Crafted for Precision. Preferred by Experts.
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-medium max-w-xl mx-auto">
              Discover our most trusted products, selected by dental professionals
            </p>
          </div>

          {/* CSS Overrides for Bestseller Swiper scale and opacity */}
          <style>{`
            .bestseller-swiper {
              overflow: visible !important;
            }
            .bestseller-swiper .swiper-slide {
              transform: scale(0.85);
              transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.6s ease;
              opacity: 0.45;
            }
            .bestseller-swiper .swiper-slide-active {
              transform: scale(1.1);
              opacity: 1;
              z-index: 10;
            }
            .bestseller-swiper .swiper-slide-active .slide-details {
              opacity: 1;
              transform: translateY(0);
            }
            .bestseller-swiper .slide-details {
              transition: opacity 0.5s ease, transform 0.5s ease;
            }
          `}</style>

          {/* Carousel Wrapper */}
          <div className="relative w-full px-10 md:px-14">
            <Swiper
              modules={[Navigation, Autoplay]}
              navigation={{
                prevEl: '.bestseller-prev',
                nextEl: '.bestseller-next',
              }}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              loop={displayProducts.length > 3}
              centeredSlides={true}
              slidesPerView={1}
              spaceBetween={20}
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 30,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 40,
                }
              }}
              className="bestseller-swiper pb-8"
            >
              {displayProducts.map((prod) => (
                <SwiperSlide key={prod.id}>
                  <div className="flex flex-col items-center cursor-pointer group" onClick={() => onProductClick?.(prod.id)}>

                    {/* Image Panel (Soft clinical lighting & layout) */}
                    <div className="w-full aspect-square bg-[#F7FAF9] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-shadow duration-300 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.05)] flex items-center justify-center relative">
                      <Image
                        src={prod.image || '/images/nsk_handpiece_portrait.png'}
                        alt={prod.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Centered Details below the Image Panel */}
                    <div className="text-center mt-6 slide-details w-full px-2">
                      <h3 className="text-[15px] sm:text-[16px] font-medium text-slate-800 tracking-tight leading-snug">
                        <span className="block font-bold line-clamp-1 min-h-[22px]">{prod.title}</span>
                        <span className="block text-slate-500 mt-0.5 line-clamp-2 min-h-[36px]">{prod.subtitle}</span>
                      </h3>

                      {/* Price - Bold dark navy */}
                      <p className="text-[16px] font-extrabold text-[#0F2D30] mt-2 font-display">
                        ₹ {prod.price.toLocaleString('en-IN')}
                      </p>

                      {/* Ratings */}
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < Math.floor(prod.rating)
                                  ? 'fill-amber-400 stroke-amber-400'
                                  : 'stroke-slate-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 mt-0.5">
                          {prod.rating}
                          <span className="text-slate-400 font-medium ml-1">({prod.reviews})</span>
                        </span>
                      </div>
                    </div>

                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation Controls on far left/right edges */}
            <button
              className="bestseller-prev absolute left-0 top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0F2D30] text-white flex items-center justify-center hover:bg-[#006670] transition-all shadow-md active:scale-95 cursor-pointer"
              aria-label="Previous bestseller"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            <button
              className="bestseller-next absolute right-0 top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-[#0F2D30] text-white flex items-center justify-center hover:bg-[#006670] transition-all shadow-md active:scale-95 cursor-pointer"
              aria-label="Next bestseller"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>

      {/* Mobile view */}
      <section className="block md:hidden w-full bg-white py-12 select-none overflow-hidden" id="products-mobile">
        <div className="w-full px-5 text-center relative">
          {/* Header Section */}
          <div className="mb-8 text-left">
            <span className="block text-[10px] font-extrabold tracking-[0.25em] text-[#006670] uppercase mb-2 font-sans">
              BEST SELLERS
            </span>
            <h2 className="text-[28px] font-black text-slate-800 tracking-tight leading-tight mb-2 font-display">
              Crafted for Precision.<br />Preferred by Experts.
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Discover our most trusted products.
            </p>
          </div>

          {/* Carousel Wrapper */}
          <div className="relative w-full px-0">
            <Swiper
              modules={[Autoplay]}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              loop={displayProducts.length > 3}
              centeredSlides={true}
              slidesPerView={1.2}
              spaceBetween={16}
              allowTouchMove={true}
              grabCursor={true}
              className="bestseller-swiper pb-6"
            >
              {displayProducts.map((prod) => (
                <SwiperSlide key={prod.id}>
                  <div className="flex flex-col items-center cursor-pointer group text-center" onClick={() => onProductClick?.(prod.id)}>
                    {/* Image Panel */}
                    <div className="w-full aspect-square bg-[#F7FAF9] rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)] transition-shadow duration-300 group-hover:shadow-[0_12px_28px_rgba(0,0,0,0.05)] flex items-center justify-center relative">
                      <Image
                        src={prod.image || '/images/nsk_handpiece_portrait.png'}
                        alt={prod.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover transform transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>

                    {/* Centered Details */}
                    <div className="text-center mt-6 slide-details w-full px-2">
                      <h3 className="text-[14px] sm:text-[15px] font-medium text-slate-800 tracking-tight leading-snug">
                        <span className="block font-bold line-clamp-1 min-h-[20px]">{prod.title}</span>
                        <span className="block text-slate-500 mt-0.5 line-clamp-2 min-h-[32px]">{prod.subtitle}</span>
                      </h3>

                      {/* Price */}
                      <p className="text-[16px] font-extrabold text-[#0F2D30] mt-2 font-display">
                        ₹ {prod.price.toLocaleString('en-IN')}
                      </p>

                      {/* Ratings */}
                      <div className="flex items-center justify-center gap-1.5 mt-2">
                        <div className="flex items-center text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < Math.floor(prod.rating)
                                  ? 'fill-amber-400 stroke-amber-400'
                                  : 'stroke-slate-300'
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-bold text-slate-700 mt-0.5">
                          {prod.rating}
                          <span className="text-slate-400 font-medium ml-1">({prod.reviews})</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </section>
    </>
  );
};

export default BestSellers;
