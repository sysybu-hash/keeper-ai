import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { notifyUser } from "@/server/notifications/notify";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }

  const result = await notifyUser(
    session.user.id,
    "זוהי הודעת בדיקה מ-Keeper AI. אם הגיעה אליך — שילוב Resend עובד.",
    "email",
    "בדיקת מייל - Keeper AI",
  );

  return NextResponse.json(result, { status: result.delivered ? 200 : 500 });
}
