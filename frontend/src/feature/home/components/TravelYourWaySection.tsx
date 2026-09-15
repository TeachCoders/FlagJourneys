"use client";
import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { SectionLabel } from "@/components/shared/SectionLabel";

export default function SeoTextBlock() {
  return (
    <section className="bg-white border-b border-slate-100 py-12">
      <div className="max-w-[1600px] mx-auto px-6 sm:px-8 lg:px-10">

        <div>
          <SectionLabel icon={<BookOpen className="w-4 h-4" />}>Our Story</SectionLabel>
          <h2 className="h2 text-[#1C1C1C] mt-2">About <span className="text-[#D4561A]">Flag Journeys</span></h2>
        </div>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <div>
            <h4 className="text-slate-800 font-semibold text-sm mb-2">Making Every Journey Memorable</h4>
            <p className="text-slate-500 text-sm leading-relaxed">This is not just our tagline — it is our commitment. At Flag Journeys, we believe that a great trip is not measured by how many places you visited, but by how deeply you experienced them. Every itinerary we craft carries our signature blend of care, authenticity, and personal attention.</p>
          </div>
          <div>
            <h4 className="text-slate-800 font-semibold text-sm mb-2">Atithi Devo Bhava — Guest is God</h4>
            <p className="text-slate-500 text-sm leading-relaxed">Our brand is rooted in India's oldest tradition of hospitality. We welcome every traveler — international visitors, NRIs, and domestic explorers — with warmth, transparency, and zero compromise on quality. No hidden costs, no middlemen, no shortcuts.</p>
          </div>
          <div>
            <h4 className="text-slate-800 font-semibold text-sm mb-2">A Brand Built on Trust</h4>
            <p className="text-slate-500 text-sm leading-relaxed">Thousands of travelers have trusted Flag Journeys to plan their most important moments — honeymoons, family trips, anniversary getaways, and bucket-list adventures. Their stories, smiles, and shared memories are what define who we are as a brand.</p>
          </div>
        </div>

        <div className="mt-8">
          <Link
            href="/about-us"
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
          >
            Learn more about us
            <ArrowRight size={14} />
          </Link>
        </div>

      </div>
    </section>
  );
}
