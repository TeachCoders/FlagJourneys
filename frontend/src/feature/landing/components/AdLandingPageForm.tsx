"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GripVertical, Pencil, X, CheckCircle2, RotateCcw, Sparkles, MapPin, Compass, Plus, Trash2, HelpCircle } from "lucide-react";
import Link from "next/link";
import FormActionButton from "@/components/shared/customBtns";
import Heading from "@/components/shared/heading";
import SeoFields from "@/components/shared/SeoFields";
import BannerSection from "@/components/shared/BannerSection";
import AsyncMultiSelect from "@/components/shared/AsyncMultiSelect";
import {
  useCreateAdLandingPage,
  useUpdateAdLandingPage,
} from "@/feature/landing/api/useAdLandingPage";
import { useGetCurrentUser } from "@/feature/auth/api/useAuth";
import apiClient from "@/lib/apiClient";
import { errorToast, successToast } from "@/components/shared/tost";
import EntityFields from "@/components/shared/EntityFields";
import RichTextEditor from "@/components/shared/RichTextEditor";
import BannerImageUpload from "@/components/shared/BannerImageUpload";
import FaqEditor, { FaqData } from "@/components/shared/FaqEditor";

interface AdLandingPageFormProps {
  initialData?: any;
  mode: "create" | "edit";
}

const parseJsonArray = (val: any) => {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return [];
};

const parseJsonObject = (val: any) => {
  if (val && typeof val === "object" && !Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
    } catch (e) {}
  }
  return {};
};

