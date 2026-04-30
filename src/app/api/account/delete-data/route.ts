import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteRawFile } from "@/server/storage";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const userId = session.user.id;

  const docs = await prisma.document.findMany({
    where: { userId },
    select: { rawStorageKey: true },
  });

  for (const d of docs) {
    if (d.rawStorageKey) {
      try {
        await deleteRawFile(d.rawStorageKey);
      } catch {
        /* ignore */
      }
    }
  }

  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
