import { readFile } from "node:fs/promises";
import { parseArgs, parseEnv } from "node:util";
import { checkStagingEnvironment } from "./lib/staging-environment.mjs";

try {
  const { values } = parseArgs({ options: {
    "env-file": { type: "string" },
    "supabase-url": { type: "string" },
  }});
  if (!values["env-file"] || !values["supabase-url"]) {
    throw new Error("usage");
  }
  // Deliberately do not merge process.env or .env.local into this explicit file.
  const env = parseEnv(await readFile(values["env-file"], "utf8"));
  const result = checkStagingEnvironment(env, values["supabase-url"]);
  for (const error of result.errors) console.error(`FAIL: ${error}`);
  if (result.ok) console.log("PASS: initial staging configuration checks. No network calls or writes were made. Credentials, Auth/Storage isolation and delivery acceptance still require verification.");
  process.exitCode = result.ok ? 0 : 1;
} catch {
  console.error("Could not check the explicit staging file. Usage: npm run staging:preflight -- --env-file <private file> --supabase-url <test backend origin>");
  process.exitCode = 1;
}
