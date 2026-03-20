import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import NavbarAuthActions from "./navbar-auth-actions";
import { MessageSquareCode } from "lucide-react";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const displayName = user?.name ?? "GitHub User";
  const userInitial =
    typeof displayName === "string" && displayName.trim().length > 0
      ? displayName.trim().slice(0, 1).toUpperCase()
      : "?";

  return (
    <header className="border-b border-black/10 bg-white dark:border-white/15 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <div className="inline-flex items-center gap-1 rounded-md text-zinc-900 dark:text-zinc-100">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-900 dark:text-zinc-100">
            <MessageSquareCode className="h-5 w-5" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            <span className="bg-linear-to-r from-black to-zinc-600 bg-clip-text text-transparent dark:from-white dark:to-zinc-300">
              feedback2code.com
            </span>
          </span>
        </div>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="font-medium leading-none">
                {displayName}
              </p>
              {user.email ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </p>
              ) : null}
            </div>

            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt={`${displayName} profile`}
                width={36}
                height={36}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="h-9 w-9 rounded-full border border-black/10 object-cover dark:border-white/15"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-zinc-100 text-xs font-medium text-zinc-700 dark:border-white/15 dark:bg-zinc-800 dark:text-zinc-200">
                {userInitial}
              </div>
            )}

            <NavbarAuthActions isAuthed />
          </div>
        ) : (
          <NavbarAuthActions isAuthed={false} />
        )}
      </div>
    </header>
  );
}
