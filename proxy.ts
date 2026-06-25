import { NextRequest, NextResponse } from "next/server";

const ROOT_DOMAIN = "gerhardkirchschlaeger.at";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host")?.split(":")[0] || "";
  const pathname = url.pathname;

  const isAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/studio") ||
    pathname.includes(".");

  if (isAsset) {
    return NextResponse.next();
  }

  if (hostname === `portfolio.${ROOT_DOMAIN}`) {
    url.pathname = pathname === "/" ? "/portfolio" : `/portfolio${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (hostname === `fonts.${ROOT_DOMAIN}`) {
    url.pathname = pathname === "/" ? "/fonts" : `/fonts${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};