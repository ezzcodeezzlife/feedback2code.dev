"use client";

import { signIn, signOut } from "next-auth/react";
import { Github, LogOut } from "lucide-react";
import Button from "@/components/ui/button";

type Props = {
  isAuthed: boolean;
};

export default function NavbarAuthActions({ isAuthed }: Props) {
  return isAuthed ? (
    <Button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      variant="ghost"
      size="sm"
      className="cursor-pointer shrink-0 px-2 sm:h-9 sm:px-4"
      aria-label="Sign out"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Sign out</span>
    </Button>
  ) : (
    <Button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      size="default"
      className="cursor-pointer border-white bg-white text-black hover:border-zinc-200 hover:bg-zinc-100 hover:text-black focus-visible:ring-white/50"
    >
      <Github className="h-3.5 w-3.5" />
      Sign in
    </Button>
  );
}
