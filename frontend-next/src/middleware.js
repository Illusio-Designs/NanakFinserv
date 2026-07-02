import { NextResponse } from "next/server";

// Only the dashboard app requires auth. Guarding an explicit list (rather than
// "deny everything not public") means unknown/wrong URLs are NOT bounced to
// /login — they fall through to Next.js and render the 404 (not-found.jsx).
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/blog-admin",
  "/builder",
  "/building-managers",
  "/consumers",
  "/inquiries",
  "/life",
  "/loan",
  "/logs",
  "/mediclaim",
  "/settings",
  "/support",
  "/units",
  "/users",
  "/vehicle",
];

function isProtected(pathname) {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  // Already signed in? Skip the login screen.
  if (pathname === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Gate the dashboard: send unauthenticated users to /login.
  if (isProtected(pathname) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Everything else (marketing pages, /login, and unknown routes) passes
  // through — unknown routes then render the 404 page.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
