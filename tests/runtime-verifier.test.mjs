import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import test from "node:test";
import sharp from "sharp";
import { canonicalAliases, canonicalOrigin, createRuntimeRequester, parseRuntimeOptions, verifyRuntime } from "../scripts/verify-runtime.mjs";

async function listen(server) {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server.address().port;
}
async function close(server) {
  server.closeAllConnections();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
function reply(url, status = 200, body = "", headers = {}) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(body);
  return { status, url: url.href, headers: new Headers(headers), async text() { return bytes.toString(); }, async arrayBuffer() { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength); } };
}
async function fixture({ previewStatus = 200, previewLocation, unsafeReset = false, missingPrivateCache = false, offsiteRedirectPath } = {}) {
  const image = await sharp({ create: { width: 1200, height: 630, channels: 3, background: "#ffffff" } }).jpeg().toBuffer();
  const calls = [];
  const cache = new Map();
  const security = {
    "content-security-policy": "default-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
    "x-content-type-options": "nosniff", "x-frame-options": "DENY", "referrer-policy": "strict-origin-when-cross-origin", "permissions-policy": "camera=()", "strict-transport-security": "max-age=63072000",
  };
  const requester = async (url, init = {}) => {
    calls.push({ url: new URL(url), init });
    const host = init.headers?.host ?? url.hostname;
    const redirectLocation = (path) => offsiteRedirectPath === url.pathname ? new URL(path, "https://evil.fixture.test").href : path;
    if (canonicalAliases.includes(host)) return reply(url, 308, "", { ...security, location: `${canonicalOrigin}${url.pathname}${url.search}` });
    if (url.pathname === "/ABOUT") return reply(url, 308, "", { ...security, location: redirectLocation(`/about${url.search}`) });
    if (url.pathname === "/Profile%207.png") return reply(url, 308, "", { ...security, location: redirectLocation("/john-violaris-portrait.webp") });
    if (url.pathname === "/share-image") return reply(url, 200, image, { ...security, "content-type": "image/jpeg" });
    if (url.pathname === "/john-violaris-portrait.webp") return reply(url, 200, "fixture", { ...security, "content-type": "image/webp" });
    if (url.hostname === "actual-preview.fixture.test" && url.pathname === "/about") return reply(url, previewStatus, "", { ...security, "x-robots-tag": "noindex, nofollow", ...(previewLocation ? { location: previewLocation } : {}) });
    const decoded = decodeURIComponent(url.pathname);
    const privatePath = /^\/(admin|auth|preview)(\/|$)/.test(decoded);
    const headers = { ...security, ...(privatePath || host !== "johnviolaris.com" ? { "x-robots-tag": "noindex, nofollow" } : {}), ...(privatePath && !missingPrivateCache ? { "cache-control": "private, no-store" } : {}) };
    if (decoded.startsWith("/admin") || decoded.startsWith("/preview")) return reply(url, 307, "", { ...headers, location: redirectLocation("/auth") });
    if (url.pathname === "/auth/update-password") return reply(url, 307, "", { ...headers, location: redirectLocation("/auth/forgot-password") });
    if (url.pathname === "/auth/confirm") return reply(url, 307, "", { ...headers, location: unsafeReset ? "https://evil.fixture.test/" : "/auth/forgot-password?error=link" });
    if (url.pathname === "/auth") return reply(url, 200, 'Admin sign in <a href="/auth/forgot-password">Forgot password</a>', headers);
    if (url.pathname === "/auth/forgot-password") return reply(url, 200, "Reset your password", headers);
    if (url.pathname.startsWith("/runtime-smoke-not-found-")) {
      const count = (cache.get(url.pathname) ?? 0) + 1; cache.set(url.pathname, count);
      return reply(url, 404, "Not found", { ...headers, "x-nextjs-cache": count > 1 ? "HIT" : "MISS" });
    }
    return reply(url, 200, "Public fixture", headers);
  };
  return { calls, requester };
}
const hosted = () => parseRuntimeOptions([canonicalOrigin, "--mode", "hosted", "--preview-url", "https://actual-preview.fixture.test"]);

