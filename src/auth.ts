import { createHash } from "node:crypto";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const googleScopes = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

/**
 * Auth.js דורש `secret`. ב‑Vercel ה-build רץ עם NODE_ENV=production; בלי AUTH_SECRET
 * הבנייה נופלת. כאן: fallback יציב לפי commit SHA רק כש-VERCEL ואין AUTH_SECRET —
 * עדיין חובה להגדיר AUTH_SECRET בדשבורד Vercel לפרודקשן אמיתי (סשנים יציבים בין דיפלויים).
 */
function resolveAuthSecret(): string | undefined {
  const fromEnv = process.env.AUTH_SECRET?.trim();
  if (fromEnv) return fromEnv;
  if (process.env.NODE_ENV !== "production") {
    return "dev-only-insecure-secret-do-not-use-in-production";
  }
  if (process.env.VERCEL === "1") {
    const commit = process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown";
    return createHash("sha256").update(`keeper-auth|${commit}`).digest("base64url");
  }
  return undefined;
}

const authSecret = resolveAuthSecret();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  secret: authSecret || undefined,
  trustHost: true,
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID?.trim() ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET?.trim() ?? "",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: googleScopes,
        },
      },
    }),
  ],
  callbacks: {
    session({ session, user }) {
      if (session.user && user?.id) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
