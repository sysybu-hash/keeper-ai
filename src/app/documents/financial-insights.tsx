"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

type DocumentWithExtraction = {
  extractions: { normalizedJson: unknown }[];
};

type ExtractionData = {
  amount_due?: number;
  is_subscription?: boolean;
  category?: string;
};

function asExtractionData(value: unknown): ExtractionData {
  return typeof value === "object" && value !== null ? (value as ExtractionData) : {};
}

const COLORS = ["#5EEAD4", "#93C5FD", "#FDE047", "#FCA5A5", "#D8B4FE", "#86EFAC"];

export function FinancialInsights({ documents }: { documents: DocumentWithExtraction[] }) {
  const { total, projected, subscriptions, subscriptionTotal, categoryData } = useMemo(() => {
    let t = 0;
    let subTotal = 0;
    const subs: DocumentWithExtraction[] = [];
    const catMap: Record<string, number> = {};

    documents.forEach((doc) => {
      const data = asExtractionData(doc.extractions[0]?.normalizedJson);
      const amount = typeof data.amount_due === "number" ? data.amount_due : 0;
      t += amount;

      if (data.is_subscription) {
        subs.push(doc);
        subTotal += amount;
      }

      const cat = data.category || "אחר";
      catMap[cat] = (catMap[cat] || 0) + amount;
    });

    const categories = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return {
      total: t,
      projected: documents.length > 0 ? (t / 3) * 1.1 : 0,
      subscriptions: subs,
      subscriptionTotal: subTotal,
      categoryData: categories,
    };
  }, [documents]);

  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_1.5fr_1fr]">
      {/* כרטיסייה 1: סיכום כללי */}
      <div className="surface flex flex-col justify-between rounded-3xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-slate-400">תחזית הוצאות לחודש</p>
            <p className="mt-2 text-4xl font-black text-white">
              ₪{projected.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            </p>
            <p className="mt-2 text-sm text-slate-400">
              הוצאות עד כה: ₪{total.toLocaleString("he-IL", { maximumFractionDigits: 0 })}
            </p>
          </div>
          <span className="rounded-full bg-blue-300/15 px-3 py-1 text-xs font-black text-blue-100">AI</span>
        </div>
      </div>

      {/* כרטיסייה 2: גרף התפלגות קטגוריות */}
      <div className="surface rounded-3xl p-6 h-64">
        <p className="mb-4 text-sm font-bold text-slate-400">התפלגות לפי קטגוריות</p>
        <div className="h-44 w-full">
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 20, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 700 }} 
                  width={80} 
                />
                <Tooltip 
                  cursor={{ fill: "rgba(255, 255, 255, 0.05)" }}
                  contentStyle={{ backgroundColor: "#020617", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                  itemStyle={{ color: "#fff", fontWeight: "bold" }}
                  formatter={(value) => [
                    `₪${(typeof value === "number" ? value : Number(value) || 0).toLocaleString()}`,
                    "סכום",
                  ]}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
              אין מספיק נתונים לתצוגה
            </div>
          )}
        </div>
      </div>

      {/* כרטיסייה 3: תובנות קטנות */}
      <div className="surface rounded-3xl p-6">
        <p className="text-lg font-black text-white">תובנות Keeper</p>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm font-black text-white">מנויים פעילים: {subscriptions.length}</p>
            <p className="mt-1 text-xs text-slate-400">סך מזוהה: ₪{subscriptionTotal.toLocaleString("he-IL")}</p>
          </div>
          <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
            <p className="text-sm font-black text-amber-100">בדקו מסמכים שסומנו כדחופים לפני סוף היום.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
