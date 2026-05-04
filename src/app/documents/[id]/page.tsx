import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DocumentDetail } from "./document-detail";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const { id } = await params;

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
    include: {
      extractions: { orderBy: { createdAt: "desc" }, take: 1 },
      jobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!doc) redirect("/documents");

  return (
    <main className="mx-auto max-w-5xl px-6 pt-32 pb-20">
      <DocumentDetail id={id} initialData={JSON.parse(JSON.stringify({ document: doc }))} />
    </main>
  );
}
