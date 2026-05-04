"use client";

import { useEffect, useState } from "react";
import { useI18n, type Language } from "@/lib/i18n";

const tabs = [
  { id: "general", label: "כללי" },
  { id: "ai", label: "AI & אוטומציה" },
  { id: "notifications", label: "התראות" },
  { id: "integrations", label: "חיבורים ודרייב" },
  { id: "security", label: "אבטחה" },
];

export default function SettingsPage() {
  const { lang, setLang } = useI18n();
  const [activeTab, setActiveTab] = useState("general");

  const [defaultCurrency, setDefaultCurrency] = useState("ILS");
  const [theme, setTheme] = useState("dark");
  const [aiAutoProcess, setAiAutoProcess] = useState(true);
  const [notifications, setNotifications] = useState({ email: true, whatsapp: false, urgentOnly: false });
  const [driveFolder, setDriveFolder] = useState("Keeper/{year}/{month}/{category}");
  const [saveStatus, setSaveStatus] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = (await res.json()) as { preferences?: Record<string, unknown> };
        const p = data.preferences ?? {};
        if (typeof p.defaultCurrency === "string") setDefaultCurrency(p.defaultCurrency);
        if (typeof p.theme === "string") setTheme(p.theme);
        if (typeof p.aiAutoProcess === "boolean") setAiAutoProcess(p.aiAutoProcess);
        if (typeof p.driveFolderPattern === "string") setDriveFolder(p.driveFolderPattern);
        if (p.notifications && typeof p.notifications === "object") {
          setNotifications((prev) => ({ ...prev, ...(p.notifications as typeof notifications) }));
        }
      } catch {
        /* ignore */
      }
    })();
  }, []);

  async function saveSettings() {
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: lang,
          defaultCurrency,
          theme: theme === "system" ? "dark" : theme,
          aiAutoProcess,
          driveFolderPattern: driveFolder,
          notifications,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setSaveStatus({ text: body.error ?? "השמירה נכשלה", type: "error" });
        return;
      }
      setSaveStatus({ text: "ההגדרות נשמרו", type: "success" });
    } catch {
      setSaveStatus({ text: "בעיית רשת", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("פעולה בלתי הפיכה. למחוק את כל הנתונים והחשבון?")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete-data", { method: "POST" });
      if (res.ok) {
        window.location.href = "/";
        return;
      }
      setSaveStatus({ text: "המחיקה נכשלה", type: "error" });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Settings</p>
            <h1 className="mt-3 text-4xl font-black text-white">הגדרות המערכת</h1>
          </div>
          <div className="flex items-center gap-4">
            {saveStatus && (
              <span className={`text-sm font-bold ${saveStatus.type === "success" ? "text-teal-200" : "text-red-200"}`}>
                {saveStatus.text}
              </span>
            )}
            <button
              type="button"
              onClick={() => void saveSettings()}
              disabled={saving}
              className="focus-ring rounded-2xl bg-teal-300 px-6 py-3 text-sm font-black text-slate-950 hover:bg-teal-200 transition disabled:opacity-50"
            >
              {saving ? "שומר..." : "שמור שינויים"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          <aside className="surface rounded-3xl p-3 h-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`focus-ring mb-2 w-full rounded-2xl px-4 py-3 text-start text-sm font-black transition ${
                  activeTab === tab.id ? "bg-white text-slate-950" : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </aside>

          <section className="surface rounded-3xl p-6 sm:p-8 min-h-[500px]">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-white mb-6">הגדרות כלליות</h2>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">שפת ממשק</span>
                    <select
                      value={lang}
                      onChange={(e) => setLang(e.target.value as Language)}
                      className="focus-ring w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                    >
                      <option value="he">עברית</option>
                      <option value="en">English</option>
                      <option value="ru">Русский</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">מטבע ברירת מחדל</span>
                    <select 
                      value={defaultCurrency}
                      onChange={(e) => setDefaultCurrency(e.target.value)}
                      className="focus-ring w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white"
                    >
                      <option value="ILS">שקל חדש (₪)</option>
                      <option value="USD">דולר אמריקאי ($)</option>
                      <option value="EUR">אירו (€)</option>
                    </select>
                  </label>
                </div>

                <div>
                  <span className="mb-3 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">מראה</span>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[{id:"dark", label:"כהה"}, {id:"light", label:"בהיר"}, {id:"system", label:"מערכת"}].map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTheme(t.id)}
                        className={`focus-ring rounded-2xl border px-4 py-4 text-sm font-black transition ${
                          theme === t.id ? "border-teal-300 bg-teal-300/10 text-teal-300" : "border-white/10 bg-white/8 text-slate-300 hover:border-white/30"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-white mb-6">הגדרות AI ואוטומציה</h2>
                
                <div 
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.06] transition"
                  onClick={() => setAiAutoProcess(!aiAutoProcess)}
                >
                  <div>
                    <p className="font-black text-white">עיבוד וסיווג אוטומטי</p>
                    <p className="mt-1 text-sm text-slate-400">ה-AI יחלץ נתונים, יקצה קטגוריה וייצור תיקיות באופן עצמאי.</p>
                  </div>
                  <div className={`h-7 w-12 rounded-full p-1 transition-colors ${aiAutoProcess ? "bg-teal-300" : "bg-slate-700"}`}>
                    <span className={`block h-5 w-5 rounded-full bg-slate-950 transition-transform ${aiAutoProcess ? "translate-x-[20px]" : "translate-x-0"}`} />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 opacity-50">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-black text-white">עיבוד מקומי (בקרוב)</p>
                      <p className="mt-1 text-sm text-slate-400">שימוש במודלים מקומיים לשמירה מקסימלית על פרטיות המסמכים.</p>
                    </div>
                    <div className="h-7 w-12 rounded-full bg-slate-700 p-1">
                      <span className="block h-5 w-5 rounded-full bg-slate-950" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-white mb-6">התראות ועדכונים</h2>
                
                {[
                  { id: "email", label: "עדכונים בדוא״ל", state: notifications.email },
                  { id: "whatsapp", label: "התראות ל-WhatsApp", state: notifications.whatsapp },
                  { id: "urgentOnly", label: "התראות למסמכים דחופים בלבד", state: notifications.urgentOnly }
                ].map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4 cursor-pointer hover:bg-white/[0.06] transition"
                    onClick={() => setNotifications({ ...notifications, [item.id]: !item.state })}
                  >
                    <span className="text-sm font-black text-white">{item.label}</span>
                    <div className={`h-7 w-12 rounded-full p-1 transition-colors ${item.state ? "bg-teal-300" : "bg-slate-700"}`}>
                      <span className={`block h-5 w-5 rounded-full transition-transform ${item.state ? "bg-slate-950 translate-x-[20px]" : "bg-white translate-x-0"}`} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "integrations" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-2xl font-black text-white mb-6">חיבורים וסנכרון Drive</h2>
                
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                  <h3 className="font-black text-white mb-4">תבנית יצירת תיקיות אוטומטית</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    כיצד Keeper ישמור את הקבצים שלך ב-Google Drive. השתמש בפרמטרים:
                    <br/><code className="text-teal-200">{`{year}, {month}, {category}, {entity}`}</code>
                  </p>
                  <input 
                    type="text" 
                    value={driveFolder}
                    onChange={(e) => setDriveFolder(e.target.value)}
                    className="focus-ring w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-white font-mono text-sm text-left dir-ltr"
                  />
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/50 border border-white/5 text-xs text-slate-400 font-mono">
                    תצוגה מקדימה: Keeper/2026/05/חשמל/חברת החשמל.pdf
                  </div>
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                 <h2 className="text-2xl font-black text-white mb-6">אבטחה וניהול נתונים</h2>
                 <div className="rounded-2xl border border-red-300/25 bg-red-400/5 p-6">
                    <h3 className="text-lg font-black text-red-200">אזור מסוכן</h3>
                    <p className="mt-2 text-sm text-slate-400 mb-6">
                      מחיקת החשבון תסיר את כל המידע שלך מהמערכת באופן בלתי הפיך, כולל היסטוריית חילוצים וקישורים לקבצים (הקבצים עצמם ב-Drive לא ימחקו).
                    </p>
                    <button
                      type="button"
                      onClick={() => void deleteAccount()}
                      disabled={deleting}
                      className="focus-ring rounded-2xl border border-red-400 bg-red-400/10 px-6 py-3 text-sm font-black text-red-200 hover:bg-red-400/20 transition disabled:opacity-50"
                    >
                      {deleting ? "מוחק..." : "מחק את החשבון שלי"}
                    </button>
                 </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
