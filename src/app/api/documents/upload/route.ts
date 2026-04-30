import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { saveRawUpload } from "@/server/storage";
import { buildWebIngestion } from "@/server/ingestion/webUpload";
import { processJob } from "@/server/pipeline/processJob";

export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "קובץ ריק" }, { status: 400 });
  }

  const payload = buildWebIngestion(session.user.id, file.name, file.type || "application/octet-stream", buf);
  const rawStorageKey = await saveRawUpload(payload.userId, payload.bytes, payload.originalFilename);

  const doc = await prisma.document.create({
    data: {
      userId: payload.userId,
      source: payload.source,
      originalFilename: payload.originalFilename,
      mimeType: payload.mimeType,
      status: "queued",
      rawStorageKey,
    },
  });

  const job = await prisma.processingJob.create({
    data: {
      documentId: doc.id,
      type: "extract_and_sync",
      status: "pending",
    },
  });

  void processJob(job.id).catch((err) => {
    console.error("processJob failed", job.id, err);
  });

  return NextResponse.json({
    documentId: doc.id,
    jobId: job.id,
    message: "הקובץ הועלה והועבר לעיבוד",
  });
}
