import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXTAUTH_URL ??
    request.nextUrl.origin;

  if (!email) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  const installationId = request.nextUrl.searchParams.get("installation_id");

  if (!installationId) {
    return NextResponse.redirect(new URL("/", baseUrl));
  }

  await prisma.user.update({
    where: { email },
    data: {
      githubAppInstalled: true,
      githubInstallationId: installationId,
    },
  });

  return NextResponse.redirect(new URL("/", baseUrl));
}
