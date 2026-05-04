"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

const maxFileSize = 25 * 1024 * 1024;

export function UploadForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setError(null);

    if (file.size > maxFileSize) {
      setError("הקובץ גדול מדי. הגודל המקסימלי הוא 25MB.");
      return;
    }

    const isSupported =
      file.type.startsWith("image/") || file.type === "application/pdf" || file.type.startsWith("video/");

    if (!isSupported) {
      setError("פורמט לא נתמך. אפשר להעלות PDF, תמונות או וידאו.");
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = (await res.json()) as { documentId?: string; error?: string };

      if (!res.ok || !data.documentId) {
        setError(data.error ?? "השרת לא הצליח לקלוט את הקובץ.");
        return;
      }

      router.push(`/documents/${data.documentId}`);
    } catch {
      setError("בעיית רשת. בדקו חיבור ונסו שוב.");
    } finally {
      setBusy(false);
    }
  }

  const handleDrag = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(event.type === "dragenter" || event.type === "dragover");
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void uploadFile(file);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void uploadFile(file);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <form
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onSubmit={(event) => event.preventDefault()}
        className={`surface relative flex min-h-96 flex-col items-center justify-center rounded-3xl p-8 text-center transition ${
          dragActive ? "border-teal-200 bg-teal-200/10" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf,video/*"
          onChange={handleChange}
          className="hidden"
        />

        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-teal-300 text-3xl font-black text-slate-950">
          ↑
        </div>
        <h2 className="mt-6 text-2xl font-black text-white">{busy ? "מעבד את הקובץ..." : "גררו קובץ לכאן"}</h2>
        <p className="mt-3 max-w-md text-sm leading-7 text-slate-300">
          PDF, PNG, JPG או וידאו עד 25MB. אחרי ההעלאה ניתן לערוך את הנתונים שחולצו לפני שמירה סופית.
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          className="focus-ring mt-8 rounded-2xl bg-white px-6 py-3 text-sm font-black text-slate-950 hover:bg-slate-100 disabled:opacity-50"
        >
          בחירת קובץ
        </button>

        {busy && (
          <div className="absolute inset-x-8 bottom-8 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-teal-300" />
          </div>
        )}
      </form>

      <aside className="surface rounded-3xl p-6">
        <h3 className="text-lg font-black text-white">מה יקרה עכשיו?</h3>
        <ol className="mt-5 space-y-4 text-sm leading-7 text-slate-300">
          <li>1. הקובץ נשמר באופן פרטי.</li>
          <li>2. נפתח Job לעיבוד AI.</li>
          <li>3. תועברו למסך המסמך לבדיקה ותיקון.</li>
        </ol>
        <div className="mt-6 rounded-2xl border border-teal-200/20 bg-teal-200/10 p-4 text-sm text-teal-50">
          מצב פרטיות פעיל: הנתונים מוצגים רק למשתמש המחובר.
        </div>
      </aside>

      {error && (
        <div className="lg:col-span-2 rounded-2xl border border-red-300/25 bg-red-400/10 p-4 text-center text-sm font-bold text-red-100">
          {error}
        </div>
      )}
    </div>
  );
}
