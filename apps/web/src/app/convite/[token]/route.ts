import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ token: string }> | { token: string };
};

export async function GET(request: NextRequest, ctx: RouteContext) {
  const { token } = await ctx.params;
  const redirectUrl = new URL("/rsvp", request.url);

  if (!token) {
    return NextResponse.redirect(redirectUrl);
  }

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set("invite_token", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
