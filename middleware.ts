import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;
  
  const isProtectedRoot = ["/editor", "/customize", "/templates", "/admin"].some(path => 
    nextUrl.pathname.startsWith(path)
  );

  if (isProtectedRoot && !isAuthenticated) {
    return NextResponse.redirect(new URL("/?auth=signin", nextUrl));
  }

  // Admin protection
  if (nextUrl.pathname.startsWith("/admin") && !req.auth?.user?.isAdmin) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
