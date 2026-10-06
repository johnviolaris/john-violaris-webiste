import assert from "node:assert/strict";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { resolve as resolvePath } from "node:path";
import { pathToFileURL } from "node:url";
import sharp from "sharp";

export const canonicalOrigin = "https://johnviolaris.com";
export const canonicalAliases = ["drivingjustice.co.uk", "www.johnviolaris.com", "www.drivingjustice.co.uk"];
export const runtimeHelp = `Usage:
  npm run runtime:verify -- [http://127.0.0.1:3000] --mode local
  npm run runtime:verify -- https://johnviolaris.com --mode hosted --preview-url <actual-https-preview-origin>

Local mode (default) requires a loopback target. It checks forged Host routing,
encoded private paths and reset rejection before any Auth backend call.
--probe-recovery-token additionally tests a forged recovery token in LOCAL mode
only. Opt in only when the target uses isolated or unconfigured Supabase Auth.

Hosted mode checks real HTTPS alias origins and the explicitly supplied preview.
It sends GET requests only, without cookies, forged Host headers or Auth tokens.
A protected preview (401/403 or Vercel's sign-in redirect) is reported as blocked
after production probes complete, and exits unsuccessfully;
deployment protection is never disabled or bypassed. Local forged-Host and
token-verification coverage is reported separately, not claimed by hosted mode.
`;

export function parseRuntimeOptions(args) {
  if (args.includes("--help") || args.includes("-h")) return { help: true };
  let target, preview, mode = "local", probeRecoveryToken = false;
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--probe-recovery-token") {
      if (seen.has(argument)) throw new Error(`Repeated option: ${argument}`);
      seen.add(argument); probeRecoveryToken = true;
    } else if (argument === "--mode" || argument === "--preview-url") {
      if (seen.has(argument) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error(`Supply ${argument} once, with its value.`);
      seen.add(argument);
      if (argument === "--mode") mode = args[++index]; else preview = args[++index];
    } else if (argument.startsWith("-") || target) throw new Error(`Unexpected argument: ${argument}`);
    else target = argument;
  }
  if (!["local", "hosted"].includes(mode)) throw new Error("Choose --mode local or --mode hosted.");
  if (mode === "hosted" && !target) throw new Error("Hosted mode requires an explicit production URL.");
  const baseUrl = new URL(target ?? "http://127.0.0.1:3000");
  const originOnly = (url) => ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && url.pathname === "/" && !url.search && !url.hash;
  if (!originOnly(baseUrl)) throw new Error("The target must be an HTTP(S) origin without credentials, path, query or fragment.");
  if (mode === "local" && !["localhost", "127.0.0.1", "[::1]"].includes(baseUrl.hostname)) throw new Error("Local probes are restricted to a loopback target; use --mode hosted for production.");
  if (mode === "local" && preview) throw new Error("--preview-url belongs to hosted mode; local mode exercises a simulated Host.");
  let previewUrl = null;
  if (mode === "hosted") {
    if (baseUrl.origin !== canonicalOrigin) throw new Error(`Hosted mode requires the canonical origin ${canonicalOrigin}.`);
    if (probeRecoveryToken) throw new Error("Forged recovery-token probes are forbidden in hosted mode.");
    if (!preview) throw new Error("Hosted mode requires --preview-url with the actual deployment origin; no preview hostname is invented.");
    previewUrl = new URL(preview);
    if (!originOnly(previewUrl) || previewUrl.protocol !== "https:" || previewUrl.port || ["localhost", "127.0.0.1", "[::1]", "johnviolaris.com", ...canonicalAliases].includes(previewUrl.hostname)) throw new Error("Supply a distinct actual HTTPS preview origin without credentials, path, query, fragment or custom port.");
  }
  return { mode, baseUrl, previewUrl, probeRecoveryToken };
}

