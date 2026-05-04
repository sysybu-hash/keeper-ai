import { prisma } from "@/lib/prisma";

export type NotificationChannel = "email" | "whatsapp" | "system";

type NotificationResult = {
  success: boolean;
  channel: NotificationChannel;
  delivered: boolean;
};

export async function notifyUser(
  userId: string,
  message: string,
  channel: NotificationChannel = "system",
): Promise<NotificationResult> {
  await prisma.auditLog.create({
    data: {
      userId,
      action: `notification_queued_${channel}`,
      metadata: {
        message,
        channel,
        delivered: channel === "system",
      },
    },
  });

  return {
    success: true,
    channel,
    delivered: channel === "system",
  };
}

export async function notifyUrgentDocument(userId: string, documentTitle: string, dueDate: string) {
  const message = `מסמך דחוף: "${documentTitle}" לתאריך ${dueDate}. מומלץ לטפל בו עכשיו.`;
  return notifyUser(userId, message, "system");
}
