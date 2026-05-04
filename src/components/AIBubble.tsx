"use client";

import { useState } from "react";
import { LiveAssistant } from "./LiveAssistant";

export function AIBubble() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 end-6 z-[90]">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="focus-ring group relative grid h-14 w-14 place-items-center rounded-2xl bg-teal-300 text-xl font-black text-slate-950 shadow-2xl shadow-teal-950/40 transition hover:-translate-y-0.5"
          aria-label="פתיחת Keeper Live"
        >
          AI
          <span className="pointer-events-none absolute end-16 hidden whitespace-nowrap rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white shadow-xl group-hover:block">
            דברו עם Keeper Live
          </span>
        </button>
      </div>

      <LiveAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
