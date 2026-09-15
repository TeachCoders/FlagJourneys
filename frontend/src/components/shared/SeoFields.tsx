"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import RichTextEditor from "@/components/shared/RichTextEditor";
import ImageCropUpload from "@/components/shared/ImageCropUpload";
import MediaLibrary from "@/components/shared/MediaLibrary";
import apiClient from "@/lib/apiClient";
import { Grid3X3 } from "lucide-react";

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toSlugTyping(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/g, "");
}

function cleanSlug(text: string): string {
  return text.replace(/-+$/g, "");
}

interface SeoFieldsProps {
  formData: {
    title: string;
    slug: string;
    seoDescription: string;
    overView: string;
    seoKeyword: string;
    thumbImg: string;
    seoTitle?: string;
    h1Title?: string;
  };
  onFieldChange: (name: string, value: string) => void;
  onDescriptionChange: (html: string) => void;
  onThumbImgUpload?: (url: string) => void;
  onBannerSelect?: (url: string) => void; // cross-mode: add to banner
  errors: Record<string, string>;
  basePath?: string;
  folderPath?: string;
  bannerImages?: string[];
  hideShortDesc?: boolean;
  hideThumbnail?: boolean;
  hideKeywords?: boolean;
  hideCanonical?: boolean;
}

export default function SeoFields({
  formData,
  onFieldChange,
  onDescriptionChange,
  onThumbImgUpload,
  onBannerSelect,
  errors,
  basePath = "/country",
  folderPath = "",
  bannerImages = [],
  hideShortDesc = false,
  hideThumbnail = false,
  hideKeywords = false,
  hideCanonical = false,
}: SeoFieldsProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const userEditedSlug = useRef(false);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://flagjourneys.com";

  useEffect(() => {
    if (formData.slug) {
      userEditedSlug.current = true;
    }
  }, []);

  const handleTitleChange = useCallback(
    (value: string) => {
      onFieldChange("title", value);
      if (!userEditedSlug.current) {
        onFieldChange("slug", toSlug(value));
      }
    },
    [onFieldChange]
  );

  const handleSlugChange = useCallback(
    (value: string) => {
      userEditedSlug.current = true;
      onFieldChange("slug", toSlugTyping(value));
    },
    [onFieldChange]
  );

  const canonicalUrl = formData.slug
    ? `${siteUrl}${basePath}/${formData.slug}`.replace(/([^:])\/+/g, "$1/")
    : "";

  const handleThumbUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("category", "thumb");
    const filename = formData.slug || formData.title;
    if (filename) {
      fd.append("filename", filename.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-thumb");
      fd.append("label", `${filename} - Thumbnail`);
    }
    fd.append("file", file);
    try {
      const res = await apiClient.post("/upload", fd);
      if (res.data?.url) {
        onThumbImgUpload?.(res.data.url);
      }
    } catch (err) {
      console.error("Thumb upload failed", err);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between gap-4">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
          SEO Details
        </h3>
      </div>

      <div className="p-6 pt-2 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">
              SEO Title
            </Label>
            <Input
              value={formData.seoTitle || ""}
              onChange={(e) => onFieldChange("seoTitle", e.target.value)}
              placeholder="e.g. Best India Tour Packages"
            />
            <p className="text-[10px] text-slate-400">
              Appears in the browser tab and Google search results.
            </p>
          </div>

          {/* <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">
              Page Name
            </Label>
            <Input
              value={formData.title || ""}
              onChange={(e) => onFieldChange("title", e.target.value)}
              placeholder="Page name"
            />
          </div> */}

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">
              Page Heading (H1) <span className="text-red-500">*</span>
            </Label>
            <Input
              value={formData.h1Title || formData.title || ""}
              onChange={(e) => {
                onFieldChange("h1Title", e.target.value);
                handleTitleChange(e.target.value);
              }}
              placeholder="e.g. Explore India Tours"
              className={errors.title ? "border-red-500" : ""}
            />
            <p className="text-[10px] text-slate-400">
              The topmost heading on the page. Also used as the system name.
            </p>
            {errors.title && (
              <p className="text-xs text-red-500">Page heading is required</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">Slug</Label>
            <Input
              value={formData.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              onBlur={() => onFieldChange("slug", cleanSlug(formData.slug))}
              placeholder="Auto-generated from title"
            />
            <p className="text-[10px] text-slate-400">
              Auto-generated from title. You can edit it manually.
            </p>
          </div>
        </div>

        {!hideKeywords && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">
              SEO Keywords
            </Label>
            <Textarea
              value={formData.seoKeyword}
              onChange={(e) => onFieldChange("seoKeyword", e.target.value)}
              placeholder="SEO keywords — separate with commas"
              rows={3}
            />
            <p className="text-[10px] text-slate-400">
              Keywords for search engines (separate with commas).
            </p>
          </div>
        )}

        {!hideCanonical && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">
              Canonical URL
            </Label>
            <Input
              value={canonicalUrl}
              readOnly
              className="bg-slate-50 text-slate-500"
            />
            <p className="text-[10px] text-slate-400">
              This URL tells Google that this is the original page. Auto-generated from Title/Slug.
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <Label className="text-sm font-semibold text-slate-600">
            SEO Meta Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            value={formData.seoDescription}
            onChange={(e) => onFieldChange("seoDescription", e.target.value)}
            placeholder="Input under 200 words"
            rows={4}
            className={errors.seoDescription ? "border-red-500" : ""}
          />
          <p className="text-[10px] text-slate-400">
            Shown as the seoDescription in Google search results (up to ~160 characters).
          </p>
          {errors.seoDescription && (
            <p className="text-xs text-red-500">{errors.seoDescription}</p>
          )}
        </div>

        {!hideShortDesc && (
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-slate-600">
              Overview
            </Label>
            <RichTextEditor
              content={formData.overView}
              onChange={onDescriptionChange}
              placeholder="Input under 200 words"
            />
            <p className="text-[10px] text-slate-400">
              A short intro/overview shown in the page content.
            </p>
          </div>
        )}

        {!hideThumbnail && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-600">
                Thumbnail Image
              </Label>
              {/* Switch: use banner image as thumb */}
              {bannerImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const url = bannerImages[0];
                    onFieldChange("thumbImg", url);
                    onThumbImgUpload?.(url);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-brand-primary border border-brand-primary/30 bg-brand-primary/5 hover:bg-brand-primary/10 rounded-lg transition-colors"
                  title="Use first banner image as thumbnail"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" />
                  </svg>
                  Use Banner Image
                </button>
              )}
            </div>

            {formData.thumbImg ? (
              <div className="relative inline-block">
                <img
                  src={formData.thumbImg}
                  alt="Thumbnail"
                  className="w-32 h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => onFieldChange("thumbImg", "")}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No thumbnail yet — upload one below or choose from the library.</p>
            )}
            <div className="space-y-2">
              <ImageCropUpload
                onFileSelect={handleThumbUpload}
                maxWidth={400}
                maxHeight={300}
                outputFormat="image/jpeg"
                quality={0.85}
                label={formData.thumbImg ? "Upload / Replace Thumbnail" : "Upload Thumbnail"}
              />
              <button
                type="button"
                onClick={() => setMediaOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-brand-primary/40 rounded-xl bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors"
              >
                <Grid3X3 size={16} className="text-brand-primary" />
                <span className="text-sm font-medium text-brand-primary">Browse Library</span>
              </button>
            </div>
          </div>
        )}

        <MediaLibrary
          open={mediaOpen}
          onClose={() => setMediaOpen(false)}
          onSelect={(url) => onThumbImgUpload?.(url)}
          title="Select Thumbnail"
        />
      </div>
    </div>
  );
}
