"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { signOutAction } from "@/app/actions/auth";
import { useI18n, type Language } from "@/lib/i18n";

const navItems = [
  { href: "/", label: "בית" },
  { href: "/upload", label: "העלאה" },
  { href: "/documents", label: "מסמכים" },
  { href: "/settings", label: "הגדרות" },
];

export function Nav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { lang, setLang } = useI18n();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const userInitial = session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "K";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="focus-ring grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
              aria-label="פתיחת תפריט"
            >
              <span className="block h-0.5 w-5 bg-current shadow-[0_6px_0_currentColor,0_-6px_0_currentColor]" />
            </button>
            <Link href="/" className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-300 text-sm font-black text-slate-950">
                K
              </span>
              <span className="text-lg font-bold tracking-tight text-white">Keeper AI</span>
            </Link>
          </div>

          <nav className="hidden items-center rounded-full border border-white/10 bg-white/5 p-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    active ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <select
              value={lang}
              onChange={(event) => setLang(event.target.value as Language)}
              className="focus-ring rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white"
              aria-label="בחירת שפה"
            >
              <option value="he" className="bg-slate-950">HE</option>
              <option value="en" className="bg-slate-950">EN</option>
              <option value="ru" className="bg-slate-950">RU</option>
            </select>

            {session?.user && (
              <div className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-teal-300 text-sm font-black uppercase text-slate-950">
                {userInitial}
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] md:hidden ${isDrawerOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="סגירת תפריט"
          onClick={() => setIsDrawerOpen(false)}
          className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity ${
            isDrawerOpen ? "opacity-100" : "opacity-0"
          }`}
        />
        <aside
          className={`absolute inset-y-0 start-0 w-80 max-w-[86vw] border-e border-white/10 bg-slate-950 p-6 transition-transform duration-300 ${
            isDrawerOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
          }`}
        >
          <div className="mb-8 flex items-center justify-between">
            <span className="text-xl font-bold text-white">Keeper AI</span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="focus-ring grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white"
              aria-label="סגירה"
            >
              ×
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsDrawerOpen(false)}
                className="block rounded-2xl px-4 py-3 text-base font-bold text-slate-200 hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {session?.user && (
            <button
              type="button"
              onClick={() => signOutAction()}
              className="focus-ring absolute bottom-6 left-6 right-6 rounded-2xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-100"
            >
              התנתקות
            </button>
          )}
        </aside>
      </div>
    </>
  );
}
