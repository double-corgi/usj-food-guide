import { NextResponse, type NextRequest } from "next/server";

const ADMIN_COOKIE_NAME = "admin_access_token";
const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();

  const configuredToken = process.env.ADMIN_ACCESS_TOKEN;
  if (!configuredToken) return denyAdminAccess();

  const cookieToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (cookieToken === configuredToken) return NextResponse.next();

  const queryToken = request.nextUrl.searchParams.get("adminToken");
  if (queryToken === configuredToken) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.searchParams.delete("adminToken");
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set(ADMIN_COOKIE_NAME, configuredToken, {
      httpOnly: true,
      maxAge: ADMIN_COOKIE_MAX_AGE_SECONDS,
      path: "/",
      sameSite: "lax",
      secure: redirectUrl.protocol === "https:"
    });
    return response;
  }

  return denyAdminAccess();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"]
};

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function denyAdminAccess() {
  return new NextResponse("Not Found", {
    headers: {
      "Cache-Control": "no-store"
    },
    status: 404
  });
}
