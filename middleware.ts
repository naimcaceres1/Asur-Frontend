import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const path = nextUrl.pathname;

  // Rutas públicas de dashboard (no requieren autenticación)
  const publicDashboardRoutes = [
    "/dashboard/invite",
    "/dashboard/support",
    "/dashboard/guide",
    "/dashboard/contact",
  ];

  // Verificar si la ruta actual es pública
  const isPublicRoute = publicDashboardRoutes.some(route => 
    path.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Estas rutas requieren sesión
  const needsAuth =
    path === "/dashboard" ||
    path.startsWith("/dashboard/") ||
    path === "/profile" ||
    path.startsWith("/profile/");

  if (needsAuth && !req.auth) {
    const url = new URL("/auth/login", nextUrl);
    url.searchParams.set("callbackUrl", path + nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Si ya está logueado y va a /auth/login, mandarlo al dashboard
  if (path.startsWith("/auth/login") && req.auth) {
    return NextResponse.redirect(new URL("/dashboard/main", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/auth/login",
  ],
};