import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/patients",
  "/appointments",
  "/medical-notes",
  "/prescriptions",
  "/billing",
  "/lab-orders",
  "/imaging-orders",
  "/settings",
];

const publicRoutes = ["/login", "/register"];

export async function proxy(request: NextRequest)
{
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  const sessionToken = request.cookies.get("better-auth.session_token");

  if (isProtectedRoute && !sessionToken)
  {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isPublicRoute && sessionToken)
  {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)",
  ],
};