export default function AdLandingPageForm({ mode = "create", initialData }: AdLandingPageFormProps) {
  const router = useRouter();
  const { createAdLandingPage, isPending: isCreating } = useCreateAdLandingPage();
  const { updateAdLandingPage, isPending: isUpdating } = useUpdateAdLandingPage();
  const { user } = useGetCurrentUser();

  const normalizedRole = (user?.role ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const isSuperAdmin = normalizedRole.includes("super") && normalizedRole.includes("admin");
  const isITTeam = user?.team?.name?.toLowerCase().includes("it") || user?.team?.name?.toLowerCase().includes("maintenance");
  const canEdit = isSuperAdmin || isITTeam;

  const [seoData, setSeoData] = useState({
    title: initialData?.title || "",
    slug: initialData?.slug || "",
    seoDescription: initialData?.seoDescription || "",
    overView: "",
    seoKeyword: "",
    thumbImg: "",
    seoTitle: initialData?.seoTitle || "",
    h1Title: initialData?.h1Title || "",
  });

  const [heroFields, setHeroFields] = useState<Record<string, string>>({
    theme: initialData?.theme || "",
    heroHeading: initialData?.heroHeading || "",
    heroSubheading: initialData?.heroSubheading || "",
    ctaText: initialData?.ctaText || "Enquire Now",
  });

  const [bannerImages, setBannerImages] = useState<string[]>(parseJsonArray(initialData?.bannerImages));
  const [bannerFiles, setBannerFiles] = useState<{ file: File; index: number }[]>([]);
  const [whyChooseImages, setWhyChooseImages] = useState<string[]>(parseJsonArray(initialData?.whyChooseImages));
  const [whyChooseFiles, setWhyChooseFiles] = useState<{ file: File; index: number }[]>([]);
  const [isActive, setIsActive] = useState<boolean>(initialData?.isActive ?? true);
  const [ctaFormEnabled, setCtaFormEnabled] = useState<boolean>(initialData?.ctaFormEnabled ?? true);
  const [linkedTourPackageIds, setLinkedTourPackageIds] = useState<number[]>(parseJsonArray(initialData?.linkedTourPackageIds));
  const [linkedJourneyIds, setLinkedJourneyIds] = useState<number[]>(parseJsonArray(initialData?.linkedJourneyIds));
  const [linkedDestinationType, setLinkedDestinationType] = useState<string>(initialData?.linkedDestinationType || "");
  const [linkedDestinationIds, setLinkedDestinationIds] = useState<number[]>(parseJsonArray(initialData?.linkedDestinationIds));
  const [customCardOverrides, setCustomCardOverrides] = useState<Record<string, any>>(parseJsonObject(initialData?.customCardOverrides));
  const customCardOverridesRef = useRef<Record<string, any>>(parseJsonObject(initialData?.customCardOverrides));
  const [faqs, setFaqs] = useState<FaqData[]>(() => {
    const raw = initialData?.customFaqs || initialData?.faqs;
    const parsed = parseJsonArray(raw);
    if (parsed.length > 0) {
      return parsed.map((item: any) => ({
        ques: item.ques || item.question || "",
        ans: item.ans || item.answer || "",
      }));
    }
    return [];
  });
  
  // Loaded journey details for preview cards
  const [journeyItems, setJourneyItems] = useState<any[]>([]);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; image: string; description: string; highlightsText: string; highlightsHtml?: string }>({
    name: "",
    image: "",
    description: "",
    highlightsText: "",
    highlightsHtml: "",
  });

  // Fetch full details of linked journeys for card preview
  useEffect(() => {
    if (linkedJourneyIds.length === 0) {
      setJourneyItems([]);
      return;
    }

    let isMounted = true;
    const fetchJourneys = async () => {
      try {
        const promises = linkedJourneyIds.map((id) =>
          apiClient.get(`/journey/${id}`).then((res) => res.data?.data).catch(() => null)
        );
        const results = await Promise.all(promises);
        if (isMounted) {
          setJourneyItems(results.filter(Boolean));
        }
      } catch (err) {
        console.error("Error loading journeys", err);
      }
    };

    fetchJourneys();
    return () => { isMounted = false; };
  }, [linkedJourneyIds]);

  const defaultOrder = [
    { id: "hero", label: "Hero Section" },
    { id: "packages", label: "Selected Packages" },
    { id: "why-choose", label: "Why Choose Us" },
    { id: "faq", label: "FAQ" },
    { id: "cta", label: "CTA Block" }
  ];
  
  const rawSections = parseJsonArray(initialData?.sectionsOrder);
  const initialOrder = rawSections.length > 0 
    ? rawSections.map((id: string) => defaultOrder.find(o => o.id === id) || { id, label: id }) 
    : defaultOrder;

  const [sectionsOrder, setSectionsOrder] = useState(initialOrder);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLoading = isCreating || isUpdating;

  const handleSeoFieldChange = (name: string, value: string) => {
    setSeoData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };
  
  const handleHeroFieldChange = (name: string, value: string) => {
    setHeroFields((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenEditCard = (journey: any) => {
    const override = customCardOverrides[journey.id] || customCardOverrides[String(journey.id)] || customCardOverrides[Number(journey.id)] || {};
    setEditingCard(journey);
    const existingHighlights = override.highlights || journey.highlights || [];
    let hText = "";
    if (Array.isArray(existingHighlights)) {
      hText = existingHighlights.map((item: string) => `<li>${item}</li>`).join("");
      if (hText) hText = `<ul>${hText}</ul>`;
    } else if (typeof existingHighlights === "string") {
      hText = existingHighlights;
    }

    setEditForm({
      name: override.name || journey.title || "",
      image: override.image || journey.thumbImg || "",
      description: override.description || journey.shortDescription || journey.overView || "",
      highlightsText: hText,
      highlightsHtml: hText,
    });
  };

  const handleSaveCardOverride = () => {
    if (!editingCard) return;
    const rawVal = editForm.highlightsHtml || editForm.highlightsText || "";
    let highlightsArr: string[] = [];

    if (rawVal.includes("<")) {
      if (typeof window !== "undefined") {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = rawVal;
        const liElements = tempDiv.querySelectorAll("li");
        if (liElements.length > 0) {
          highlightsArr = Array.from(liElements).map((el) => el.textContent?.trim() || "").filter(Boolean);
        } else {
          const pElements = tempDiv.querySelectorAll("p");
          if (pElements.length > 0) {
            highlightsArr = Array.from(pElements).map((el) => el.textContent?.trim() || "").filter(Boolean);
          } else {
            highlightsArr = tempDiv.textContent?.split("\n").map((s) => s.trim()).filter(Boolean) || [];
          }
        }
      }
    } else {
      highlightsArr = rawVal.split("\n").map((h) => h.trim()).filter(Boolean);
    }

    const newOverride = {
      name: editForm.name.trim(),
      image: editForm.image.trim(),
      description: editForm.description.trim(),
      highlights: highlightsArr,
    };

    const updated = {
      ...customCardOverridesRef.current,
      [editingCard.id]: newOverride,
      [String(editingCard.id)]: newOverride,
    };
    customCardOverridesRef.current = updated;
    setCustomCardOverrides(updated);
    setEditingCard(null);
    successToast("Card customization saved!");
  };

  const handleResetCardOverride = (journeyId: number) => {
    const copy = { ...customCardOverridesRef.current };
    delete copy[journeyId];
    delete copy[String(journeyId)];
    delete copy[Number(journeyId)];
    customCardOverridesRef.current = copy;
    setCustomCardOverrides(copy);
    setEditingCard(null);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    const data = e.dataTransfer.getData("text/plain");
    if (!data) return;
    const dragIndex = parseInt(data);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;
    const newOrder = [...sectionsOrder];
    const draggedItem = newOrder[dragIndex];
    if (!draggedItem) return;
    newOrder.splice(dragIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItem);
    setSectionsOrder(newOrder);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!seoData.title.trim()) newErrors.title = "Title is required";
    if (!seoData.seoDescription.trim()) newErrors.seoDescription = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    let finalBannerImages = bannerImages.slice(0, 1);
    try {
      if (bannerFiles.length > 0) {
        const fileObj = bannerFiles[0];
        if (fileObj) {
          const fd = new FormData();
          fd.append("category", "banner");
          fd.append("filename", seoData.slug ? `${seoData.slug}-hero-1` : `new-lp-hero-1`);
          fd.append("label", seoData.slug ? `${seoData.slug}-hero-1` : `LP Hero 1`);
          fd.append("file", fileObj.file);
          const res = await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
          const url = res.data?.url;
          if (url) finalBannerImages = [url];
        }
      }
    } catch {
      return errorToast("Banner upload failed, please try again");
    }

    let finalWhyChooseImages = whyChooseImages;
    try {
      if (whyChooseFiles.length > 0) {
        const merged = [...whyChooseImages];
        const ordered = [...whyChooseFiles].sort((a, b) => a.index - b.index);
        for (const { file, index } of ordered) {
          const fd = new FormData();
          fd.append("category", "gallery");
          fd.append("filename", seoData.slug ? `${seoData.slug}-gallery-${index + 1}` : `new-lp-gallery-${index + 1}`);
          fd.append("label", seoData.slug ? `${seoData.slug}-gallery-${index + 1}` : `LP Gallery ${index + 1}`);
          fd.append("file", file);
          const res = await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
          const url = res.data?.url;
          if (url) merged.splice(index, 0, url);
        }
        finalWhyChooseImages = merged;
      }
    } catch {
      return errorToast("Gallery image upload failed, please try again");
    }

    const payload: any = {
      title: seoData.title.trim(),
      slug: seoData.slug.trim().replace(/-+$/g, "") || undefined,
      seoDescription: seoData.seoDescription.trim(),
      seoTitle: seoData.seoTitle.trim() || undefined,
      h1Title: seoData.h1Title.trim() || undefined,
      theme: heroFields.theme.trim() || undefined,
      heroHeading: heroFields.heroHeading.trim() || undefined,
      heroSubheading: heroFields.heroSubheading.trim() || undefined,
      ctaText: heroFields.ctaText.trim() || undefined,
      bannerImages: finalBannerImages,
      whyChooseImages: finalWhyChooseImages,
      isActive,
      ctaFormEnabled,
      linkedTourPackageIds,
      linkedJourneyIds,
      linkedDestinationType: linkedDestinationType || undefined,
      linkedDestinationIds,
      customCardOverrides: customCardOverridesRef.current,
      customFaqs: faqs.filter((f) => f.ques.trim() || f.ans.trim()),
      sectionsOrder: sectionsOrder.map((s: any) => s.id),
    };

    if (mode === "edit" && initialData?.id) {
      updateAdLandingPage(
        { id: initialData.id, ...payload },
      ).then(() => router.push("/dashboard/ad-landing-pages"));
    } else {
      createAdLandingPage(payload).then(() => router.push("/dashboard/ad-landing-pages"));
    }
  };

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <p className="text-sm">You don&apos;t have permission to {mode} ad landing pages.</p>
        <Link href="/dashboard/ad-landing-pages" className="text-sm text-brand-600 mt-2 hover:underline">Go back</Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/ad-landing-pages" className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <Heading
          heading={mode === "create" ? "Create Ad Landing Page" : "Edit Ad Landing Page"}
          tagLine={mode === "create" ? "Add a new landing page" : `Editing ${initialData?.title || "page"}`}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <SeoFields
          formData={seoData}
          onFieldChange={handleSeoFieldChange}
          onDescriptionChange={() => {}}
          onThumbImgUpload={() => {}}
          errors={errors}
          basePath=""
          folderPath={seoData.slug ? `${seoData.slug}/lp` : ""}
          bannerImages={[]}
          hideShortDesc={true}
          hideThumbnail={true}
          hideKeywords={true}
          hideCanonical={true}
        />

        {/* Unified Hero Banner & Content Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Hero Section & Banner Image</h2>
          
          <div className="space-y-4">
            <BannerImageUpload
              value={bannerImages}
              onChange={setBannerImages}
              onFilesSelect={(files, indices) =>
                setBannerFiles(files.map((file, i) => ({ file, index: indices?.[i] ?? bannerImages.length + i })))
              }
              label="Hero Background Image (Single Image)"
              maxImages={1}
              folderPath={seoData.slug ? `${seoData.slug}/lp` : ""}
            />

            <div className="pt-2 border-t border-slate-100">
              <BannerImageUpload
                value={whyChooseImages}
                onChange={setWhyChooseImages}
                onFilesSelect={(files, indices) =>
                  setWhyChooseFiles(files.map((file, i) => ({ file, index: indices?.[i] ?? whyChooseImages.length + i })))
                }
                label="Why Choose Us / Sightseeing & Activity Gallery Images (Optional)"
                maxImages={10}
                folderPath={seoData.slug ? `${seoData.slug}/lp-gallery` : "lp-gallery"}
              />
              <p className="text-xs text-slate-400 mt-1">Upload multiple attraction, activity, or sightseeing photos to display in the &apos;Why Book With Flag Journeys&apos; photo gallery slider.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Offer Badge / Theme (e.g. Honeymoon, Wildlife)</label>
                <input
                  type="text"
                  value={heroFields.theme}
                  onChange={(e) => handleHeroFieldChange("theme", e.target.value)}
                  placeholder="e.g. honeymoon"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={heroFields.ctaText}
                  onChange={(e) => handleHeroFieldChange("ctaText", e.target.value)}
                  placeholder="Enquire Now"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Heading</label>
                <input
                  type="text"
                  value={heroFields.heroHeading}
                  onChange={(e) => handleHeroFieldChange("heroHeading", e.target.value)}
                  placeholder="High converting headline"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none font-semibold text-slate-900"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hero Subheading</label>
                <textarea
                  rows={2}
                  value={heroFields.heroSubheading}
                  onChange={(e) => handleHeroFieldChange("heroSubheading", e.target.value)}
                  placeholder="Persuasive text describing the offer"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Product Picker (Selected Journeys)</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select Journeys to Display</label>
              <AsyncMultiSelect
                selectedIds={linkedJourneyIds}
                onChange={setLinkedJourneyIds}
                fetchOptions={async (search) => {
                  const res = await apiClient.get("/journey/all", { params: { search, limit: 20 } });
                  const items = Array.isArray(res.data) ? res.data : (res.data?.data || []);
                  return items.map((item: any) => ({ id: item.id, title: item.title || item.name }));
                }}
                placeholder="Select Journeys..."
              />
            </div>

            {/* Selected Journey Cards Preview & Inline Override Editor */}
            {journeyItems.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="text-orange-500" size={18} />
                      Landing Page Card Customizations ({journeyItems.length} Selected)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Customize Title, Image, Highlights, or Description <span className="font-semibold text-orange-600">ONLY for this Landing Page</span> without affecting the main database.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {journeyItems.map((j) => {
                    const override = customCardOverrides[j.id] || customCardOverrides[String(j.id)] || customCardOverrides[Number(j.id)] || {};
                    const isCustomized = Boolean(override.name || override.image || override.description || override.highlights?.length);
                    const displayName = override.name || j.title;
                    const rawImg = override.image || j.thumbImg || j.banner?.images?.[0] || "";
                    const displayImage = rawImg.includes("photo-1590523741831-ab7e8b8f9c7f") ? "" : rawImg;
                    const displayDesc = override.description || j.shortDescription || j.overView || "";
                    const displayHighlights = override.highlights || j.highlights || [];

                    return (
                      <div
                        key={j.id}
                        className={`relative rounded-2xl border ${
                          isCustomized ? "border-orange-300 bg-orange-50/20" : "border-slate-200 bg-white"
                        } shadow-sm p-4 flex flex-col justify-between transition-all`}
                      >
                        {/* Status Badge */}
                        <div className="flex items-center justify-between mb-3">
                          <span
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                              isCustomized
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            {isCustomized ? "⚡ Customized for Landing Page" : "Default Journey Data"}
                          </span>

                          <div className="flex items-center gap-2">
                            {isCustomized && (
                              <button
                                type="button"
                                onClick={() => handleResetCardOverride(j.id)}
                                className="text-xs text-slate-400 hover:text-red-500 flex items-center gap-1 font-medium transition"
                                title="Reset to original journey details"
                              >
                                <RotateCcw size={12} /> Reset
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCard(j)}
                              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-sm transition"
                            >
                              <Pencil size={13} /> Edit Card
                            </button>
                          </div>
                        </div>

                        {/* Card Content Preview */}
                        <div className="flex gap-3">
                          {displayImage ? (
                            <img
                              src={displayImage}
                              alt={displayName}
                              className="w-24 h-24 object-cover rounded-xl border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-300 via-slate-400 to-slate-500 shrink-0 flex flex-col items-center justify-center text-slate-800 p-2 text-center shadow-inner relative overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md border border-white/40 flex items-center justify-center mb-1 shadow-md">
                                <Compass size={20} className="text-slate-800" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-800">FlagJourney</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{displayName}</h4>
                            <div className="text-xs text-slate-500 line-clamp-2 mt-1" dangerouslySetInnerHTML={{ __html: displayDesc || "No description set" }} />
                            
                            {displayHighlights.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {displayHighlights.slice(0, 2).map((hl: string, idx: number) => (
                                  <div key={idx} className="flex items-center gap-1 text-[11px] text-slate-600">
                                    <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                    <span className="line-clamp-1">{hl}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Custom FAQs Section */}
        <FaqEditor faqs={faqs} setFaqs={setFaqs} />

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Section Layout Order</h2>
          <p className="text-xs text-slate-500">Drag and drop to reorder the sections on the landing page.</p>
          <div className="space-y-2 max-w-lg">
            {sectionsOrder.map((section: any, index: number) => (
              <div 
                key={section.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, index)}
                className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-grab active:cursor-grabbing hover:bg-slate-100 transition-colors"
              >
                <GripVertical size={16} className="text-slate-400" />
                <span className="font-medium text-sm text-slate-700">{section.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pb-8">
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-slate-300"
              />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={ctaFormEnabled}
                onChange={(e) => setCtaFormEnabled(e.target.checked)}
                className="rounded border-slate-300"
              />
              Enable CTA Form
            </label>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/ad-landing-pages"
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <FormActionButton
              text={isLoading ? (mode === "create" ? "Creating..." : "Updating...") : (mode === "create" ? "Create Page" : "Update Page")}
              type="submit"
              isLoading={isLoading}
              size="md"
            />
          </div>
        </div>
      </form>
      {/* Inline Modal Editor for Landing Page Card Overrides */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center shrink-0">
                  <Pencil size={20} className="text-orange-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white tracking-tight">
                    Edit Card Details for Landing Page
                  </h3>
                  <p className="text-xs text-slate-300 font-medium">
                    Changes apply ONLY to this Landing Page. Original journey data will remain safe.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0 ml-4"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Card Title / Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="e.g. 10 Days Luxury Golden Triangle & Varanasi Special"
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Card Image URL
                </label>
                <input
                  type="text"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
                {editForm.image && (
                  <img src={editForm.image} alt="Preview" className="w-full h-32 object-cover rounded-xl mt-2 border border-slate-200" />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Short Description (Rich Text Editor)
                </label>
                <RichTextEditor
                  content={editForm.description}
                  onChange={(html) => setEditForm((prev) => ({ ...prev, description: html }))}
                  placeholder="Add a rich formatted summary for this landing page..."
                  minHeight="min-h-[140px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Journey Highlights (Rich Text Editor)
                </label>
                <RichTextEditor
                  content={editForm.highlightsHtml || editForm.highlightsText}
                  onChange={(html) => setEditForm((prev) => ({ ...prev, highlightsHtml: html, highlightsText: html }))}
                  placeholder="Add bullet points or formatted highlights for this card..."
                  minHeight="min-h-[140px]"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingCard(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveCardOverride();
                  setTimeout(() => {
                    const formEl = document.querySelector("form");
                    if (formEl) formEl.requestSubmit();
                  }, 100);
                }}
                className="px-5 py-2 text-sm font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                Save & Update Landing Page Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
