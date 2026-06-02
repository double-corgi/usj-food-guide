import { NextResponse, type NextRequest } from "next/server";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/admin")) return NextResponse.next();

  const hostname = getRequestHostname(request);
  if (LOCAL_HOSTS.has(hostname)) return NextResponse.next();

  const configuredKey = process.env.ADMIN_ACCESS_KEY;
  const providedKey = request.nextUrl.searchParams.get("admin_key") ?? request.cookies.get("admin_key")?.value;
  if (configuredKey && providedKey === configuredKey) return NextResponse.next();

  const lockedUrl = request.nextUrl.clone();
  lockedUrl.pathname = "/admin-locked";
  lockedUrl.search = "";
  return NextResponse.rewrite(lockedUrl);
}

export const config = {
  matcher: ["/admin/:path*"]
};

function getRequestHostname(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host") || request.nextUrl.hostname;
  return host.split(":")[0]?.toLowerCase() || request.nextUrl.hostname;
}
