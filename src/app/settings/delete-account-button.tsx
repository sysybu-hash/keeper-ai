"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function DeleteAccountButton() {
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!confirm("למחוק את כל הנתונים ואת החשבון? פעולה בלתי הפיכה.")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/account/delete-data", { method: "POST" });
      if (!res.ok) {
        alert("מחיקה נכשלה");
        return;
      }
      await signOut({ callbackUrl: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => void onDelete()}
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
    >
      {busy ? "מוחק…" : "מחיקת כל הנתונים והחשבון"}
    </button>
  );
}
