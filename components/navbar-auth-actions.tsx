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
      size="default"
      className="cursor-pointer"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </Button>
  ) : (
    <Button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      size="default"
      className="cursor-pointer"
    >
      <Github className="h-3.5 w-3.5" />
      Sign in
    </Button>
  );
}
