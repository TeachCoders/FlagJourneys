"use client";

import { Fragment, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useReplaySessions,
  useReplay,
  useDeleteReplay,
} from "@/feature/analytics/api/useAnalytics";
import ReplayPlayer from "@/components/analytics/ReplayPlayer";
import type { ReplaySessionInfo } from "@/feature/analytics/api";

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

const BOT_LABEL: Record<string, string> = {
  search_crawler: "Search crawler (Googlebot etc.)",
  ai_crawler: "AI crawler (GPTBot etc.)",
  other_bot: "Bot / scraper",
  cloud_ip: "Cloud / datacenter IP",
  multi_ua: "Multi-UA device farm (same IP, many devices)",
};

export default function ReplaysBrowser() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [kind, setKind] = useState<"all" | "humans" | "bots">("all");
  const [page, setPage] = useState(1);
  const { sessions, totals, page: currentPage, totalPages, isLoading, error } = useReplaySessions({ page, kind });
  const { replay, isLoading: replayLoading } = useReplay(selectedId);
  const deleteReplay = useDeleteReplay();

  const switchKind = (next: "all" | "humans" | "bots") => {
    setKind(next);
    setPage(1);
    setSelectedId(null);
  };

  return (
    <div className="space-y-6">
      {!isLoading && !error && (
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              ["all", `All (${totals.all})`],
              ["humans", `Humans (${totals.humans})`],
              ["bots", `Bots (${totals.bots})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => switchKind(key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                kind === key
                  ? "bg-slate-800 text-white shadow-sm"
                  : key === "bots"
                    ? "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="h-72 animate-pulse rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 h-4 w-32 rounded bg-slate-200" />
          <div className="space-y-3">
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-12 rounded-lg bg-slate-100" />
            <div className="h-12 rounded-lg bg-slate-100" />
          </div>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load replay sessions.
        </div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
          {kind === "bots"
            ? "No bot sessions on record. Nice."
            : "No recordings yet. Browse the public site in another tab — batches arrive every ~5 seconds and appear here."}
        </div>
      )}

      {sessions.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-800 text-xs uppercase tracking-wider text-white">
                  <th className="rounded-tl-lg px-5 py-2.5 font-medium">Started</th>
                  <th className="px-5 py-2.5 font-medium">Last Activity</th>
                  <th className="px-5 py-2.5 font-medium">Country</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Device</th>
                  <th className="px-5 py-2.5 font-medium">Visitor</th>
                  <th className="rounded-tr-lg px-5 py-2.5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(sessions as ReplaySessionInfo[]).map((s) => {
                  const isOpen = selectedId === s.sessionId;
                  return (
                    <Fragment key={s.sessionId}>
                      <tr
                        className={`transition-colors hover:bg-slate-50 ${
                          isOpen ? "bg-indigo-50/70" : ""
                        }`}
                      >
                        <td className="whitespace-nowrap px-5 py-2.5 font-medium text-slate-800">{fmtDate(s.startedAt)}</td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-slate-600">{fmtDate(s.lastEventAt)}</td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-slate-600">{s.country || "—"}</td>
                        <td className="whitespace-nowrap px-5 py-2.5">
                          {s.isBot ? (
                            <span
                              title={BOT_LABEL[s.botSource || "other_bot"]}
                              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-700"
                            >
                              🤖 Bot
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                              Human
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-slate-600">{s.deviceType || "—"}</td>
                        <td className="px-5 py-2.5 font-mono text-xs text-slate-400">
                          {(s.visitorId || s.sessionId).slice(0, 8)}…
                        </td>
                        <td className="whitespace-nowrap px-5 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant={isOpen ? "outline" : "default"}
                            onClick={() => setSelectedId(isOpen ? null : s.sessionId)}
                          >
                            {isOpen ? "✕ Close" : "▶ Play"}
                          </Button>{" "}
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={deleteReplay.isPending}
                            onClick={() => deleteReplay.mutate(s.sessionId)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-white">
                          <td colSpan={7} className="border-b border-indigo-100 p-0">
                            <div className="border-t border-indigo-100 bg-slate-50">
                              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                                <span className="text-sm font-medium text-slate-700">
                                  Session Replay · Guest Visitor ·{" "}
                                  {fmtDate(s.startedAt)}
                                </span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedId(null)}
                                >
                                  ✕ Close
                                </Button>
                              </div>
                              <div className="px-4 pb-4" key={s.sessionId}>
                                {replayLoading || !replay ? (
                                  <div className="flex h-[420px] items-center justify-center text-slate-500 animate-pulse">
                                    Loading recording…
                                  </div>
                                ) : replay.count === 0 ? (
                                  <p className="py-10 text-center text-slate-500">
                                    No events recorded for this session.
                                  </p>
                                ) : (
                                  <ReplayPlayer replay={replay} />
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-500">
                Page {currentPage} of {totalPages} · {sessions.length} shown
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage <= 1}
                  onClick={() => {
                    setPage(currentPage - 1);
                    setSelectedId(null);
                  }}
                >
                  ← Prev
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  onClick={() => {
                    setPage(currentPage + 1);
                    setSelectedId(null);
                  }}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}