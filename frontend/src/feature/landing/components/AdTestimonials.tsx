"use client";

import React from "react";
import { Star, Quote } from "lucide-react";

interface AdTestimonialsProps {
  destinationName?: string;
}

export default function AdTestimonials({ destinationName = "our destination" }: AdTestimonialsProps) {
  const testimonials = [
    {
      name: "James & Eleanor Vance",
      location: "London, UK",
      text: `Honestly, landing in Delhi at 2 AM was overwhelming, but seeing our driver Ramesh holding our nameplate with a big smile put us at ease. He kept cold water in the car, helped us in Jaipur markets, and took us to a quiet rooftop cafe facing the Taj. The sunrise boat ride in Varanasi was the highlight of our trip!`,
      rating: 5,
      trip: "Golden Triangle & Varanasi · 8 Days",
    },
    {
      name: "Robert Chang",
      location: "Sydney, Australia",
      text: `I've traveled to 30+ countries and India was the most complex trip to plan. FlagJourney sorted everything over WhatsApp. When our flight got delayed on day 3, the ground team reshuffled our hotel pickup the same night without extra charge. Boat ride in Varanasi at dawn was unbelievable!`,
      rating: 5,
      trip: "Rajasthan & Varanasi · 10 Days",
    },
    {
      name: "Sofia & Luca",
      location: "Milan, Italy",
      text: `Our honeymoon in Kerala was magical. Many agencies gave us identical copy-paste packages. FlagJourney listened to what we actually wanted (less temples, more nature and calm backwaters) and built a custom plan. The private houseboat in Alleppey with just the two of us was unforgettable!`,
      rating: 5,
      trip: "Kerala Honeymoon · 8 Days",
    }
  ];

  return (
    <section className="py-20 bg-slate-50 border-t border-slate-200 overflow-hidden">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Real Stories From Our Guests
          </h2>
          <p className="text-slate-600 text-base mt-3">
            Real stories from our guests who experienced the perfect holiday with zero stress.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-lg relative">
              <Quote className="absolute top-6 right-6 text-slate-100" size={60} />
              
              <div className="flex gap-1 mb-6 relative z-10">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} size={18} className="text-orange-500 fill-orange-500" />
                ))}
              </div>
              
              <p className="text-slate-700 leading-relaxed relative z-10 mb-8 italic">
                "{t.text}"
              </p>
              
              <div className="flex items-center gap-4 relative z-10 mt-auto border-t border-slate-100 pt-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4561A] to-[#E8A317] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm border-2 border-white select-none">
                  {(t.name || "A").trim().charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500">{t.location}</p>
                  {(t as any).trip && (
                    <p className="text-[11px] text-orange-500 font-semibold mt-0.5">✈ {(t as any).trip}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
