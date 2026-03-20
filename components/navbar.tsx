import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import NavbarAuthActions from "./navbar-auth-actions";

export default async function Navbar() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  return (
    <header className="border-b border-black/10 bg-white dark:border-white/15 dark:bg-black">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight">
          feedback2code
        </span>

        {user ? (
          <div className="flex items-center gap-3 text-sm">
            <div className="text-right">
              <p className="font-medium leading-none">
                {user.name ?? "GitHub User"}
              </p>
              {user.email ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </p>
              ) : null}
            </div>

            <NavbarAuthActions isAuthed />
          </div>
        ) : (
          <NavbarAuthActions isAuthed={false} />
        )}
      </div>
    </header>
  );
}
