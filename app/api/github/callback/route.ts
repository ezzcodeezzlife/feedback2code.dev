import { type NextRequest, NextResponse } from "next/server";

/**
 * GitHub App "Callback URL" often points here. The real handler is `/api/github/setup`
 * (expects `installation_id`). Forward query params so installs still complete.
 */
export function GET(request: NextRequest) {
  const setup = new URL("/api/github/setup", request.nextUrl.origin);
  request.nextUrl.searchParams.forEach((value, key) => {
    setup.searchParams.set(key, value);
  });
  return NextResponse.redirect(setup);
}
