import { prisma } from "@/lib/prisma";

export type NotificationChannel = "email" | "whatsapp" | "system";

type NotificationResult = {
  success: boolean;
  channel: NotificationChannel;
  delivered: boolean;
  error?: string;
};

type UserPrefs = {
  notifications?: { email?: boolean; whatsapp?: boolean; urgentOnly?: boolean };
};

async function sendEmailViaResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error("RESEND_API_KEY missing");
  const from = process.env.RESEND_FROM?.trim() || "Keeper AI <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
}

export async function notifyUser(
  userId: string,
  message: string,
  channel: NotificationChannel = "system",
  subject = "Keeper AI",
): Promise<NotificationResult> {
  let delivered = channel === "system";
  let error: string | undefined;

  if (channel === "email") {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, preferences: true },
      });
      const prefs = (user?.preferences ?? {}) as UserPrefs;
      const wantsEmail = prefs.notifications?.email !== false;
      if (!user?.email) throw new Error("user has no email");
      if (!wantsEmail) throw new Error("user disabled email notifications");

      const html = `<div dir="rtl" style="font-family:system-ui,sans-serif;line-height:1.7;color:#0f172a">
        <h2 style="margin:0 0 12px">${subject}</h2>
        <p style="white-space:pre-wrap">${message}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <p style="font-size:12px;color:#64748b">נשלח על ידי Keeper AI</p>
      </div>`;

      await sendEmailViaResend(user.email, subject, html);
      delivered = true;
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
      delivered = false;
    }
  }

  await prisma.auditLog.create({
    data: {
      userId,
      action: `notification_${channel}_${delivered ? "delivered" : "failed"}`,
      metadata: { message, channel, delivered, error },
    },
  });

  return { success: delivered || channel === "system", channel, delivered, error };
}

export async function notifyUrgentDocument(userId: string, documentTitle: string, dueDate: string) {
  const message = `מסמך דחוף: "${documentTitle}" לתאריך ${dueDate}. מומלץ לטפל בו עכשיו.`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });
  const prefs = (user?.preferences ?? {}) as UserPrefs;
  const wantsEmail = prefs.notifications?.email !== false;

  if (wantsEmail && process.env.RESEND_API_KEY) {
    return notifyUser(userId, message, "email", `דחוף: ${documentTitle}`);
  }
  return notifyUser(userId, message, "system");
}
