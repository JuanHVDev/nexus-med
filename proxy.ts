import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const authRoutes = ["/login", "/register"]
const protectedRoutes = ["/dashboard", "/patients", "/appointments", "/consultations", "/prescriptions", "/billing", "/lab-orders", "/imaging-orders", "/reports", "/settings", "/services"]

export async function proxy(request: NextRequest)
{
  const { pathname } = request.nextUrl

  const isAuthRoute = authRoutes.includes(pathname)
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  const sessionToken = request.cookies.get("better-auth.session_token")?.value

  // Redirect authenticated users away from auth routes
  if (isAuthRoute && sessionToken)
  {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !sessionToken)
  {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/patients/:path*",
    "/appointments/:path*",
    "/consultations/:path*",
    "/prescriptions/:path*",
    "/billing/:path*",
    "/lab-orders/:path*",
    "/imaging-orders/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/services/:path*",
    "/login",
    "/register",
  ],
}
