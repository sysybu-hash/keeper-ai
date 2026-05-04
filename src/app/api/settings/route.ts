import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const preferencesSchema = z.object({
  language: z.enum(["he", "en", "ru"]).optional(),
  theme: z.enum(["dark", "light"]).optional(),
  defaultCurrency: z.enum(["ILS", "USD", "EUR"]).optional(),
  driveFolderPattern: z.string().max(200).optional(),
  aiAutoProcess: z.boolean().optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      whatsapp: z.boolean().optional(),
      urgentOnly: z.boolean().optional(),
    })
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { preferences: true },
  });
  return NextResponse.json({ preferences: user?.preferences ?? {} });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const result = preferencesSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "נתונים לא חוקיים", issues: result.error.issues },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { preferences: result.data as object },
  });

  return NextResponse.json({ ok: true, preferences: result.data });
}
