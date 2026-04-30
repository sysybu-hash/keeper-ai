import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DocumentDetail } from "./document-detail";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/");
  const { id } = await params;
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <DocumentDetail id={id} />
    </main>
  );
}
