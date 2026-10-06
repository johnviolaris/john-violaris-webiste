import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { parseEnv } from "node:util";
import { blockUnverifiedBackend, locationAcceptanceHelp, parseLocationAcceptanceOptions } from "./lib/location-acceptance.mjs";

try {
  const options = parseLocationAcceptanceOptions(process.argv.slice(2));
  if (options.help) console.log(locationAcceptanceHelp);
  else if (options.mode === "backend") {
    const env = parseEnv(await readFile(options.envFile, "utf8"));
    const result = blockUnverifiedBackend(options, env);
    console.error(JSON.stringify({ mode: "backend", completed: false, ...result, networkCalls: 0, hostedWrites: 0, tokensSubmitted: 0 }));
    process.exitCode = 1;
  } else {
    const result = spawnSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "scripts/location-workflow-fixture.mjs", "--fixture-only"], { encoding: "utf8", timeout: 30000 });
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exitCode = result.status === 0 ? 0 : 1;
  }
} catch {
  console.error("Location acceptance could not run. Use --help for explicit modes. Supplied paths and credentials are not echoed.");
  process.exitCode = 1;
}
