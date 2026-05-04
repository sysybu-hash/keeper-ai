"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLiveAssistant } from "@/lib/contexts/LiveAssistantContext";

type ExtractionData = {
  document_type?: string;
  entity?: string;
  amount_due?: number | null;
  currency?: string | null;
  due_date?: string | null;
  issue_date?: string | null;
  category?: string;
  is_subscription?: boolean;
  market_benchmark?: string;
  suggested_folder?: string;
  summary?: string;
  full_ocr_text?: string;
  is_urgent?: boolean;
  references?: {
    invoice_number?: string | null;
    customer_id?: string | null;
  };
};

type DocPayload = {
  document: {
    id: string;
    originalFilename: string;
    status: string;
    driveWebViewLink: string | null;
    calendarEventId: string | null;
    extractions: { id: string; normalizedJson: ExtractionData }[];
    jobs: { id: string; status: string; lastError: string | null }[];
  };
};

const statusHe: Record<string, string> = {
  queued: "בתור",
  processing: "מעבד",
  needs_review: "דורש בדיקה",
  completed: "הושלם",
  failed: "נכשל",
};

const inputClass =
  "focus-ring w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white placeholder:text-slate-500";
const labelClass = "mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500";

export function DocumentDetail({ id, initialData }: { id: string; initialData: DocPayload }) {
  const [data, setData] = useState<DocPayload>(initialData);
  const [formData, setFormData] = useState<ExtractionData | null>(initialData.document.extractions[0]?.normalizedJson || null);
  const [saveMsg, setSaveMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [busy, setBusy] = useState(false);
  const [viewMode, setViewMode] = useState<"form" | "json" | "ocr">("form");

  const { setContextData } = useLiveAssistant();

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) return;
    const payload = (await res.json()) as DocPayload;
    setData(payload);
    setFormData(payload.document.extractions[0]?.normalizedJson || null);
  }, [id]);

  useEffect(() => {
    const latest = data.document.extractions[0];
    if (latest?.normalizedJson && !formData) setFormData(latest.normalizedJson);
  }, [data, formData]);

  // Set AI context based on the currently viewed document
  useEffect(() => {
    if (data && formData) {
      setContextData({
        id: data.document.id,
        originalFilename: data.document.originalFilename,
        summary: formData.summary,
        full_ocr_text: formData.full_ocr_text,
      });
    }

    return () => {
      // Clear AI context when leaving the page
      setContextData(null);
    };
  }, [data, formData, setContextData]);

  async function saveChanges() {
    if (!formData) return;
    setSaveMsg(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ normalizedJson: formData }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveMsg({ text: body.error ?? "השמירה נכשלה", type: "error" });
        return;
      }
      setSaveMsg({ text: "השינויים נשמרו", type: "success" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function deleteDocument() {
    if (!confirm("למחוק את המסמך?")) return;
    setBusy(true);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/documents";
      return;
    }
    setSaveMsg({ text: "המחיקה נכשלה", type: "error" });
    setBusy(false);
  }

  async function reprocessDocument() {
    setBusy(true);
    await fetch(`/api/documents/${id}/reprocess`, { method: "POST" });
    await load();
    setBusy(false);
  }

  if (!formData) {
    return (
      <div className="surface rounded-3xl p-10 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-teal-300 border-t-transparent" />
        <p className="mt-4 text-sm text-slate-400">ממתין לנתוני עיבוד...</p>
      </div>
    );
  }

  const { document: doc } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/documents" className="text-sm font-bold text-teal-100 hover:text-teal-50">
            חזרה לרשימה
          </Link>
          <h1 className="mt-3 truncate text-3xl font-black text-white">{doc.originalFilename}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-black text-white">
              {statusHe[doc.status] ?? doc.status}
            </span>
            {doc.driveWebViewLink && (
              <a href={doc.driveWebViewLink} target="_blank" className="text-sm font-bold text-blue-100 hover:text-white">
                פתיחה ב-Google Drive
              </a>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void reprocessDocument()}
            disabled={busy}
            className="focus-ring rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            עיבוד מחדש
          </button>
          <button
            type="button"
            onClick={() => void deleteDocument()}
            disabled={busy}
            className="focus-ring rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100 disabled:opacity-50"
          >
            מחיקה
          </button>
        </div>
      </header>

      {doc.jobs[0]?.lastError && (
        <div className="rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-sm text-red-100">
          {doc.jobs[0].lastError}
        </div>
      )}

      <nav className="flex overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-1">
        {[
          ["form", "עריכה"],
          ["json", "JSON"],
          ["ocr", "OCR"],
        ].map(([mode, label]) => (
          <button
            key={mode}
            type="button"
            onClick={() => setViewMode(mode as "form" | "json" | "ocr")}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-black transition ${
              viewMode === mode ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {viewMode === "form" ? (
        <section className="surface grid gap-5 rounded-3xl p-6 md:grid-cols-2">
          <label>
            <span className={labelClass}>סוג מסמך</span>
            <input
              className={inputClass}
              value={formData.document_type || ""}
              onChange={(event) => setFormData({ ...formData, document_type: event.target.value })}
              placeholder="למשל: חשבון חשמל"
            />
          </label>
          <label>
            <span className={labelClass}>קטגוריה</span>
            <input
              className={inputClass}
              value={formData.category || ""}
              onChange={(event) => setFormData({ ...formData, category: event.target.value })}
              placeholder="למשל: חשמל, מים, תקשורת, רפואי, ממשלתי..."
            />
          </label>
          <label>
            <span className={labelClass}>ספק או ישות</span>
            <input
              className={inputClass}
              value={formData.entity || ""}
              onChange={(event) => setFormData({ ...formData, entity: event.target.value })}
              placeholder="למשל: חברת החשמל"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className={labelClass}>סכום לתשלום</span>
              <input
                type="number"
                className={inputClass}
                value={formData.amount_due ?? ""}
                onChange={(event) => setFormData({ ...formData, amount_due: event.target.value ? Number(event.target.value) : null })}
                placeholder="0.00"
              />
            </label>
            <label>
              <span className={labelClass}>מטבע</span>
              <select
                className={inputClass}
                value={formData.currency || "ILS"}
                onChange={(event) => setFormData({ ...formData, currency: event.target.value })}
              >
                <option value="ILS">ILS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>
          </div>
          <label>
            <span className={labelClass}>תאריך הפקה</span>
            <input
              type="date"
              className={inputClass}
              value={formData.issue_date || ""}
              onChange={(event) => setFormData({ ...formData, issue_date: event.target.value || null })}
            />
          </label>
          <label>
            <span className={labelClass}>תאריך פירעון</span>
            <input
              type="date"
              className={inputClass}
              value={formData.due_date || ""}
              onChange={(event) => setFormData({ ...formData, due_date: event.target.value || null })}
            />
          </label>
          <label>
            <span className={labelClass}>מספר חשבונית / אסמכתא</span>
            <input
              className={inputClass}
              value={formData.references?.invoice_number || ""}
              onChange={(event) => setFormData({ ...formData, references: { ...(formData.references || {}), invoice_number: event.target.value || null } })}
              placeholder="למשל: 123456"
            />
          </label>
          <label>
            <span className={labelClass}>מזהה לקוח / חוזה</span>
            <input
              className={inputClass}
              value={formData.references?.customer_id || ""}
              onChange={(event) => setFormData({ ...formData, references: { ...(formData.references || {}), customer_id: event.target.value || null } })}
              placeholder="למשל: 98765"
            />
          </label>
          <label>
            <span className={labelClass}>חריגה ממחיר השוק (Market Benchmark)</span>
            <input
              className={inputClass}
              value={formData.market_benchmark || ""}
              onChange={(event) => setFormData({ ...formData, market_benchmark: event.target.value })}
              placeholder="למשל: המחיר גבוה ב-20% מהממוצע"
            />
          </label>
          <label>
            <span className={labelClass}>תיקייה מוצעת (Drive)</span>
            <input
              className={inputClass}
              value={formData.suggested_folder || ""}
              onChange={(event) => setFormData({ ...formData, suggested_folder: event.target.value })}
              placeholder="בית/חשבונות"
            />
          </label>
          <label className="md:col-span-2">
            <span className={labelClass}>תקציר המסמך</span>
            <textarea
              className={`${inputClass} min-h-28`}
              value={formData.summary || ""}
              onChange={(event) => setFormData({ ...formData, summary: event.target.value })}
              placeholder="תקציר קצר של המסמך"
            />
          </label>
          
          <div className="md:col-span-2 grid gap-5 sm:grid-cols-2 mt-2">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 cursor-pointer hover:bg-white/[0.06] transition">
              <input
                type="checkbox"
                checked={formData.is_urgent || false}
                onChange={(event) => setFormData({ ...formData, is_urgent: event.target.checked })}
                className="h-5 w-5 accent-teal-300"
              />
              <span className="text-sm font-bold text-white">מסמך דחוף שדורש טיפול מיידי</span>
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 cursor-pointer hover:bg-white/[0.06] transition">
              <input
                type="checkbox"
                checked={formData.is_subscription || false}
                onChange={(event) => setFormData({ ...formData, is_subscription: event.target.checked })}
                className="h-5 w-5 accent-teal-300"
              />
              <span className="text-sm font-bold text-white">תשלום חוזר / מנוי</span>
            </label>
          </div>
        </section>
      ) : viewMode === "json" ? (
        <section className="surface rounded-3xl p-6">
          <span className={labelClass}>נתונים גולמיים</span>
          <textarea
            className="focus-ring h-96 w-full rounded-2xl border border-white/10 bg-slate-950 p-4 font-mono text-xs text-teal-100"
            value={JSON.stringify(formData, null, 2)}
            onChange={(event) => {
              try {
                setFormData(JSON.parse(event.target.value) as ExtractionData);
              } catch {
                // Keep the previous valid object while the user is typing invalid JSON.
              }
            }}
            spellCheck={false}
          />
        </section>
      ) : (
        <section className="surface rounded-3xl p-6">
          <span className={labelClass}>טקסט OCR מלא</span>
          <div className="h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-slate-950 p-5 text-sm leading-7 text-slate-300">
            {formData.full_ocr_text || "לא זוהה טקסט מלא במסמך הזה."}
          </div>
        </section>
      )}

      <footer className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => void saveChanges()}
          disabled={busy}
          className="focus-ring rounded-2xl bg-teal-300 px-6 py-3 text-sm font-black text-slate-950 hover:bg-teal-200 disabled:opacity-50"
        >
          {busy ? "שומר..." : "שמירת שינויים"}
        </button>
        {saveMsg && (
          <p className={`text-sm font-bold ${saveMsg.type === "success" ? "text-teal-100" : "text-red-100"}`}>
            {saveMsg.text}
          </p>
        )}
        {doc.calendarEventId && (
          <a
            href={`https://calendar.google.com/calendar/u/0/r/eventedit/${doc.calendarEventId.split("@")[0]}`}
            target="_blank"
            className="text-sm font-bold text-blue-100 hover:text-white"
          >
            פתיחה ביומן
          </a>
        )}
      </footer>
    </div>
  );
}
