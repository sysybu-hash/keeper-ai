import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ActiveChannels } from "./active-channels";
import { DocumentList } from "./document-list";
import { FinancialInsights } from "./financial-insights";
import { GlobalExpatMode } from "./global-expat-mode";
import { WelcomeDashboard } from "@/components/WelcomeDashboard";

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { extractions: { take: 1 } },
    take: 100,
  });

  let totalAmount = 0;
  let urgentCount = 0;

  documents.forEach((doc) => {
    const extraction = doc.extractions[0];
    if (!extraction) return;
    const data = extraction.normalizedJson as { amount_due?: number; is_urgent?: boolean };
    if (typeof data.amount_due === "number") totalAmount += data.amount_due;
    if (data.is_urgent) urgentCount += 1;
  });

  const stats = [
    { label: "סהכ סכומים שזוהו", value: `₪${totalAmount.toLocaleString("he-IL")}`, tone: "text-teal-100" },
    { label: "דורשים טיפול", value: urgentCount.toString(), tone: "text-amber-100" },
    { label: "מסמכים במערכת", value: documents.length.toString(), tone: "text-blue-100" },
  ];

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Documents</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white">המסמכים שלי</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              חיפוש, בדיקה ותיקון של כל מסמך שעבר דרך Keeper.
            </p>
          </div>
          <Link
            href="/upload"
            className="focus-ring rounded-2xl bg-teal-300 px-5 py-3 text-center text-sm font-black text-slate-950 hover:bg-teal-200"
          >
            העלאת מסמך
          </Link>
        </div>

        <WelcomeDashboard />

        <section className="mb-8 grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="surface rounded-2xl p-5">
              <p className="text-sm font-bold text-slate-400">{stat.label}</p>
              <p className={`mt-2 text-3xl font-black ${stat.tone}`}>{stat.value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
          <div className="space-y-6">
            <FinancialInsights documents={documents} />
            <DocumentList
              initialDocuments={documents.map((doc) => {
                const data = doc.extractions[0]?.normalizedJson as
                  | { category?: string; amount_due?: number; is_urgent?: boolean }
                  | undefined;

                return {
                  id: doc.id,
                  originalFilename: doc.originalFilename,
                  status: doc.status,
                  createdAt: doc.createdAt.toISOString(),
                  category: data?.category || "אחר",
                  amount: data?.amount_due || 0,
                  isUrgent: data?.is_urgent || false,
                };
              })}
            />
          </div>

          <aside className="space-y-6">
            <ActiveChannels />
            <GlobalExpatMode />
          </aside>
        </div>
      </div>
    </main>
  );
}
