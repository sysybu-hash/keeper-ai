"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/lib/i18n";
import { LiveAssistantProvider } from "@/lib/contexts/LiveAssistantContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <I18nProvider>
        <LiveAssistantProvider>
          {children}
        </LiveAssistantProvider>
      </I18nProvider>
    </SessionProvider>
  );
}
