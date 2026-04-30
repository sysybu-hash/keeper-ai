import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/app/actions/auth";

export async function Nav() {
  const session = await auth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold text-zinc-900">
          Keeper — מסמכים אישיים
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          {session?.user ? (
            <>
              <Link className="text-zinc-700 hover:underline" href="/upload">
                העלאה
              </Link>
              <Link className="text-zinc-700 hover:underline" href="/documents">
                המסמכים שלי
              </Link>
              <Link className="text-zinc-700 hover:underline" href="/settings">
                הגדרות
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="text-zinc-500 hover:text-zinc-800">
                  התנתק
                </button>
              </form>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
