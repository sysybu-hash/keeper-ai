import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { processJob } from "@/server/pipeline/processJob";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const doc = await prisma.document.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!doc) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  const job = await prisma.processingJob.create({
    data: {
      documentId: doc.id,
      type: "extract_and_sync",
      status: "pending",
    },
  });

  await prisma.document.update({
    where: { id: doc.id },
    data: { status: "queued" },
  });

  void processJob(job.id).catch((err) => console.error("reprocess failed", job.id, err));

  return NextResponse.json({ jobId: job.id });
}
