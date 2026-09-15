"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, HeartHandshake, Banknote, UserCheck, ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react";

interface AdWhyChooseUsProps {
  images?: string[];
  hideGallery?: boolean;
}

export default function AdWhyChooseUs({ images = [], hideGallery = false }: AdWhyChooseUsProps) {
  const defaultGallery: string[] = [];

  const galleryImages = images && images.length > 0 ? images : defaultGallery;
  const showGallery = !hideGallery && galleryImages.length > 0;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!showGallery || galleryImages.length <= 1 || isLightboxOpen) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [showGallery, galleryImages.length, isLightboxOpen]);

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const features = [
    {
      icon: Banknote,
      title: "Direct Local Pricing",
      description: "No middlemen or platform commissions. We connect you directly with local hoteliers and cab operators for the best price.",
    },
    {
      icon: UserCheck,
      title: "100% Custom Itineraries",
      description: "Don't like waking up early? Want a specific hotel? We build the entire trip schedule exactly the way you want it.",
    },
    {
      icon: HeartHandshake,
      title: "24/7 Personal Trip Manager",
      description: "From the moment you land until you fly back, a dedicated local expert is always available on WhatsApp/Call for any help.",
    },
    {
      icon: ShieldCheck,
      title: "Verified Safe Transport",
      description: "All our vehicles are thoroughly sanitized, and drivers are verified professionals with years of experience in local terrains.",
    }
  ];

  return (
    <section className="py-20 bg-white border-t border-slate-200 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className={`grid grid-cols-1 ${showGallery ? "lg:grid-cols-2 gap-12" : "gap-12"} items-center`}>
          
          {/* Left Column: Heading & 4 Text Features */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-6">
              Why Book With Flag Journeys?
            </h2>
            <p className="text-slate-600 text-lg mb-10 leading-relaxed">
              Unlike huge travel portals that treat you like a booking number, we focus on delivering personalized, high-quality local experiences with complete transparency.
            </p>
            
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${!showGallery ? "lg:grid-cols-4" : ""} gap-8`}>
              {features.map((f, idx) => {
                const Icon = f.icon;
                return (
                  <div key={idx} className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm border border-orange-100">
                      <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-slate-900 leading-snug">{f.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right Column: Photo Slider + Lightbox Feature */}
          {showGallery && (
            <div className="relative group">
              {/* Original Rotated Warm Yellow/Orange Accent Backdrop */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/25 via-orange-400/15 to-amber-500/10 rounded-[40px] transform rotate-3" />
              
              <div 
                className="relative z-10 w-full h-[520px] sm:h-[600px] rounded-[40px] overflow-hidden shadow-2xl bg-white border border-slate-100 cursor-pointer"
                onClick={() => setIsLightboxOpen(true)}
              >
                
                {/* Expand Lightbox Hint Icon */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(true);
                  }}
                  className="absolute top-5 right-5 z-30 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-90 hover:opacity-100 hover:scale-110 shadow-lg border border-white/30"
                  title="Expand Fullscreen Lightbox"
                >
                  <Maximize2 size={18} />
                </button>

                {/* Horizontal Track Slider */}
                <div className="w-full h-full overflow-hidden relative">
                  <div
                    className="flex w-full h-full transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                  >
                    {galleryImages.map((imgUrl, idx) => (
                      <div key={idx} className="min-w-full h-full relative shrink-0">
                        <img
                          src={imgUrl}
                          alt={`Sightseeing Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultGallery[idx % defaultGallery.length];
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Controls */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-slate-200/60 opacity-90 hover:opacity-100"
                      aria-label="Previous Slide"
                    >
                      <ChevronLeft size={22} />
                    </button>

                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-white/90 hover:bg-white text-slate-900 flex items-center justify-center shadow-lg backdrop-blur-md transition-all hover:scale-105 active:scale-95 border border-slate-200/60 opacity-90 hover:opacity-100"
                      aria-label="Next Slide"
                    >
                      <ChevronRight size={22} />
                    </button>

                    {/* Indicator Dots */}
                    <div className="absolute bottom-6 inset-x-0 z-30 flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                        {galleryImages.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentIndex(idx);
                            }}
                            className={`h-2 rounded-full transition-all ${
                              idx === currentIndex ? "w-6 bg-orange-500" : "w-2 bg-white/70 hover:bg-white"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

              </div>
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 z-50 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full backdrop-blur-md transition-all"
            title="Close Lightbox"
          >
            <X size={24} />
          </button>

          {/* Photo Counter */}
          <div className="absolute top-6 left-6 z-50 text-white/90 font-bold text-sm bg-black/50 px-4 py-2 rounded-full border border-white/20 backdrop-blur-md">
            {currentIndex + 1} / {galleryImages.length}
          </div>

          {/* Lightbox Image Container */}
          <div 
            className="relative max-w-5xl max-h-[85vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[currentIndex]}
              alt={`Lightbox Photo ${currentIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultGallery[currentIndex % defaultGallery.length];
              }}
            />

            {/* Prev / Next Buttons in Lightbox */}
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="absolute left-2 sm:-left-12 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-black p-3.5 rounded-full border border-white/30 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronLeft size={28} />
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="absolute right-2 sm:-right-12 top-1/2 -translate-y-1/2 text-white bg-black/60 hover:bg-black p-3.5 rounded-full border border-white/30 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                >
                  <ChevronRight size={28} />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
