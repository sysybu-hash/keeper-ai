"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { LoginButton } from "@/components/LoginButton";
import { useI18n } from "@/lib/i18n";

const featureCards = [
  {
    title: "חילוץ נתונים",
    body: "סכומים, תאריכי פירעון, ספקים וסיכומים נשמרים במבנה שאפשר לערוך.",
    accent: "bg-teal-300",
  },
  {
    title: "תיוק מסודר",
    body: "כל מסמך מקבל קטגוריה ותיקייה מוצעת, עם קישור ל-Google Drive כשקיים חיבור.",
    accent: "bg-blue-300",
  },
  {
    title: "מעקב שקט",
    body: "מסמכים דחופים, תשלומים קרובים ושגיאות עיבוד עולים למסך לפני שהם נעלמים.",
    accent: "bg-amber-300",
  },
];

export default function Home() {
  const { data: session } = useSession();
  const { t } = useI18n();

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <section className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="py-12 sm:py-20">
          <p className="mb-5 inline-flex rounded-full border border-teal-200/25 bg-teal-200/10 px-4 py-2 text-sm font-bold text-teal-100">
            {t("mvp")}
          </p>
          <h1 className="max-w-3xl text-5xl font-black tracking-tight text-white sm:text-7xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-semibold text-gradient">{t("heroSubtitle")}</p>
          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{t("description")}</p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {session?.user ? (
              <>
                <Link
                  href="/upload"
                  className="focus-ring rounded-2xl bg-teal-300 px-6 py-4 text-center text-sm font-black text-slate-950 hover:bg-teal-200"
                >
                  {t("upload")}
                </Link>
                <Link
                  href="/documents"
                  className="focus-ring rounded-2xl border border-white/15 bg-white/8 px-6 py-4 text-center text-sm font-bold text-white hover:bg-white/12"
                >
                  {t("myDocuments")}
                </Link>
              </>
            ) : (
              <LoginButton />
            )}
          </div>
        </div>

        <div className="surface overflow-hidden rounded-3xl p-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400">Inbox health</p>
                <p className="text-3xl font-black text-white">Clear</p>
              </div>
              <span className="rounded-full bg-teal-300/15 px-3 py-1 text-xs font-bold text-teal-100">Live</span>
            </div>
            {[
              ["חשבון חשמל", "₪342", "לתשלום עד 12.05"],
              ["ביטוח בריאות", "נבדק", "סווג כרפואי"],
              ["ארנונה", "דורש בדיקה", "סכום לא ודאי"],
            ].map(([name, value, meta]) => (
              <div key={name} className="mb-3 grid grid-cols-[1fr_auto] gap-4 rounded-2xl bg-white/[0.06] p-4">
                <div>
                  <p className="font-bold text-white">{name}</p>
                  <p className="mt-1 text-sm text-slate-400">{meta}</p>
                </div>
                <p className="text-sm font-black text-teal-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl">
        <div className="mb-6 flex items-end justify-between gap-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-amber-200">{t("features")}</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">מסך עבודה במקום ערימת ניירת</h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {featureCards.map((card) => (
            <article key={card.title} className="surface rounded-2xl p-6">
              <span className={`mb-6 block h-2 w-14 rounded-full ${card.accent}`} />
              <h3 className="text-xl font-black text-white">{card.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">{card.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
