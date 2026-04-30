"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type DocPayload = {
  document: {
    id: string;
    originalFilename: string;
    status: string;
    driveWebViewLink: string | null;
    calendarEventId: string | null;
    extractions: { id: string; normalizedJson: unknown }[];
    jobs: { id: string; status: string; lastError: string | null }[];
  };
};

const statusHe: Record<string, string> = {
  queued: "בתור",
  processing: "מעבד",
  needs_review: "דורש אישור",
  completed: "הושלם",
  failed: "נכשל",
};

export function DocumentDetail({ id }: { id: string }) {
  const [data, setData] = useState<DocPayload | null>(null);
  const [jsonText, setJsonText] = useState("");
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${id}`);
    if (!res.ok) return;
    const payload = (await res.json()) as DocPayload;
    setData(payload);
    const latest = payload.document.extractions[0];
    if (latest?.normalizedJson) {
      setJsonText(JSON.stringify(latest.normalizedJson, null, 2));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data?.document.status) return;
    if (data.document.status !== "queued" && data.document.status !== "processing") return;
    const t = setInterval(() => void load(), 2500);
    return () => clearInterval(t);
  }, [data?.document.status, load]);

  async function saveJson() {
    setSaveMsg(null);
    setBusy(true);
    try {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText) as unknown;
      } catch {
        setSaveMsg("JSON לא תקין");
        return;
      }
      const res = await fetch(`/api/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ normalizedJson: parsed }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSaveMsg(body.error ?? "שמירה נכשלה");
        return;
      }
      setSaveMsg("נשמר");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function reprocess() {
    setBusy(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/documents/${id}/reprocess`, { method: "POST" });
      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setSaveMsg(body.error ?? "שגיאה");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">טוען…</p>;
  }

  const { document: doc } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">{doc.originalFilename}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          סטטוס: <strong>{statusHe[doc.status] ?? doc.status}</strong>
        </p>
        {doc.driveWebViewLink ? (
          <p className="mt-2 text-sm">
            <a href={doc.driveWebViewLink} className="text-blue-600 underline" target="_blank" rel="noreferrer">
              פתיחה ב-Google Drive
            </a>
          </p>
        ) : null}
        {doc.calendarEventId ? (
          <p className="mt-1 text-sm text-zinc-500">נוצר אירוע ביומן (מזהה: {doc.calendarEventId})</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void reprocess()}
          className="rounded border border-zinc-300 bg-white px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
        >
          הרצת עיבוד מחדש
        </button>
        <Link href="/documents" className="rounded border border-transparent px-3 py-1.5 text-sm text-zinc-600 underline">
          חזרה לרשימה
        </Link>
      </div>

      {doc.jobs[0]?.lastError && doc.status === "failed" ? (
        <pre className="overflow-x-auto rounded bg-red-50 p-3 text-xs text-red-800">{doc.jobs[0].lastError}</pre>
      ) : null}

      {doc.extractions[0] ? (
        <div>
          <h2 className="text-sm font-medium text-zinc-800">חילוץ (JSON)</h2>
          <textarea
            className="mt-2 h-96 w-full rounded border border-zinc-300 p-3 font-mono text-xs text-zinc-800"
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            spellCheck={false}
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void saveJson()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              שמירת תיקון
            </button>
            {saveMsg ? <span className="text-sm text-zinc-600">{saveMsg}</span> : null}
          </div>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">אין עדיין חילוץ — ממתינים לעיבוד…</p>
      )}
    </div>
  );
}