test("runtime modes require intentional origins, explicit preview and isolated token opt-in", () => {
  assert.equal(parseRuntimeOptions([]).mode, "local");
  assert.equal(parseRuntimeOptions(["http://localhost:3002", "--probe-recovery-token"]).probeRecoveryToken, true);
  assert.equal(hosted().previewUrl.origin, "https://actual-preview.fixture.test");
  assert.deepEqual(parseRuntimeOptions(["--help"]), { help: true });
  for (const args of [[canonicalOrigin], [canonicalOrigin, "--mode", "hosted"], [canonicalOrigin, "--mode", "hosted", "--preview-url", canonicalOrigin], [canonicalOrigin, "--mode", "hosted", "--preview-url", "http://preview.fixture.test"], [canonicalOrigin, "--mode", "hosted", "--preview-url", "https://preview.fixture.test", "--probe-recovery-token"], ["http://user:password@localhost:3000"], ["http://localhost:3000/private"], ["http://localhost:3000?token=secret"], ["http://localhost:3000", "--mode", "unknown"], ["--unknown"], ["--mode", "local", "--mode", "local"]]) assert.throws(() => parseRuntimeOptions(args), args.join(" "));
});

test("native HTTP transport preserves the chosen Host and encoded path without following redirects", async () => {
  let observed;
  const server = http.createServer((request, response) => { observed = { host: request.headers.host, method: request.method, path: request.url }; response.writeHead(308, { location: "https://never-request.fixture.test/" }); response.end("redirect body"); });
  const port = await listen(server);
  try {
    const response = await createRuntimeRequester()(new URL(`http://127.0.0.1:${port}/%61dmin?source=fixture`), { headers: { host: "www.johnviolaris.com" } });
    assert.equal(response.status, 308);
    assert.equal(await response.text(), "redirect body");
    assert.deepEqual(observed, { host: "www.johnviolaris.com", method: "GET", path: "/%61dmin?source=fixture" });
    await assert.rejects(createRuntimeRequester()(new URL(`http://127.0.0.1:${port}`), { method: "POST" }), /GET-only/);
  } finally { await close(server); }
});

test("HTTPS uses its TLS client and verifies certificates, with test CA trust limited to its fixture agent", async () => {
  // Public disposable fixture material; never used by an application/server deployment.
  const [key, cert] = await Promise.all([readFile(new URL("./fixtures/runtime-tls/localhost-key.fixture", import.meta.url)), readFile(new URL("./fixtures/runtime-tls/localhost-cert.fixture", import.meta.url))]);
  let observed;
  const server = https.createServer({ key, cert }, (request, response) => { observed = request.headers.host; response.end("TLS fixture"); });
  const port = await listen(server);
  const agent = new https.Agent({ ca: cert });
  try {
    const url = new URL(`https://127.0.0.1:${port}/`);
    await assert.rejects(createRuntimeRequester()(url), /self-signed|certificate/);
    const response = await createRuntimeRequester({ httpsAgent: agent })(url, { headers: { host: "localhost" } });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), "TLS fixture");
    assert.equal(observed, "localhost");
  } finally { agent.destroy(); await close(server); }
});

test("native probes have a bounded deadline instead of hanging on an unresponsive server", async () => {
  const server = http.createServer(() => {});
  const port = await listen(server);
  try { await assert.rejects(createRuntimeRequester({ timeoutMs: 25 })(new URL(`http://127.0.0.1:${port}`)), /aborted/i); }
  finally { await close(server); }
});

test("hosted coverage uses real alias origins and explicit preview with GET-only, token-free requests", async () => {
  const f = await fixture();
  const coverage = await verifyRuntime(hosted(), f);
  assert.equal(coverage.completed, true);
  assert.deepEqual(coverage.realAliasOrigins, canonicalAliases.map((host) => `https://${host}`));
  assert.equal(coverage.simulatedHostRouting, false);
  assert.equal(coverage.preview.origin, "https://actual-preview.fixture.test");
  for (const call of f.calls) {
    assert.equal(call.url.protocol, "https:");
    assert.equal(call.init.headers, undefined);
    assert.equal(call.url.searchParams.has("token_hash"), false);
    assert.equal(call.url.searchParams.has("code"), false);
    assert.ok(!call.init.method || call.init.method === "GET");
  }
  const confirmation = f.calls.find((call) => call.url.pathname === "/auth/confirm");
  assert.equal(confirmation.url.searchParams.get("next"), "//evil.example/");
  assert.ok(f.calls.some((call) => call.url.pathname === "/%61dmin"));
  assert.ok(f.calls.some((call) => call.url.pathname.startsWith("/pr%65view/")));
});

