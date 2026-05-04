"use client";

export function GlobalExpatMode() {
  return (
    <section className="surface rounded-3xl p-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h3 className="text-lg font-black text-white">Expat & Rights</h3>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-slate-300">2026</span>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl bg-white/[0.04] p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Pension Hub</p>
          <p className="mt-2 text-2xl font-black text-white">₪142,500</p>
          <p className="mt-1 text-xs text-teal-100">זכויות מסונכרנות</p>
        </div>
        <div className="rounded-2xl bg-white/[0.04] p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>Tax compliance</span>
            <span>85%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-teal-300" style={{ width: "85%" }} />
          </div>
          <p className="mt-2 text-xs leading-6 text-slate-400">דוח US הושלם. חסר טופס ישראלי לבדיקה.</p>
        </div>
      </div>
    </section>
  );
}
