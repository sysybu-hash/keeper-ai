import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DeleteAccountButton } from "./delete-account-button";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-xl font-semibold text-zinc-900">הגדרות</h1>
      <p className="mt-2 text-sm text-zinc-600">מחיקת החשבון מסירה את כל המסמכים, החילוצים והקישורים מהמסד.</p>
      <div className="mt-8">
        <DeleteAccountButton />
      </div>
    </main>
  );
}
