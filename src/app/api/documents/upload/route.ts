import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enqueueIngestion } from "@/server/ingestion/enqueue";
import { buildWebIngestion } from "@/server/ingestion/webUpload";
import { processJob } from "@/server/pipeline/processJob";

export const maxDuration = 120;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "טופס לא חוקי" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "חסר קובץ" }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0) {
    return NextResponse.json({ error: "קובץ ריק" }, { status: 400 });
  }

  try {
    const payload = buildWebIngestion(session.user.id, file.name, file.type || "application/octet-stream", buf);
    const { document, job } = await enqueueIngestion(payload);

    try {
      await processJob(job.id);
    } catch (err) {
      console.error("processJob inline failed", job.id, err);
    }

    return NextResponse.json({
      documentId: document.id,
      jobId: job.id,
      message: "הקובץ הועלה ועבר לעיבוד",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה לא צפויה";
    console.error("Upload failed", message);
    return NextResponse.json({ error: `העלאה נכשלה: ${message}` }, { status: 500 });
  }
}
