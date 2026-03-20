"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Button from "@/components/ui/button";

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
            <Button
              type="button"
              onClick={() => signOut()}
              variant="outline"
            >
              Logout
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            onClick={() => signIn("github")}
            size="sm"
          >
            Login with GitHub
          </Button>
        )}
      </div>
    </header>
  );
}
