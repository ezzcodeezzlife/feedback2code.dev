"use client";

import { signIn, signOut } from "next-auth/react";
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
    >
      Logout
    </Button>
  ) : (
    <Button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/" })}
      size="sm"
    >
      Login with GitHub
    </Button>
  );
}

