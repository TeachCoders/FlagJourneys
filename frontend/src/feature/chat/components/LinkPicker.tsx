"use client";

import React, { useState } from "react";
import { Link2, Search } from "lucide-react";
import { useLinkCandidates, FaqLinkType, LinkCandidate } from "@/feature/chat/api/useChat";
import { LINK_TYPE_OPTIONS, ChatFaq } from "@/feature/chat/api";

export type LinkState = {
  linkType: FaqLinkType | "";
  linkEntityId: number | null;
  linkTitle: string;
  linkUrl: string;
};

export const emptyLink: LinkState = { linkType: "", linkEntityId: null, linkTitle: "", linkUrl: "" };

export const fromFaq = (faq?: ChatFaq | null): LinkState => ({
  linkType: faq?.linkType || "",
  linkEntityId: faq?.linkEntityId ?? null,
  linkTitle: faq?.linkTitle || "",
  linkUrl: faq?.linkUrl || "",
});

export const LinkPicker: React.FC<{
  value: LinkState;
  onChange: (next: LinkState) => void;
}> = ({ value, onChange }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const { candidates, isLoading } = useLinkCandidates(
    value.linkType === "" ? null : value.linkType,
    search
  );

  const pick = (c: LinkCandidate) => {
    onChange({
      ...value,
      linkEntityId: c.id,
      linkTitle: c.title,
      linkUrl: c.url,
    });
    setOpen(false);
  };

  const isEntityType = value.linkType !== "" && value.linkType !== "custom";
  const hasSelection = Boolean(value.linkEntityId && value.linkTitle && value.linkUrl);

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-zinc-600 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" />
          Link page / entity <span className="text-zinc-400">(optional)</span>
        </label>
        {value.linkType !== "" && (
          <button
            type="button"
            onClick={() => onChange({ ...emptyLink })}
            className="text-[11px] text-zinc-400 hover:text-red-500 font-medium"
          >
            Remove link
          </button>
        )}
      </div>

      <select
        value={value.linkType}
        onChange={(e) => onChange({ ...emptyLink, linkType: e.target.value as FaqLinkType | "" })}
        className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E8B8B]"
      >
        {LINK_TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {isEntityType && (
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder="Search and select (e.g., Honeymoon, Rajasthan...)"
              className="w-full bg-white border border-zinc-200 rounded-xl pl-9 pr-3 py-2 text-sm outline-none focus:border-[#2E8B8B]"
            />
          </div>
          {open && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-zinc-200 rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {isLoading && <p className="px-3 py-2 text-xs text-zinc-400">Loading...</p>}
              {!isLoading && (!candidates || candidates.length === 0) && (
                <p className="px-3 py-2 text-xs text-zinc-400">No results found.</p>
              )}
              {!isLoading &&
                (candidates || []).slice(0, 30).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-zinc-800">{c.title}</p>
                    {c.subtitle && <p className="text-[11px] text-zinc-400 truncate">{c.subtitle}</p>}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {isEntityType && hasSelection && (
        <div className="flex items-center justify-between gap-2 bg-teal-50 border border-teal-100 rounded-xl px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-teal-800 truncate">{value.linkTitle}</p>
            <p className="text-[11px] text-teal-600 truncate">{value.linkUrl}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...value, linkEntityId: null, linkTitle: "", linkUrl: "" })}
            className="text-[11px] text-teal-700 hover:text-red-600 shrink-0 font-medium"
          >
            Change
          </button>
        </div>
      )}

      {value.linkType === "custom" && (
        <div className="space-y-2">
          <input
            value={value.linkTitle}
            onChange={(e) => onChange({ ...value, linkTitle: e.target.value })}
            placeholder="Link name (e.g. — FlagJourney Packages page)"
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E8B8B]"
            maxLength={500}
          />
          <input
            value={value.linkUrl}
            onChange={(e) => onChange({ ...value, linkUrl: e.target.value })}
            placeholder="https://www.flagjourneys.com/..."
            className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#2E8B8B]"
            maxLength={500}
          />
        </div>
      )}
    </div>
  );
};

export default LinkPicker;
