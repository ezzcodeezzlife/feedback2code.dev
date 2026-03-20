import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import NavbarAuthActions from "./navbar-auth-actions";
import Link from "next/link";
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
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group flex items-center gap-1">
          <span className="flex h-9 w-9 items-center justify-center text-accent text-xs font-bold">
            <MessageSquareCode className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-wider uppercase text-foreground group-hover:text-accent transition-colors">
            feedback2code
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-4 text-sm">
            <div className="hidden sm:flex items-center gap-3">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={`${displayName} profile`}
                  width={28}
                  height={28}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border border-border object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-surface-raised text-xs font-medium text-muted-foreground">
                  {userInitial}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {displayName}
              </span>
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
