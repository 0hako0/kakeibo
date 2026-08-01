import { NextRequest, NextResponse } from "next/server";

const ACCESS_COOKIE = "kakeibo_access";

export function middleware(request: NextRequest) {
  const expected = process.env.ACCESS_TOKEN;

  if (!expected) {
    return NextResponse.next();
  }

  const cookieToken = request.cookies.get(ACCESS_COOKIE)?.value;
  if (cookieToken === expected) {
    return NextResponse.next();
  }

  const url = request.nextUrl;
  const queryToken = url.searchParams.get("token");
  if (queryToken === expected) {
    const redirectUrl = new URL(url.pathname, url.origin);
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(ACCESS_COOKIE, expected, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
    return response;
  }

  return new NextResponse("Access denied", { status: 403 });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
