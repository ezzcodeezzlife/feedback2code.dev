import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import NavbarAuthActions from "./navbar-auth-actions";
import NavbarLandingLinks from "./navbar-landing-links";
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-1">
          <span className="flex h-9 w-9 items-center justify-center text-accent text-xs font-bold">
            <MessageSquareCode className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-bold tracking-wider uppercase text-foreground transition-colors group-hover:text-accent">
            feedback2code
          </span>
        </Link>

        {user ? (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-2 pl-3 text-sm sm:gap-4">
            <Link
              href="/account"
              className="group flex min-w-0 max-w-[150px] items-center gap-2 rounded-sm bg-transparent px-1 py-1 text-muted-foreground transition-all duration-150 hover:bg-surface-raised hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent sm:max-w-[220px] sm:gap-3 sm:px-2 sm:py-1.5"
              aria-label={`Account - ${displayName}`}
            >
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-foreground group-hover:underline max-[380px]:hidden">
                Account
              </span>
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 shrink-0 rounded-full border-2 border-border object-cover transition-colors group-hover:border-accent"
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface-raised text-xs font-medium text-muted-foreground transition-colors group-hover:border-accent group-hover:text-foreground">
                  {userInitial}
                </div>
              )}
            </Link>

            <NavbarAuthActions isAuthed />
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-end gap-6 pl-3">
            <NavbarLandingLinks />

            <NavbarAuthActions isAuthed={false} />
          </div>
        )}
      </div>
    </header>
  );
}
