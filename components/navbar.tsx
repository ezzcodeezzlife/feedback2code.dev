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
            <Link
              href="/account"
              className="group hidden sm:flex items-center gap-3 rounded-sm bg-transparent px-2 py-1.5 text-muted-foreground transition-all duration-150 hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
              aria-label="Open account page"
            >
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={`${displayName} profile`}
                  width={28}
                  height={28}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-full border-2 border-border object-cover transition-colors group-hover:border-accent"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-border bg-surface-raised text-xs font-medium text-muted-foreground transition-colors group-hover:border-accent group-hover:text-foreground">
                  {userInitial}
                </div>
              )}
              <span className="text-xs text-muted-foreground transition-colors group-hover:text-foreground">
                {displayName}
              </span>
            </Link>

            <NavbarAuthActions isAuthed />
          </div>
        ) : (
          <NavbarAuthActions isAuthed={false} />
        )}
      </div>
    </header>
  );
}
