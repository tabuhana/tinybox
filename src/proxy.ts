import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") ?? "";
  const rootDomain = process.env.NEXT_PUBLIC_DOMAIN ?? "";

  if (rootDomain && host !== rootDomain && host.endsWith(`.${rootDomain}`)) {
    const subdomain = host.slice(0, host.length - rootDomain.length - 1);
    if (subdomain && !subdomain.includes(".")) {
      url.pathname = `/${subdomain}${url.pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  if (url.pathname === "/sign-in" || url.pathname === "/sign-up") {
    return NextResponse.redirect(new URL("/agency/sign-in", request.url));
  }

  if (url.pathname === "/" && host === rootDomain) {
    url.pathname = "/site";
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