/** Manual redirects and protocol-correct native GETs; TLS verification stays on. */
export function createRuntimeRequester({ httpAgent, httpsAgent, timeoutMs = 15000 } = {}) {
  return async (target, init = {}) => {
    const url = new URL(target);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Runtime probes support HTTP(S) only.");
    if (init.method && init.method !== "GET") throw new Error("Runtime probes are GET-only.");
    const send = url.protocol === "https:" ? httpsRequest : httpRequest;
    return new Promise((resolve, reject) => {
      const outgoing = send(url, {
        method: "GET", headers: init.headers?.host ? { host: init.headers.host } : {},
        agent: url.protocol === "https:" ? httpsAgent : httpAgent,
        signal: AbortSignal.timeout(timeoutMs),
      }, (incoming) => {
        const headers = new Headers();
        for (const [name, value] of Object.entries(incoming.headers)) {
          if (Array.isArray(value)) {
            for (const item of value) headers.append(name, item);
          } else if (value !== undefined) {
            headers.set(name, value);
          }
        }
        const chunks = [];
        let length = 0;
        incoming.on("data", (chunk) => {
          length += chunk.length;
          if (length > 8 * 1024 * 1024) incoming.destroy(new Error("Runtime response exceeded 8 MiB."));
          else chunks.push(chunk);
        });
        incoming.on("error", reject);
        incoming.on("end", () => {
          const body = Buffer.concat(chunks);
          resolve({ status: incoming.statusCode ?? 0, headers, url: url.href,
            async text() { return body.toString("utf8"); },
            async arrayBuffer() { return body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength); },
          });
        });
      });
      outgoing.on("error", reject);
      outgoing.end();
    });
  };
}

function header(response, name) {
  const value = response.headers.get(name);
  assert.ok(value, `${response.url || "response"} must send ${name}`);
  return value;
}

