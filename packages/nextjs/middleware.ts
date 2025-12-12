import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware for adding compression and security headers
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add compression hint headers
  response.headers.set("Accept-Encoding", "gzip, deflate, br");

  // Add caching headers for static assets
  if (
    request.nextUrl.pathname.startsWith("/_next/static/") ||
    request.nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }

  // Add preload headers for critical resources
  if (request.nextUrl.pathname === "/") {
    response.headers.set(
      "Link",
      "</fonts/inter.woff2>; rel=preload; as=font; crossorigin=anonymous, " +
        "</_next/static/css/app.css>; rel=preload; as=style",
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/webpack-hmr (hot-module reloading)
     */
    "/((?!api|_next/webpack-hmr).*)",
  ],
};
