"use client";

import { useEffect } from "react";

export function PWAHandler() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err: unknown) => {
      if (process.env.NODE_ENV === "development") {
        console.warn("Service worker registration failed", err);
      }
    });
  }, []);

  return null;
}
