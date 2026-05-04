"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function ActiveChannels() {
  const { data: session } = useSession();
  const [copied, setCopied] = useState(false);
  const uploadKey = session?.user?.id?.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) || "user";
  const keeperEmail = `upload+${uploadKey}@keeper-ai.com`;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(keeperEmail);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="surface rounded-3xl p-5">
      <h3 className="text-lg font-black text-white">ערוצי קליטה</h3>
      <p className="mt-2 text-sm leading-7 text-slate-400">
        אפשר להפנות מסמכים ישירות ל-Keeper בלי העלאה ידנית.
      </p>

      <div className="mt-5 space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">כתובת אישית</p>
          <code className="mt-2 block break-all text-sm font-bold text-teal-100">{keeperEmail}</code>
          <button
            type="button"
            onClick={() => void copyToClipboard()}
            className="focus-ring mt-3 rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-950"
          >
            {copied ? "הועתק" : "העתקה"}
          </button>
        </div>

        <div className="rounded-2xl border border-teal-200/20 bg-teal-200/10 p-4">
          <p className="text-sm font-black text-teal-50">WhatsApp AI</p>
          <p className="mt-1 text-xs leading-6 text-teal-100/80">פעיל לבדיקות. שלחו מסמך ל-Keeper והמערכת תפתח רשומה.</p>
        </div>
      </div>
    </section>
  );
}
