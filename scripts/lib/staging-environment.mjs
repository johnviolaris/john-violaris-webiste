// Configuration checks only: no network calls, authentication or database writes.
export const productionProjectRef = "mxvdjkuejumskbpessgo";

function endpoint(value) {
  try {
    const url = new URL(value);
    if (url.username || url.password || url.search || url.hash || url.pathname !== "/") return null;
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    const hostedRef = url.hostname.match(/^([a-z]{20})\.supabase\.co$/)?.[1];
    if (local && ["http:", "https:"].includes(url.protocol)) return { origin: url.origin, ref: null };
    if (hostedRef && url.protocol === "https:" && !url.port) return { origin: url.origin, ref: hostedRef };
  } catch { /* Report a fixed message without echoing credentials or input. */ }
  return null;
}

function legacyClaims(value) {
  if (!value.startsWith("eyJ")) return null;
  try {
    const parts = value.split(".");
    if (parts.length !== 3) return false;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return claims && typeof claims === "object" ? claims : false;
  } catch { return false; }
}

export function checkStagingEnvironment(env, expectedUrl) {
  const errors = [];
  const expected = endpoint(expectedUrl);
  const actual = endpoint(env.NEXT_PUBLIC_SUPABASE_URL || "");
  if (!expected) errors.push("Expected Supabase URL must be a loopback endpoint or HTTPS Supabase project origin.");
  if (!actual) errors.push("NEXT_PUBLIC_SUPABASE_URL must be a loopback endpoint or HTTPS Supabase project origin.");
  if (expected && actual && expected.origin !== actual.origin) errors.push("Supabase URL does not match the explicitly selected test backend.");
  if (expected?.ref === productionProjectRef || actual?.ref === productionProjectRef) errors.push("The production Supabase project cannot be used for staging acceptance.");

  for (const [name, prefix, role] of [
    ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_", "anon"],
    ["SUPABASE_SECRET_KEY", "sb_secret_", "service_role"],
  ]) {
    const value = env[name] || "";
    const claims = legacyClaims(value);
    if (claims === false || (!claims && !new RegExp(`^${prefix}[A-Za-z0-9_-]{16,}$`).test(value))) {
      errors.push(`${name} needs a key of the correct type from the selected test backend.`);
    } else if (claims) {
      if (claims.role !== role) errors.push(`${name} has the wrong legacy JWT role.`);
      if (claims.ref === productionProjectRef) errors.push(`${name} contains the production project reference.`);
      if (actual?.ref && claims.ref !== actual.ref) errors.push(`${name} does not name the selected Supabase project.`);
    }
  }
  if (env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === env.SUPABASE_SECRET_KEY) {
    errors.push("Public and privileged Supabase keys must be different.");
  }
  if ((env.RESEND_API_KEY || "").trim()) errors.push("Remove RESEND_API_KEY for the initial staging checks; these checks must not send enquiry emails.");
  if ((env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "").trim()) errors.push("Remove NEXT_PUBLIC_GA_MEASUREMENT_ID so staging does not report to production analytics.");
  if (!/^[A-Za-z0-9_-]{32,}$/.test(env.ENQUIRY_IP_SALT || "")) errors.push("Set a separate random ENQUIRY_IP_SALT of at least 32 characters for staging.");
  return { ok: errors.length === 0, errors };
}
