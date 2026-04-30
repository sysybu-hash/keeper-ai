import { auth } from "@/auth";
import { LoginButton } from "@/components/LoginButton";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">מעבד מסמכים אישי</h1>
      <p className="mt-4 text-zinc-600 leading-relaxed">
        העלו חשבונות, מכתבים מהעירייה, תלושי שכר ומסמכים רפואיים — המערכת מחלצת נתונים מובנים, ממיינת לתיקיות ב-Google
        Drive ויוצרת אירוע ביומן כשיש תאריך יעד.
      </p>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        {session?.user ? (
          <>
            <Link
              href="/upload"
              className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
            >
              להעלאת מסמך
            </Link>
            <Link href="/documents" className="text-sm text-zinc-700 underline">
              למסמכים שלי
            </Link>
          </>
        ) : (
          <LoginButton />
        )}
      </div>

      <p className="mt-12 text-xs text-zinc-400">
        MVP: קליטה מהאתר בלבד. בהמשך: מייל ו-WhatsApp. נדרשים חשבון Google, מפתח Gemini ומסד PostgreSQL.
      </p>
    </main>
  );
}
