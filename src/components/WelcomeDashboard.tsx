"use client";

import { useSession } from "next-auth/react";

export function WelcomeDashboard() {
  const { data: session } = useSession();
  const hours = new Date().getHours();
  const greeting = hours < 12 ? "בוקר טוב" : hours < 18 ? "צהריים טובים" : "ערב טוב";

  return (
    <section className="surface mb-8 rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Dashboard</p>
          <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            {greeting}, {session?.user?.name || "אורח"}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            זה מרכז הבקרה של המסמכים שלך: מה עבר עיבוד, מה דורש בדיקה ומה כדאי לסגור היום.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:min-w-80">
          <div className="rounded-2xl bg-white/8 p-4">
            <p className="text-xs font-bold text-slate-400">מסמכים החודש</p>
            <p className="mt-2 text-3xl font-black text-white">24</p>
          </div>
          <div className="rounded-2xl bg-teal-300 p-4 text-slate-950">
            <p className="text-xs font-black">חיסכון משוער</p>
            <p className="mt-2 text-3xl font-black">₪420</p>
          </div>
        </div>
      </div>
    </section>
  );
}
