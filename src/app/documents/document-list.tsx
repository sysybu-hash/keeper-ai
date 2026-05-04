"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";

type Doc = {
  id: string;
  originalFilename: string;
  status: string;
  createdAt: string;
  category: string;
  amount: number;
  isUrgent: boolean;
};

const statusClass: Record<string, string> = {
  completed: "border-teal-200/20 bg-teal-200/10 text-teal-100",
  processing: "border-blue-200/20 bg-blue-200/10 text-blue-100",
  failed: "border-red-200/20 bg-red-200/10 text-red-100",
  needs_review: "border-amber-200/20 bg-amber-200/10 text-amber-100",
  queued: "border-slate-200/20 bg-slate-200/10 text-slate-200",
};

export function DocumentList({ initialDocuments }: { initialDocuments: Doc[] }) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(initialDocuments.map((doc) => doc.category).filter(Boolean));
    return ["all", ...Array.from(cats)];
  }, [initialDocuments]);

  const filtered = useMemo(() => {
    return initialDocuments
      .filter((doc) => {
        const matchesSearch = doc.originalFilename.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = filterCategory === "all" || doc.category === filterCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "date") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return b.amount - a.amount;
      });
  }, [filterCategory, initialDocuments, search, sortBy]);

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((d) => d.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleExportCSV = () => {
    const headers = ["ID", "שם קובץ", "קטגוריה", "סכום", "תאריך", "סטטוס", "דחוף"];
    const rows = filtered.map((doc) => [
      doc.id,
      doc.originalFilename.replace(/,/g, ""), // remove commas to avoid CSV breakage
      doc.category || "ללא",
      doc.amount,
      new Date(doc.createdAt).toLocaleDateString("he-IL"),
      doc.status,
      doc.isUrgent ? "כן" : "לא"
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `keeper_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`האם אתה בטוח שברצונך למחוק ${selectedIds.size} מסמכים? פעולה זו אינה הפיכה.`)) return;

    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/documents/${id}`, { method: "DELETE" })
        )
      );
      window.location.reload();
    } catch {
      alert("אירעה שגיאה במחיקת חלק מהמסמכים.");
      setIsDeleting(false);
    }
  };

  return (
    <section className="surface rounded-3xl p-5">
      <div className="mb-5 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-xl font-black text-white">רשימת מסמכים</h2>
          <p className="mt-1 text-sm text-slate-400">{filtered.length} מתוך {initialDocuments.length} מוצגים</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              disabled={isDeleting}
              className="focus-ring rounded-2xl border border-red-300/25 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100 transition hover:bg-red-400/20 disabled:opacity-50"
            >
              {isDeleting ? "מוחק..." : `מחק ${selectedIds.size} נבחרים`}
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="focus-ring rounded-2xl bg-teal-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-200"
          >
            ייצוא ל-CSV
          </button>

          <input
            type="search"
            placeholder="חיפוש מסמך..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="focus-ring rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white placeholder:text-slate-500 xl:w-64"
          />
          <select
            value={filterCategory}
            onChange={(event) => setFilterCategory(event.target.value)}
            className="focus-ring rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "כל הקטגוריות" : category}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "date" | "amount")}
            className="focus-ring rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white"
          >
            <option value="date">תאריך</option>
            <option value="amount">סכום</option>
          </select>
        </div>
      </div>

      <div className="mb-4 flex items-center px-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={filtered.length > 0 && selectedIds.size === filtered.length}
            onChange={toggleSelectAll}
            className="h-5 w-5 accent-teal-300 rounded"
          />
          <span className="text-sm font-bold text-slate-400">בחר הכל</span>
        </label>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm font-bold text-slate-400">
            לא נמצאו מסמכים שמתאימים לחיפוש.
          </div>
        ) : (
          filtered.map((doc) => (
            <div
              key={doc.id}
              className={`grid gap-4 rounded-2xl border bg-white/[0.04] p-4 transition md:grid-cols-[auto_1fr_auto] items-center ${
                selectedIds.has(doc.id) ? "border-teal-300/50 bg-teal-300/5" : "border-white/8 hover:border-teal-200/35 hover:bg-white/[0.07]"
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.has(doc.id)}
                onChange={() => toggleSelect(doc.id)}
                className="h-5 w-5 accent-teal-300 rounded cursor-pointer"
              />
              <Link href={`/documents/${doc.id}`} className="min-w-0 flex-1 block">
                <div className="flex flex-wrap items-center gap-2">
                  {doc.isUrgent && (
                    <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-black text-slate-950">דחוף</span>
                  )}
                  <h3 className="truncate text-base font-black text-white">{doc.originalFilename}</h3>
                </div>
                <p className="mt-2 text-sm text-slate-400">
                  {doc.category || "ללא קטגוריה"} · {new Date(doc.createdAt).toLocaleDateString("he-IL")}
                </p>
              </Link>
              <Link href={`/documents/${doc.id}`} className="flex items-center gap-3 md:justify-end">
                <span className="text-sm font-black text-white">₪{doc.amount.toLocaleString("he-IL")}</span>
                <span className={`rounded-full border px-3 py-1 text-xs font-black ${statusClass[doc.status] ?? statusClass.queued}`}>
                  {t(doc.status as "completed" | "processing" | "failed" | "queued" | "needs_review")}
                </span>
              </Link>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
