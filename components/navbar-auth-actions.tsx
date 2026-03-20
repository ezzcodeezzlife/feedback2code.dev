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
      variant="outline"
      className="cursor-pointer"
    >
      <LogOut className="h-4 w-4" />
      Logout
    </Button>
  ) : (
    <Button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      size="sm"
      className="cursor-pointer"
    >
      <Github className="h-4 w-4" />
      Login with GitHub
    </Button>
  );
}

