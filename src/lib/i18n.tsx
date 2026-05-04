"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Language = "he" | "en" | "ru";

const translations = {
  en: {
    title: "Keeper AI",
    description:
      "Upload bills, municipal letters, payslips, and medical documents. Keeper extracts the important fields, files them, and prepares reminders before anything becomes urgent.",
    upload: "Upload Document",
    myDocuments: "My Documents",
    login: "Sign in with Google",
    logout: "Sign out",
    mvp: "Private document workspace",
    heroTitle: "Keeper AI",
    heroSubtitle: "A calm operating system for personal paperwork.",
    features: "What Keeper handles",
    howItWorks: "How it works",
    processing: "Processing...",
    completed: "Completed",
    failed: "Failed",
    queued: "Queued",
    needs_review: "Needs review",
    calendar: "Calendar",
  },
  he: {
    title: "Keeper AI",
    description:
      "מעלים חשבונות, מכתבים עירוניים, תלושי שכר ומסמכים רפואיים. Keeper מחלץ את הנתונים החשובים, מסדר אותם ומכין תזכורות לפני שמשהו נהיה דחוף.",
    upload: "העלאת מסמך",
    myDocuments: "המסמכים שלי",
    login: "התחברות עם Google",
    logout: "התנתקות",
    mvp: "מרחב מסמכים פרטי",
    heroTitle: "Keeper AI",
    heroSubtitle: "מערכת שקטה לניהול הניירת האישית.",
    features: "מה Keeper מטפל בו",
    howItWorks: "איך זה עובד",
    processing: "מעבד...",
    completed: "הושלם",
    failed: "נכשל",
    queued: "בתור",
    needs_review: "דורש בדיקה",
    calendar: "יומן",
  },
  ru: {
    title: "Keeper AI",
    description:
      "Загружайте счета, письма, зарплатные и медицинские документы. Keeper извлекает важные данные, раскладывает файлы и готовит напоминания заранее.",
    upload: "Загрузить документ",
    myDocuments: "Мои документы",
    login: "Войти через Google",
    logout: "Выйти",
    mvp: "Личное пространство документов",
    heroTitle: "Keeper AI",
    heroSubtitle: "Спокойная система для личных документов.",
    features: "Что делает Keeper",
    howItWorks: "Как это работает",
    processing: "Обработка...",
    completed: "Готово",
    failed: "Ошибка",
    queued: "В очереди",
    needs_review: "Нужна проверка",
    calendar: "Календарь",
  },
};

type TranslationKey = keyof typeof translations.en;

type ContextType = {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  dir: "rtl" | "ltr";
};

const I18nContext = createContext<ContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>("he");

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Language | null;
    if (saved === "he" || saved === "en" || saved === "ru") setLang(saved);
  }, []);

  const handleSetLang = (nextLang: Language) => {
    setLang(nextLang);
    localStorage.setItem("lang", nextLang);
  };

  const t = (key: TranslationKey) => translations[lang][key] || translations.en[key];
  const dir = lang === "he" ? "rtl" : "ltr";

  return (
    <I18nContext.Provider value={{ lang, setLang: handleSetLang, t, dir }}>
      <div dir={dir}>{children}</div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useI18n must be used within I18nProvider");
  return context;
}
