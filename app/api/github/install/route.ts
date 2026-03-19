import { authOptions } from "@/auth";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  const slug = process.env.GITHUB_APP_SLUG;

  if (!session?.user?.email || !slug) {
    return NextResponse.redirect(new URL("/", process.env.NEXTAUTH_URL));
  }

  const state = Buffer.from(
    JSON.stringify({
      email: session.user.email,
      ts: Date.now(),
    }),
  ).toString("base64url");

  const installUrl = new URL(
    `https://github.com/apps/${slug}/installations/new`,
  );
  installUrl.searchParams.set("state", state);

  return NextResponse.redirect(installUrl);
}
