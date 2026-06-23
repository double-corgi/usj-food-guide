import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

const ADMIN_COOKIE_NAME = "admin_access_token";
const ADMIN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;
const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_FORBIDDEN_PATH = "/admin/forbidden";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isAdminPath(pathname)) return NextResponse.next();
  if (isPublicAdminPath(pathname)) return NextResponse.next();

  if (hasSupabaseAdminEnv()) return protectWithSupabaseAdmin(request);

  return protectWithAdminToken(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin", "/api/admin/:path*"]
};

function protectWithAdminToken(request: NextRequest) {
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

async function protectWithSupabaseAdmin(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) return rejectSupabaseAdminRequest(request, "unauthenticated");

  const { data: adminUser, error: adminError } = await supabase.from("admin_users").select("role").eq("id", user.id).maybeSingle();
  if (adminError || !adminUser?.role) return rejectSupabaseAdminRequest(request, "forbidden");

  return response;
}

function rejectSupabaseAdminRequest(request: NextRequest, reason: "unauthenticated" | "forbidden") {
  if (isAdminApiPath(request.nextUrl.pathname)) {
    return new NextResponse(reason === "unauthenticated" ? "Unauthorized" : "Forbidden", {
      headers: { "Cache-Control": "no-store" },
      status: reason === "unauthenticated" ? 401 : 403
    });
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = reason === "unauthenticated" ? ADMIN_LOGIN_PATH : ADMIN_FORBIDDEN_PATH;
  redirectUrl.search = "";
  if (reason === "unauthenticated") redirectUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(redirectUrl);
}

function isAdminPath(pathname: string) {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function isPublicAdminPath(pathname: string) {
  return pathname === ADMIN_LOGIN_PATH || pathname === ADMIN_FORBIDDEN_PATH;
}

function isAdminApiPath(pathname: string) {
  return pathname === "/api/admin" || pathname.startsWith("/api/admin/");
}

function hasSupabaseAdminEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

function denyAdminAccess() {
  return new NextResponse("Not Found", {
    headers: {
      "Cache-Control": "no-store"
    },
    status: 404
  });
}
