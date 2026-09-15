"use client";

import { useRef, useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export interface ExportRow {
  [key: string]: string | number | null | undefined;
}

interface ExportMenuProps {
  title: string;
  columns: string[];
  rows: ExportRow[];
}

function toCsv(columns: string[], rows: ExportRow[]): string {
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map((c) => esc(c)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c])).join(",")).join("\n");
  return `${header}\n${body}`;
}

export default function ExportMenu({ title, columns, rows }: ExportMenuProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  const handlePdf = useReactToPrint({
    contentRef: printRef,
    documentTitle: title.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
    onBeforePrint: () => {
      setPdfBusy(true);
      return Promise.resolve();
    },
    onAfterPrint: () => setPdfBusy(false),
  });

  const downloadCsv = () => {
    const csv = toCsv(columns, rows);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-1.5">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={downloadCsv}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => handlePdf()}
              disabled={pdfBusy}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
            >
              {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin text-red-600" /> : <FileText className="h-4 w-4 text-red-600" />}
              Save as PDF
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden printable report (renders only for the PDF printer). */}
      <div className="hidden print:block">
        <div ref={printRef} className="bg-white p-8">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-slate-900">{title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              Generated {new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              {" · "}Flag Journeys UX Analytics
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="text-sm text-slate-500">No data in the selected range.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c} className="border border-slate-300 bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c} className="border border-slate-200 px-3 py-1.5 text-slate-700">
                        {r[c] ?? "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}