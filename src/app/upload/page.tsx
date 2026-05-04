import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UploadForm } from "./upload-form";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/");

  return (
    <main className="min-h-screen px-4 pb-20 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-teal-200">Upload</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white">העלאת מסמך חדש</h1>
          <p className="mt-4 text-base leading-8 text-slate-300">
            העלו PDF, תמונה או וידאו קצר. Keeper ייצור מסמך, יתחיל עיבוד ויעביר אתכם למסך הבדיקה.
          </p>
        </div>

        <UploadForm />
      </div>
    </main>
  );
}
