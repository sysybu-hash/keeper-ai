import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { processJob } from "@/server/pipeline/processJob";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET לא מוגדר" }, { status: 500 });
  }
  const authz = req.headers.get("authorization");
  if (authz !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const job = await prisma.processingJob.findFirst({
    where: { status: "pending" },
    orderBy: { createdAt: "asc" },
  });

  if (!job) {
    return NextResponse.json({ ok: true, processed: false });
  }

  await processJob(job.id);
  return NextResponse.json({ ok: true, processed: true, jobId: job.id });
}
