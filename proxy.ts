import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
const authRoutes = ["/login", "/register"]
export async function proxy(request: NextRequest)
{
  const { pathname } = request.nextUrl

  const isAuthRoute = authRoutes.includes(pathname)
  const isProtectedRoute = pathname.startsWith("/dashboard")

  const sessionToken = request.cookies.get("better-auth.session_token")?.value
  if (isAuthRoute && sessionToken)
  {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
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
    "/login",
    "/register",
  ],
}