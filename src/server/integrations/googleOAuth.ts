import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { appBaseUrl } from "@/lib/appUrl";

export async function getGoogleOAuth2ForUser(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.refresh_token && !account?.access_token) {
    throw new Error("Google account not linked or missing tokens. Sign out and sign in again with consent.");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appBaseUrl()}/api/auth/callback/google`,
  );

  oauth2.setCredentials({
    access_token: account.access_token ?? undefined,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });

  oauth2.on("tokens", async (tokens) => {
    if (!tokens.access_token) return;
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: account.provider,
          providerAccountId: account.providerAccountId,
        },
      },
      data: {
        access_token: tokens.access_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
        refresh_token: tokens.refresh_token ?? account.refresh_token,
      },
    });
  });

  return oauth2;
}
