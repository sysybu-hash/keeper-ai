import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { processJob } from "@/server/pipeline/processJob";

/** Dev-friendly manual trigger; production should prefer cron. */
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const { id } = await ctx.params;

  const job = await prisma.processingJob.findFirst({
    where: { id, document: { userId: session.user.id } },
  });
  if (!job) {
    return NextResponse.json({ error: "לא נמצא" }, { status: 404 });
  }

  if (job.status !== "pending") {
    return NextResponse.json({ error: "המשימה לא במצב ממתין" }, { status: 400 });
  }

  await processJob(job.id);
  const updated = await prisma.processingJob.findUnique({ where: { id: job.id } });
  return NextResponse.json({ job: updated });
}