test("local coverage retains simulated routing while forged token checks require explicit opt-in", async () => {
  for (const optIn of [false, true]) {
    const f = await fixture();
    const options = parseRuntimeOptions(["http://127.0.0.1:3000", ...(optIn ? ["--probe-recovery-token"] : [])]);
    const coverage = await verifyRuntime(options, f);
    assert.equal(coverage.simulatedHostRouting, true);
    assert.equal(f.calls.filter((call) => call.url.searchParams.has("token_hash")).length, optIn ? 1 : 0);
    assert.deepEqual(new Set(f.calls.filter((call) => call.init.headers?.host && canonicalAliases.includes(call.init.headers.host)).map((call) => call.init.headers.host)), new Set(canonicalAliases));
    assert.ok(f.calls.some((call) => call.init.headers?.host === "runtime-preview.local.test"));
    assert.match(coverage.recovery.forgedTokenVerification, optIn ? /passed/ : /not run/);
  }
});

test("actual preview protection is a failed/blocked acceptance, never silently skipped", async () => {
  for (const status of [401, 403, 302]) {
    const f = await fixture({ previewStatus: status, previewLocation: status === 302 ? "https://vercel.com/sso-api?url=preview&nonce=private-fixture-value" : undefined });
    await assert.rejects(verifyRuntime(hosted(), f), (error) => {
      assert.equal(error.code, "PREVIEW_PROTECTED");
      assert.equal(error.coverage.completed, false);
      assert.equal(error.coverage.targetProbesCompleted, true);
      assert.equal(error.coverage.preview.status, status);
      assert.equal(JSON.stringify(error.coverage).includes("private-fixture-value"), false);
      assert.equal(error.message.includes("private-fixture-value"), false);
      return true;
    });
    assert.equal(f.calls.at(-1).url.hostname, "actual-preview.fixture.test", "production-only probes complete before preview acceptance");
    assert.ok(f.calls.some((call) => call.url.pathname === "/auth/confirm"));
    assert.ok(f.calls.some((call) => call.url.pathname.startsWith("/pr%65view/")));
  }
  await assert.rejects(verifyRuntime(hosted(), await fixture({ previewStatus: 302, previewLocation: "https://vercel.com/sso-api?nonce=private-fixture-value", missingPrivateCache: true })), /cache-control/, "a protected preview must not mask a production security defect");
});

test("ordinary or non-Vercel preview redirects fail rather than being labelled protected", async () => {
  for (const location of ["https://ordinary.fixture.test/sso-api", "https://vercel.com/not-sso-api", "http://vercel.com/sso-api", "https://vercel.com.evil.fixture.test/sso-api", "https://user:password@vercel.com/sso-api", "/auth"]) {
    const f = await fixture({ previewStatus: 302, previewLocation: location });
    await assert.rejects(verifyRuntime(hosted(), f), (error) => error.code !== "PREVIEW_PROTECTED" && /a preview host must continue serving in place/.test(error.message));
    assert.equal(f.calls.at(-1).url.hostname, "actual-preview.fixture.test");
  }
});

test("otherwise-valid redirect paths cannot hide an off-site destination", async () => {
  for (const path of ["/ABOUT", "/Profile%207.png", "/admin", "/auth/update-password"]) {
    const f = await fixture({ offsiteRedirectPath: path });
    await assert.rejects(verifyRuntime(hosted(), f), /redirects must remain on the same origin/, path);
  }
});

test("hosted checks still reject missing private cache protection and unsafe reset destinations", async () => {
  const guarded = await fixture();
  await assert.rejects(verifyRuntime({ ...hosted(), probeRecoveryToken: true }, guarded), /forbidden in hosted mode/);
  assert.equal(guarded.calls.length, 0, "direct exported use cannot bypass the target guard");
  await assert.rejects(verifyRuntime(hosted(), await fixture({ missingPrivateCache: true })), /cache-control/);
  await assert.rejects(verifyRuntime(hosted(), await fixture({ unsafeReset: true })), /reset link must never leave the site/);
});
