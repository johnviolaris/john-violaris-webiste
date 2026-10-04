import assert from "node:assert/strict";
import http from "node:http";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";

const baseUrl = new URL(process.argv[2] ?? "http://127.0.0.1:3000");

async function request(path, init) {
  const url = new URL(path, baseUrl);

  // WHATWG fetch intentionally does not let callers override `Host`. Use the
  // native client for domain-routing checks so Proxy sees the same header it
  // receives behind Vercel; the rest of the smoke test keeps using fetch.
  if (init?.headers?.host) {
    const response = await new Promise((resolve, reject) => {
      const req = http.request(
        url,
        { method: init.method ?? "GET", headers: init.headers },
        (incoming) => {
          const chunks = [];

          incoming.on("data", (chunk) => chunks.push(chunk));
          incoming.on("end", () => {
            const body = Buffer.concat(chunks).toString("utf8");

            resolve({
              status: incoming.statusCode,
              url: url.href,
              headers: {
                get(name) {
                  const value = incoming.headers[name.toLowerCase()];

                  return Array.isArray(value) ? value.join(", ") : (value ?? null);
                },
              },
              async text() {
                return body;
              },
            });
          });
        },
      );

      req.on("error", reject);
      req.end();
    });

    return { response, url };
  }

  const response = await fetch(url, init);

  return { response, url };
}

/** Node's Fetch implementation may discard `Host`; the HTTP client does not. */
async function requestWithHost(path, host) {
  const url = new URL(path, baseUrl);
  const send = url.protocol === "https:" ? httpsRequest : httpRequest;

  return new Promise((resolve, reject) => {
    const outgoing = send(url, { headers: { host } }, (incoming) => {
      const headers = new Headers();

      for (const [name, value] of Object.entries(incoming.headers)) {
        if (Array.isArray(value)) {
          for (const item of value) headers.append(name, item);
        } else if (value !== undefined) {
          headers.set(name, value);
        }
      }

      incoming.resume();
      incoming.on("end", () =>
        resolve({
          status: incoming.statusCode ?? 0,
          headers,
          url: url.href,
        }),
      );
    });

    outgoing.on("error", reject);
    outgoing.end();
  });
}

function header(response, name) {
  const value = response.headers.get(name);
  assert.ok(value, `${response.url || "response"} must send ${name}`);
  return value;
}

const { response: home } = await request("/");
assert.equal(home.status, 200, "home page must render");

const csp = header(home, "content-security-policy");
for (const directive of [
  "default-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
]) {
  assert.ok(csp.includes(directive), `CSP must include ${directive}`);
}

assert.equal(header(home, "x-content-type-options"), "nosniff");
assert.equal(header(home, "x-frame-options"), "DENY");
assert.equal(
  header(home, "referrer-policy"),
  "strict-origin-when-cross-origin",
);
header(home, "permissions-policy");
header(home, "strict-transport-security");

const missingPath = `/runtime-smoke-not-found-${Date.now()}`;
const { response: missing } = await request(missingPath);
assert.equal(missing.status, 404, "an unknown route must return 404");

const { response: uppercase } = await request("/ABOUT?source=smoke", {
  redirect: "manual",
});
assert.equal(uppercase.status, 308, "uppercase paths must redirect permanently");
const uppercaseLocation = new URL(header(uppercase, "location"), baseUrl);
assert.equal(uppercaseLocation.pathname, "/about");
assert.equal(uppercaseLocation.search, "?source=smoke");

const secondaryPath = "/services/speeding?source=secondary&campaign=smoke";
const secondary = await requestWithHost(secondaryPath, "drivingjustice.co.uk");
assert.equal(
  secondary.status,
  308,
  "the secondary production host must redirect permanently",
);
const secondaryLocation = new URL(header(secondary, "location"));
assert.equal(secondaryLocation.origin, "https://johnviolaris.com");
assert.equal(secondaryLocation.pathname, "/services/speeding");
assert.equal(secondaryLocation.search, "?source=secondary&campaign=smoke");

for (const alias of ["www.johnviolaris.com", "www.drivingjustice.co.uk"]) {
  const { response } = await request(secondaryPath, {
    redirect: "manual",
    headers: { host: alias },
  });

  assert.equal(response.status, 308, `${alias} must redirect permanently`);
  const location = new URL(header(response, "location"));
  assert.equal(location.origin, "https://johnviolaris.com");
  assert.equal(location.pathname, "/services/speeding");
  assert.equal(location.search, "?source=secondary&campaign=smoke");
}

const { response: preview } = await request("/about", {
  redirect: "manual",
  headers: { host: "john-violaris-preview.vercel.app" },
});
assert.equal(preview.status, 200, "a preview host must continue serving in place");
assert.match(header(preview, "x-robots-tag"), /\bnoindex\b/);

const { response: admin } = await request("/admin", { redirect: "manual" });
assert.ok(
  [303, 307, 308].includes(admin.status),
  `/admin must redirect when unauthenticated, received ${admin.status}`,
);
assert.equal(new URL(header(admin, "location"), baseUrl).pathname, "/auth");
assert.match(header(admin, "x-robots-tag"), /\bnoindex\b/);

const { response: auth } = await request("/auth");
assert.equal(auth.status, 200, "sign-in page must render");
assert.match(header(auth, "x-robots-tag"), /\bnoindex\b/);

const authHtml = await auth.text();
assert.match(authHtml, /Admin sign in/);
assert.doesNotMatch(
  authHtml,
  /Request admin access|Create an account to request access|>\s*Sign up\s*</i,
  "the invite-only sign-in page must not expose public registration",
);
assert.match(
  authHtml,
  /href="\/auth\/forgot-password"/,
  "the sign-in page must link to password recovery",
);

const { response: forgot } = await request("/auth/forgot-password");
assert.equal(forgot.status, 200, "the password reset page must render");
assert.match(header(forgot, "x-robots-tag"), /\bnoindex\b/);
assert.match(await forgot.text(), /Reset your password/);

const { response: update } = await request("/auth/update-password", {
  redirect: "manual",
});
assert.ok(
  [303, 307, 308].includes(update.status),
  `/auth/update-password must redirect without a session, received ${update.status}`,
);
assert.equal(
  new URL(header(update, "location"), baseUrl).pathname,
  "/auth/forgot-password",
);

// A forged reset link, with a `next` pointing off the site. It must neither
// verify nor carry the visitor anywhere but the request form.
const { response: forgedLink } = await request(
  "/auth/confirm?token_hash=forged&type=recovery&next=//evil.example/",
  { redirect: "manual" },
);
assert.ok(
  [303, 307, 308].includes(forgedLink.status),
  `/auth/confirm must redirect a bad link, received ${forgedLink.status}`,
);
const forgedTarget = new URL(header(forgedLink, "location"), baseUrl);
assert.equal(forgedTarget.origin, baseUrl.origin, "a reset link must never leave the site");
assert.equal(forgedTarget.pathname, "/auth/forgot-password");
assert.equal(forgedTarget.searchParams.get("error"), "link");

console.log(
  "Runtime smoke checks passed: public, 404, canonical redirects, auth, admin, and headers.",
);
