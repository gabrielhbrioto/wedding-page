import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";

function getJwtSecret(): Uint8Array | null {
  const rawSecret = process.env.JWT_SECRET ?? process.env.SECRET_KEY ?? "";
  if (!rawSecret) {
    return null;
  }
  return new TextEncoder().encode(rawSecret);
}

async function isValidAdminJwt(token: string | undefined): Promise<boolean> {
  const jwtSecret = getJwtSecret();
  if (!token || !jwtSecret) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, jwtSecret, {
      algorithms: ["HS256"],
    });

    return payload.role === "admin" && typeof payload.sub === "string";
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const accessToken = req.cookies.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = req.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (await isValidAdminJwt(accessToken)) {
    return NextResponse.next();
  }

  if (await isValidAdminJwt(refreshToken)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*"],
};