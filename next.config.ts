import { execSync } from "node:child_process";
import type { NextConfig } from "next";

/**
 * A stable identifier for the build being produced.
 *
 * Resolved once, at build time, and inlined into both the browser and the
 * server bundles by the `env` block below, so every copy of a deployment
 * agrees on it. `/api/version` reports the server's copy; `VersionGuard`
 * compares it with the copy baked into the page the visitor is holding.
 *
 * A host's own deployment identifier is preferred, with the commit SHA as the
 * fallback for a self-hosted build from a checkout. When neither is available
 * the value is `"dev"`, which switches the check off rather than guessing: an
 * identifier that differed between the build and the running server would tell
 * every visitor to refresh, permanently.
 */
function resolveAppVersion(): string {
  const declared =
    process.env.NEXT_PUBLIC_APP_VERSION ||
    process.env.VERCEL_DEPLOYMENT_ID ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GIT_SHA;

  if (declared) {
    return declared;
  }

  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const appVersion = resolveAppVersion();

/**
 * The Supabase storage host, so `next/image` will serve article images.
 *
 * Derived from the configured project URL rather than written out: the host
 * carries the project reference, and a hardcoded one silently stops matching
 * the day the project is restored, branched or moved. If the URL is unset there
 * is no pattern, which is correct — nothing can be uploaded either.
 */
function supabaseImagePattern() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) return [];

  try {
    return [
      {
        protocol: "https" as const,
        hostname: new URL(url).hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ];
  } catch {
    return [];
  }
}

/** The configured Supabase origin, for images selected in the CMS. */
function supabaseOrigin(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) return null;

  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const isDevelopment = process.env.NODE_ENV === "development";
const configuredSupabaseOrigin = supabaseOrigin();
const reviewSolicitorsSources = [
  "https://www.reviewsolicitors.co.uk",
  "https://*.reviewsolicitors.co.uk",
];
/*
 * Fetched by the ReviewSolicitors side panel itself, not by this site: its
 * stylesheet imports Google Fonts, and reviewers without a photo get an
 * initials avatar. Recorded from the live widget on 2026-10-03; without these
 * the panel renders in fallback fonts with broken avatar images.
 */
const reviewSolicitorsStyleSources = ["https://fonts.googleapis.com"];
const reviewSolicitorsFontSources = ["https://fonts.gstatic.com"];
const reviewSolicitorsImageSources = ["https://ui-avatars.com"];
/*
 * After consent, Google's tag sends each hit to google-analytics.com and a
 * second copy to www.google.com/g/collect (seen on the live site 2026-10-04,
 * measurement ID G-K8HCZ0QKTE; Google lists the host for properties with
 * Google signals on). Blocking it only filled the console with CSP errors.
 */
const googleAnalyticsSecondarySources = ["https://www.google.com"];

/**
 * A static-compatible policy. A nonce policy would force every public route
 * to render dynamically, giving up the CDN-cached pages this site is built
 * around. Next's own inline bootstrap and JSON-LD therefore use
 * `unsafe-inline`; network script origins are otherwise limited to the
 * consent-gated GA tag and the ReviewSolicitors widget. `unsafe-inline` is a
 * residual XSS risk rather than a complete script boundary, so a nonce policy
 * should be reconsidered if these routes ever become request-rendered.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline'",
    isDevelopment ? "'unsafe-eval'" : null,
    "https://www.googletagmanager.com",
    ...reviewSolicitorsSources,
  ]
    .filter(Boolean)
    .join(" "),
  [
    "style-src 'self' 'unsafe-inline'",
    ...reviewSolicitorsSources,
    ...reviewSolicitorsStyleSources,
  ].join(" "),
  [
    "img-src 'self' data: blob:",
    configuredSupabaseOrigin,
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.googletagmanager.com",
    ...googleAnalyticsSecondarySources,
    ...reviewSolicitorsSources,
    ...reviewSolicitorsImageSources,
  ]
    .filter(Boolean)
    .join(" "),
  [
    "font-src 'self' data:",
    ...reviewSolicitorsSources,
    ...reviewSolicitorsFontSources,
  ].join(" "),
  [
    "connect-src 'self'",
    isDevelopment ? "ws:" : null,
    configuredSupabaseOrigin,
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://*.analytics.google.com",
    "https://*.googletagmanager.com",
    ...googleAnalyticsSecondarySources,
    ...reviewSolicitorsSources,
  ]
    .filter(Boolean)
    .join(" "),
  ["frame-src 'self'", ...reviewSolicitorsSources].join(" "),
  "worker-src 'self' blob:",
  "media-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  ...(isDevelopment
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=31536000; includeSubDomains",
        },
      ]),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseImagePattern(),
  },

  /**
   * Next's own version-skew protection. Static assets gain a `?dpl=` parameter,
   * client navigations carry the identifier, and a mismatch is resolved with a
   * hard navigation rather than a broken client-side one. It handles the
   * machinery; `VersionGuard` handles telling the visitor what happened.
   *
   * Left unset outside a real build — `next dev` has no deployment, and there
   * is nothing to protect against when the bundles are rebuilt in place.
   */
  deploymentId:
    process.env.NODE_ENV === "production" && appVersion !== "dev"
      ? appVersion
      : undefined,

  env: {
    NEXT_PUBLIC_APP_VERSION: appVersion,
  },

  /**
   * Files the default share card reads from disk. It is built at deploy time,
   * but a Site Settings change rebuilds it on the server, where only traced
   * files exist — and `public/` is not traced into a function by default.
   */
  outputFileTracingIncludes: {
    "/share-image": ["./assets/fonts/**", "./public/Profile 7.png"],
  },

  /**
   * The legacy URL inventory (REQ-026). The GoDaddy Website Builder site this
   * one replaced had a home page and an empty online-store section under
   * `/ols/` (checked 2026-09-25). The home page kept its address; anything
   * search engines still hold under `/ols/` goes there too. Here rather than
   * in the CMS redirect table, which only answers inside the page routes.
   */
  async redirects() {
    return [{ source: "/ols/:path*", destination: "/", permanent: true }];
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
      {
        source: "/auth/:path*",
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      },
    ];
  },
};

export default nextConfig;
