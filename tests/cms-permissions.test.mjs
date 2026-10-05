import assert from "node:assert/strict";
import test from "node:test";
import { cmsRole, canEditSeo, canManageContent } from "@/lib/cms/permissions.ts";

test("SEO delegation admits only stored recognised CMS roles", () => {
  for (const role of [null, undefined, "user", "editor", "owner", "ADMIN", {}, ""]) {
    assert.equal(cmsRole(role), null);
    assert.equal(canEditSeo(role), false);
    assert.equal(canManageContent(role), false);
  }
  assert.equal(cmsRole("seo_editor"), "seo_editor");
  assert.equal(canEditSeo("seo_editor"), true);
  assert.equal(canManageContent("seo_editor"), false);
  assert.equal(canEditSeo("admin"), true);
  assert.equal(canManageContent("admin"), true);
});
