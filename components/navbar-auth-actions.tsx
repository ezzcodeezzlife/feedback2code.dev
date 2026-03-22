"use client";

import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import Button from "@/components/ui/button";

type Props = {
  isAuthed: boolean;
};

export default function NavbarAuthActions({ isAuthed }: Props) {
  return isAuthed ? (
    null
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
