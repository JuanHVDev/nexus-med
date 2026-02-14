import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/api/protected"]
const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password", "/auth/reset-password", "/auth/verify-email", "/auth/sign-out"]

export async function middleware(request: NextRequest)
{
  const { pathname } = request.nextUrl
  // Verificar si es una ruta de autenticación
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  // Verificar si es una ruta protegida
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  // Obtener token de sesion de las cookies
  const sessionToken = request.cookies.get("better-auth.session_token")?.value
  // Si está en ruta de auth y tiene sesión, redirigir al dashboard
  if (isAuthRoute && sessionToken)
  {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  // Si está en ruta protegida y no tiene sesión, redirigir al login
  if (isProtectedRoute && !sessionToken)
  {
    const loginUrl = new URL("/auth/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname.toString())
    return NextResponse.redirect(loginUrl)
  }
  // Si está en ruta protegida y tiene sesión, continuar
  if (isProtectedRoute && sessionToken)
  {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)", "/dashboard/:path*", "/auth/:path*", "/api/protected/:path*"]
}