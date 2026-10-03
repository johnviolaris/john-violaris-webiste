import { NextResponse, type NextRequest } from "next/server";

import { deployment } from "@/lib/site-config";
import { updateSession } from "@/utils/supabase/middleware";

/** The one host search engines should index: johnviolaris.com. */
const canonicalHost = new URL(deployment.url).host;
const secondaryHost = new URL(deployment.secondaryUrl).host;
const canonicalAliases = new Set([
  `www.${canonicalHost}`,
  secondaryHost,
  `www.${secondaryHost}`,
]);

/** Private areas, never to be indexed on any host (SEO requirement REQ-035). */
const privatePath = /^\/(admin|auth)(\/|$)/;

/**
 * Keep everything but the canonical site out of search.
 *
 * The same deployment answers on more than one host: the `vercel.app` address
 * serves as staging today, preview deployments have hosts of their own, and
 * once johnviolaris.com points here the `vercel.app` alias carries on serving
 * the same pages. Only the canonical host may be indexed. Anything else gets
 * `X-Robots-Tag: noindex`, so a staging copy never competes with the real site
 * in search — its pages already name johnviolaris.com as canonical, but that
 * is a hint, where this is an instruction.
 *
 * Decided here, per request, because the pages are static: the same prebuilt
 * HTML is served on every host, so the page itself cannot say which one it is
 * on. The header rather than `robots.txt`, because a crawler must be allowed
 * to fetch a page to see that it should not index it.
 *
 * The admin and sign-in pages send it on every host, as well as the `noindex`
 * their layout already renders.
 */
export async function proxy(request: NextRequest) {
  // The `Host` header, not `request.nextUrl`: locally the URL carries the
  // server's own hostname, `localhost`, whatever host was asked for, while the
  // header is what the visitor actually requested. The port is ignored.
  const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
  const pathname = request.nextUrl.pathname;
  const lowercasePathname = pathname.toLowerCase();

  /*
   * Canonical URL redirects happen before the Supabase session refresh. They
   * carry the path and query through unchanged (apart from lowercasing the
   * path), avoid an unnecessary auth request, and use 308 so every request
   * method is preserved.
   *
   * Only the two known production aliases move to the canonical host. Vercel
   * preview/staging hosts continue serving in place and receive `noindex`
   * below, which keeps them useful for review without entering search.
   */
  if (canonicalAliases.has(host) || pathname !== lowercasePathname) {
    const destination = request.nextUrl.clone();

    if (canonicalAliases.has(host)) {
      destination.protocol = "https:";
      destination.host = canonicalHost;
      destination.port = "";
    }

    destination.pathname = lowercasePathname;

    return NextResponse.redirect(destination, 308);
  }

  const response = await updateSession(request);

  if (host !== canonicalHost || privatePath.test(pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
