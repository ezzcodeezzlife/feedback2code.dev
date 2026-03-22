"use client";

import Button from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="min-h-8 max-h-8 leading-none"
      aria-label="Sign out"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sign out
    </Button>
  );
}
