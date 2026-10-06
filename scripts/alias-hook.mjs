/**
 * Teaches plain `node` the `@/*` path alias from `tsconfig.json`.
 *
 * The seed generator imports the same modules the app does, and the app writes
 * every internal import as `@/lib/...`. Rather than make one module use
 * relative paths just so a build script can read it, the script brings its own
 * resolver: `node --import ./scripts/alias-hook.mjs ...`.
 *
 * Node 24's `registerHooks` is synchronous and in-thread, so this runs before
 * the TypeScript type stripping that handles the `.ts` files themselves.
 */
import { existsSync } from "node:fs";
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const rootUrl = pathToFileURL(`${root}/`).href;

/** Extensionless imports are a bundler convenience; node wants the real file. */
const candidates = ["", ".ts", ".tsx", ".mts", ".js", "/index.ts", "/index.tsx"];

registerHooks({
  load(url, context, nextLoad) {
    // Node-only content/render fixtures cannot execute stylesheet side effects.
    // Keep resolution/existence checks; actual CSS is checked by the Next build,
    // asset gate and browser verification, rather than these HTML fixtures.
    if (url.startsWith(rootUrl) && !url.startsWith(`${rootUrl}node_modules/`) && url.endsWith(".css") && existsSync(new URL(url))) {
      return { format: "module", shortCircuit: true, source: "" };
    }
    return nextLoad(url, context);
  },
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) {
      return nextResolve(specifier, context);
    }

    const base = `${root}/${specifier.slice(2)}`;

    for (const extension of candidates) {
      const path = base + extension;

      if (existsSync(path)) {
        return { url: pathToFileURL(path).href, shortCircuit: true };
      }
    }

    throw new Error(`Could not resolve "${specifier}" under ${root}`);
  },
});
