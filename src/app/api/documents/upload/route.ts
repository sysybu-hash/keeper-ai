import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueIngestion } from "@/server/ingestion/enqueue";
import { buildWebIngestion } from "@/server/ingestion/webUpload";

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
  const { document, job } = await enqueueIngestion(payload);

  return NextResponse.json({
    documentId: document.id,
    jobId: job.id,
    message: "הקובץ הועלה והועבר לעיבוד",
  });
}
