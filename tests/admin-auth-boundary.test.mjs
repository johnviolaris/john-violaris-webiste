import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

async function source(path) {
  return readFile(new URL(path, root), "utf8");
}

test("the authorized client verifies the admin before creating a session client", async () => {
  const auth = await source("lib/auth.ts");
  const helper = auth.slice(auth.indexOf("export async function createAuthorizedAdminClient"));
  const authorization = helper.indexOf("await requireAdmin()");
  const clientCreation = helper.indexOf("return createClient()");

  assert.notEqual(authorization, -1, "authorized client must call requireAdmin");
  assert.notEqual(clientCreation, -1, "authorized client must create a session client");
  assert.ok(
    authorization < clientCreation,
    "authorization must finish before the Supabase client is returned",
  );
});

test("missing Supabase configuration fails closed before client creation", async () => {
  const auth = await source("lib/auth.ts");
  const sessionBoundary = auth.slice(
    auth.indexOf("export const getAdminSession"),
    auth.indexOf("export async function requireAdmin"),
  );
  const urlCheck = sessionBoundary.indexOf("NEXT_PUBLIC_SUPABASE_URL");
  const keyCheck = sessionBoundary.indexOf(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  );
  const closedResult = sessionBoundary.indexOf("return null");
  const clientCreation = sessionBoundary.indexOf("await createClient()");

  for (const [name, position] of [
    ["Supabase URL check", urlCheck],
    ["Supabase key check", keyCheck],
    ["closed result", closedResult],
    ["client creation", clientCreation],
  ]) {
    assert.notEqual(position, -1, `${name} must remain in the session boundary`);
  }

  assert.ok(urlCheck < clientCreation);
  assert.ok(keyCheck < clientCreation);
  assert.ok(closedResult < clientCreation);
});

test("public account creation is absent from both the UI and server actions", async () => {
  const [form, actions] = await Promise.all([
    source("app/auth/auth-form.tsx"),
    source("app/auth/actions.ts"),
  ]);

  assert.doesNotMatch(form, /sign[ -]?up/i);
  assert.doesNotMatch(actions, /signUp\s*\(/);
  assert.doesNotMatch(actions, /auth\.signUp\s*\(/);
});

const protectedReadModules = [
  {
    path: "lib/cms/admin-queries.ts",
    exports: [
      "listServiceGroups",
      "getServiceGroup",
      "listServices",
      "getService",
      "getServicePageFor",
      "listServicePages",
      "listTestimonials",
      "getTestimonial",
      "listBlogPosts",
      "getBlogPost",
      "listBlogCategories",
      "countPostsByCategory",
      "listSeoMetadata",
      "getSeoRow",
      "listSiteSettings",
      "getPageSections",
      "listEditedSections",
    ],
  },
  {
    path: "lib/enquiries/queries.ts",
    exports: [
      "listEnquiries",
      "getEnquiry",
      "countEnquiries",
      "countNewEnquiries",
      "countUndeliveredEnquiries",
    ],
  },
];

for (const protectedModule of protectedReadModules) {
  test(`${protectedModule.path} gates every protected read`, async () => {
    const contents = await source(protectedModule.path);
    const cachedExports = [
      ...contents.matchAll(/export const\s+(\w+)\s*=\s*cache\s*\(/g),
    ].map((match) => match[1]);

    assert.deepEqual(
      cachedExports.sort(),
      [...protectedModule.exports].sort(),
      "update this test whenever the protected read surface changes",
    );
    assert.doesNotMatch(
      contents,
      /@\/utils\/supabase\/server/,
      "protected reads must not bypass the authorized client",
    );

    for (const [index, name] of protectedModule.exports.entries()) {
      const start = contents.indexOf(`export const ${name}`);
      const nextStarts = protectedModule.exports
        .slice(index + 1)
        .map((next) => contents.indexOf(`export const ${next}`, start + 1))
        .filter((position) => position !== -1);
      const end = nextStarts.length > 0 ? Math.min(...nextStarts) : contents.length;
      const body = contents.slice(start, end);

      assert.match(
        body,
        /await createAuthorizedAdminClient\(\)/,
        `${name} must authorize before reading Supabase`,
      );
    }
  });
}
