"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-black/10 bg-white dark:border-white/15 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">feedback2code</span>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="font-medium leading-none">{user.name ?? "GitHub User"}</p>
              {user.email ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-md border border-black/15 px-3 py-1.5 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
            >
              Logout
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signIn("github")}
            className="rounded-md bg-black px-3 py-1.5 text-sm font-medium text-white transition hover:bg-black/80 dark:bg-white dark:text-black dark:hover:bg-white/80"
          >
            Login with GitHub
          </button>
        )}
      </div>
    </header>
  );
}
