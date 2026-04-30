import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const statusHe: Record<string, string> = {
  queued: "בתור",
  processing: "מעבד",
  needs_review: "דורש אישור",
  completed: "הושלם",
  failed: "נכשל",
};

export default async function DocumentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const documents = await prisma.document.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-xl font-semibold text-zinc-900">המסמכים שלי</h1>
      <ul className="mt-6 divide-y divide-zinc-200 rounded-lg border border-zinc-200 bg-white">
        {documents.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-500">אין מסמכים עדיין.</li>
        ) : (
          documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
              <Link href={`/documents/${d.id}`} className="font-medium text-zinc-900 hover:underline">
                {d.originalFilename}
              </Link>
              <span className="text-sm text-zinc-500">{statusHe[d.status] ?? d.status}</span>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
