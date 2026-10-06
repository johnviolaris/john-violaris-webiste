import { checkStagingEnvironment } from "./staging-environment.mjs";

export const locationAcceptanceHelp = `Usage:
  node scripts/verify-location-acceptance.mjs --mode fixtures
  node scripts/verify-location-acceptance.mjs --mode backend --env-file <private file> --supabase-url <isolated origin> --app-url <isolated app origin>

Fixtures exercise actual application modules with in-memory storage and blocked
network APIs. They do not verify real Auth, RLS, Storage, HTTP caching or email.
Backend mode is preparation only: no reviewed identity verifier/browser adapter
exists yet. It exits nonzero before tokens, network or writes, even if the
offline staging preflight passes. No running app or database is modified.
`;

export function parseLocationAcceptanceOptions(args) {
  if (args.length === 1 && ["--help", "-h"].includes(args[0])) return { help: true };
  const options = {};
  const names = new Map([["--mode", "mode"], ["--env-file", "envFile"], ["--supabase-url", "supabaseUrl"], ["--app-url", "appUrl"]]);
  for (let index = 0; index < args.length; index += 2) {
    const name = names.get(args[index]);
    if (!name || options[name] || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("Supply each documented option once, with its value.");
    options[name] = args[index + 1];
  }
  if (!["fixtures", "backend"].includes(options.mode)) throw new Error("Choose an explicit --mode fixtures or --mode backend.");
  if (options.mode === "fixtures" && Object.keys(options).length !== 1) throw new Error("Fixture mode accepts no backend, app or credential options.");
  if (options.mode === "backend" && !["envFile", "supabaseUrl", "appUrl"].every((name) => options[name])) throw new Error("Backend preparation requires the explicit private file and both selected origins.");
  return options;
}

/** Offline, fixed diagnostics only. A passing format check never enables writes. */
export function blockUnverifiedBackend(options, env) {
  const checked = checkStagingEnvironment(env, options.supabaseUrl);
  if (!checked.ok) return { ok: false, code: "STAGING_PREFLIGHT_FAILED", errors: checked.errors };
  try {
    const app = new URL(options.appUrl);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(app.hostname);
    const production = ["johnviolaris.com", "www.johnviolaris.com", "drivingjustice.co.uk", "www.drivingjustice.co.uk"].includes(app.hostname.replace(/\.$/, ""));
    if (app.username || app.password || app.pathname !== "/" || app.search || app.hash || production || !(app.protocol === "https:" || (local && app.protocol === "http:"))) throw new Error("unsafe");
  } catch { return { ok: false, code: "APP_TARGET_REJECTED", errors: ["Select an isolated HTTP loopback or HTTPS app origin without credentials, path, query or fragment; production aliases are forbidden."] }; }
  return { ok: false, code: "BACKEND_ACCEPTANCE_UNAVAILABLE", errors: ["A reviewed verifier for the running app's server-side backend identity and a real browser acceptance adapter are unavailable. No tokens, network calls or writes will be attempted."] };
}