export async function verifyRuntime(options, { requester = createRuntimeRequester() } = {}) {
  // Exported use follows the same target guard as the CLI, before any request.
  const { baseUrl, mode, previewUrl, probeRecoveryToken } = parseRuntimeOptions([
    String(options.baseUrl), "--mode", options.mode,
    ...(options.previewUrl ? ["--preview-url", String(options.previewUrl)] : []),
    ...(options.probeRecoveryToken ? ["--probe-recovery-token"] : []),
  ]);
  async function request(path, init) {
    const url = new URL(path, baseUrl);
    if (mode === "hosted" && init?.headers?.host) throw new Error("Hosted probes must use real origins, never override Host.");
    return { response: await requester(url, init), url };
  }
  async function requestWithHost(path, host) {
    const { response } = await request(path, { headers: { host } });
    return response;
  }
  async function privateRequest(path) {
    return mode === "local" ? requestWithHost(path, "johnviolaris.com") : (await request(path)).response;
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

  // Exercise the multi-segment CMS redirect resolver, including its cached miss.
  // A missing saved redirect must remain a 404 when served again through ISR.
  for (let attempt = 0; attempt < 2; attempt++) {
    const { response } = await request(`${missingPath}/nested`);
    assert.equal(response.status, 404, "a missing catch-all route must remain a 404");
    await response.text();
    if (attempt === 1 && response.headers.get("x-nextjs-cache")) {
      assert.match(header(response, "x-nextjs-cache"), /^(HIT|STALE)$/, "catch-all misses must use ISR caching");
    }
  }

  const { response: uppercase } = await request("/ABOUT?source=smoke", {
    redirect: "manual",
  });
  assert.equal(uppercase.status, 308, "uppercase paths must redirect permanently");
  const uppercaseLocation = new URL(header(uppercase, "location"), baseUrl);
  assert.equal(uppercaseLocation.origin, baseUrl.origin, "uppercase redirects must remain on the same origin");
  assert.equal(uppercaseLocation.pathname, "/about");
  assert.equal(uppercaseLocation.search, "?source=smoke");

  const { response: oldPortrait } = await request("/Profile%207.png", { redirect: "manual" });
  assert.equal(oldPortrait.status, 308, "saved CMS portrait URLs must keep working through a permanent redirect");
  const portraitLocation = new URL(header(oldPortrait, "location"), baseUrl);
  assert.equal(portraitLocation.origin, baseUrl.origin, "portrait redirects must remain on the same origin");
  assert.equal(portraitLocation.pathname, "/john-violaris-portrait.webp");
  const { response: portrait } = await request("/john-violaris-portrait.webp");
  assert.equal(portrait.status, 200, "compressed portrait must be served");
  assert.match(header(portrait, "content-type"), /^image\/webp/);

  const { response: shareImage } = await request("/share-image");
  assert.equal(shareImage.status, 200, "default share card must render");
  assert.match(header(shareImage, "content-type"), /^image\/jpeg/);
  const shareMetadata = await sharp(Buffer.from(await shareImage.arrayBuffer())).metadata();
  assert.equal(shareMetadata.format, "jpeg");
  assert.equal(shareMetadata.width, 1200);
  assert.equal(shareMetadata.height, 630);

  const secondaryPath = "/services/speeding?source=secondary&campaign=smoke";
  const secondary = mode === "local"
    ? await requestWithHost(secondaryPath, "drivingjustice.co.uk")
    : (await request(new URL(secondaryPath, "https://drivingjustice.co.uk"))).response;
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
    const { response } = await request(mode === "local" ? secondaryPath : new URL(secondaryPath, `https://${alias}`), {
      redirect: "manual",
      ...(mode === "local" ? { headers: { host: alias } } : {}),
    });

    assert.equal(response.status, 308, `${alias} must redirect permanently`);
    const location = new URL(header(response, "location"));
    assert.equal(location.origin, "https://johnviolaris.com");
    assert.equal(location.pathname, "/services/speeding");
    assert.equal(location.search, "?source=secondary&campaign=smoke");
  }

  const { response: admin } = await request("/admin", { redirect: "manual" });
  assert.ok(
    [303, 307, 308].includes(admin.status),
    `/admin must redirect when unauthenticated, received ${admin.status}`,
  );
  const adminLocation = new URL(header(admin, "location"), baseUrl);
  assert.equal(adminLocation.origin, baseUrl.origin, "admin redirects must remain on the same origin");
  assert.equal(adminLocation.pathname, "/auth");
  assert.match(header(admin, "x-robots-tag"), /\bnoindex\b/);

  const { response: auth } = await request("/auth");
  assert.equal(auth.status, 200, "sign-in page must render");
  assert.match(header(auth, "x-robots-tag"), /\bnoindex\b/);

  // Private draft URLs must send the same protection on the indexable host too.
  const draft = await privateRequest("/preview/blog/00000000-0000-0000-0000-000000000000");
  assert.match(header(draft, "x-robots-tag"), /\bnoindex\b/);
  assert.match(header(draft, "cache-control"), /\bprivate\b/);
  assert.match(header(draft, "cache-control"), /\bno-store\b/);
  assert.ok([303, 307, 308].includes(draft.status), "unauthenticated visitors must not view a draft");

  // Encoded private segment names must keep private headers even if routing
  // rejects the alias. In particular they must not become indexable cached pages.
  for (const path of [
    "/%61dmin",
    "/pr%65view/blog/00000000-0000-0000-0000-000000000000",
  ]) {
    const response = await privateRequest(path);
    assert.match(header(response, "x-robots-tag"), /\bnoindex\b/, path);
    assert.match(header(response, "cache-control"), /\bprivate\b/, path);
    assert.match(header(response, "cache-control"), /\bno-store\b/, path);
    assert.ok([303, 307, 308, 404].includes(response.status), `${path} must not serve unauthenticated private content`);
  }

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
  const updateLocation = new URL(header(update, "location"), baseUrl);
  assert.equal(updateLocation.origin, baseUrl.origin, "password-update redirects must remain on the same origin");
  assert.equal(updateLocation.pathname, "/auth/forgot-password");

  // No token or code means this rejection happens before any Auth backend call.
  // The isolated local opt-in additionally retains the forged-token assertion.
  const recoveryPaths = ["/auth/confirm?type=recovery&next=//evil.example/"];
  if (probeRecoveryToken) recoveryPaths.push("/auth/confirm?token_hash=forged&type=recovery&next=//evil.example/");
  for (const recoveryPath of recoveryPaths) {
    const { response: forgedLink } = await request(recoveryPath, { redirect: "manual" });
    assert.ok(
      [303, 307, 308].includes(forgedLink.status),
      `/auth/confirm must redirect a bad link, received ${forgedLink.status}`,
    );
    const forgedTarget = new URL(header(forgedLink, "location"), baseUrl);
    assert.equal(forgedTarget.origin, baseUrl.origin, "a reset link must never leave the site");
    assert.equal(forgedTarget.pathname, "/auth/forgot-password");
    assert.equal(forgedTarget.searchParams.get("error"), "link");
  }

  const coverage = { mode, completed: true, targetProbesCompleted: true, baseOrigin: baseUrl.origin,
    realAliasOrigins: mode === "hosted" ? canonicalAliases.map((host) => `https://${host}`) : [],
    simulatedHostRouting: mode === "local", encodedPrivatePaths: true,
    preview: { origin: mode === "hosted" ? previewUrl.origin : "simulated local Host", acceptance: "passed" },
    recovery: { missingTokenOffsiteNext: "passed", forgedTokenVerification: probeRecoveryToken ? "passed against explicitly opted-in local target" : "not run; isolated local opt-in required" },
    limitations: mode === "hosted" ? ["GET-only unauthenticated probes; no CMS/enquiry writes, token verification or simulated Host routing."] : ["Local Host simulation does not prove real deployment DNS/TLS routing."] };

  // A protected deployment must not obscure production-only acceptance. Keep
  // redirects manual and never follow or record a protection nonce/query value.
  const { response: preview } = await request(mode === "local" ? "/about" : new URL("/about", previewUrl), {
    redirect: "manual",
    ...(mode === "local" ? { headers: { host: "runtime-preview.local.test" } } : {}),
  });
  let vercelSignIn = false;
  if (mode === "hosted" && preview.status === 302) {
    try {
      const location = new URL(preview.headers.get("location"), previewUrl);
      vercelSignIn = location.origin === "https://vercel.com" && location.pathname === "/sso-api" && !location.username && !location.password;
    } catch { /* Other or malformed redirects fail the ordinary status check. */ }
  }
  if (mode === "hosted" && ([401, 403].includes(preview.status) || vercelSignIn)) {
    const blocked = new Error(`Actual preview ${previewUrl.origin} returned ${preview.status}${vercelSignIn ? " with Vercel's sign-in redirect" : ""}. Production-only probes passed, but anonymous preview acceptance is blocked, not passed. No protection was disabled.`);
    blocked.code = "PREVIEW_PROTECTED";
    blocked.coverage = { ...coverage, completed: false, preview: { origin: previewUrl.origin, status: preview.status, acceptance: "blocked", ...(vercelSignIn ? { protection: "Vercel sign-in redirect" } : {}) } };
    throw blocked;
  }
  assert.equal(preview.status, 200, "a preview host must continue serving in place");
  assert.match(header(preview, "x-robots-tag"), /\bnoindex\b/);
  return coverage;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolvePath(process.argv[1])).href) {
  try {
    const options = parseRuntimeOptions(process.argv.slice(2));
    if (options.help) console.log(runtimeHelp);
    else {
      const coverage = await verifyRuntime(options);
      console.log(`Runtime smoke checks passed (${options.mode}): public, 404, canonical redirects, auth, admin, and headers.`);
      console.log(JSON.stringify(coverage));
    }
  } catch (error) {
    console.error(error.message);
    if (error.coverage) console.error(JSON.stringify(error.coverage));
    process.exitCode = 1;
  }
}
