import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UploadForm } from "./upload-form";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return (
    <main className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-xl font-semibold text-zinc-900">העלאת מסמך</h1>
      <p className="mt-2 text-sm text-zinc-600">PDF או תמונה — העיבוד רץ ברקע ויכול לקחת כמה שניות.</p>
      <div className="mt-8">
        <UploadForm />
      </div>
    </main>
  );
}
