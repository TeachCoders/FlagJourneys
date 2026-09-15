"use client";
import React from 'react';
import { SectionLabel } from "@/components/shared/SectionLabel";
import Image from 'next/image';
import { useGuestGallery } from "@/feature/guestGallery/api";
import { MapPin } from 'lucide-react';

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const TravelerMoments: React.FC = () => {
  const { data: apiData } = useGuestGallery(1, 8, true);
  const moments = [...(apiData?.data || [])].sort((a, b) => a.displayOrder - b.displayOrder).slice(0, 8);

  if (moments.length === 0) return null;

  return (
    <section className="py-20 bg-white relative shadow-[inset_0_15px_20px_-15px_rgba(0,0,0,0.06)]">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <SectionLabel>Real Stories</SectionLabel>
            <h2 className="h2 text-[#1C1C1C] mt-2">#FlagJourneyMoments</h2>
            <p className="mt-2 text-base text-[#555]">Join thousands of happy travelers making memories for a lifetime.</p>
          </div>
          <button className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition-colors">
            <InstagramIcon className="w-5 h-5 text-pink-600" />
            <span>Follow Us</span>
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[220px]">
          {moments.map((item, idx) => {
            const isLarge = idx === 0 || idx === 3;
            const altText = [item.caption, item.location].filter(Boolean).join(' at ') || 'Flag Journeys traveler moment';
            return (
              <div
                key={item.id}
                className={`relative rounded-2xl overflow-hidden group cursor-pointer ${
                  isLarge ? 'md:col-span-2 md:row-span-2' : 'col-span-1 row-span-1'
                }`}
              >
                <Image
                  src={item.imageUrl}
                  alt={altText}
                  title={altText}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                  {item.caption && (
                    <h4 className="text-white font-bold text-base leading-tight drop-shadow-md">{item.caption}</h4>
                  )}
                  {item.location && (
                    <p className="text-orange-300 text-xs font-semibold mt-1 flex items-center gap-1">
                      <MapPin size={12} className="text-orange-400" />
                      {item.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TravelerMoments;
