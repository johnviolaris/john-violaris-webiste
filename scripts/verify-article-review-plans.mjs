/** Real action/read modules; simulated Auth and storage, with network forbidden. */
import assert from "node:assert/strict";
import test from "node:test";
import { registerHooks, syncBuiltinESMExports } from "node:module";
import { pathToFileURL } from "node:url";
import http from "node:http";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
const noNetwork = () => { throw new Error("Network forbidden in review-plan fixtures"); };
globalThis.fetch = noNetwork;
http.get = http.request = https.get = https.request = net.connect = net.createConnection = tls.connect = noNetwork;
net.Socket.prototype.connect = net.Server.prototype.listen = noNetwork;
syncBuiltinESMExports();
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://review-plan-fixture.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_synthetic_fixture_only";
const id = "00000000-0000-4000-8000-000000003211";
const state = globalThis.__reviewPlanFixture = { role: "admin", plan: null, calls: [], paths: [], error: null, refreshFails: false, invalidList: false };
const article = { title: "Unchanged synthetic article", content: { body: [{ heading: "Original", paragraphs: ["Unchanged fixture prose"] }] }, updated_at: "2026-01-01T12:00:00Z" };
const before = structuredClone(article);
const root = pathToFileURL(`${process.cwd()}/`).href;
registerHooks({
  resolve(specifier, context, next) {
    if (["server-only", "next/cache", "next/navigation"].includes(specifier)) return { url: `review-fixture:${specifier}`, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (url === "review-fixture:server-only") return { format: "module", source: "", shortCircuit: true };
    if (url === "review-fixture:next/navigation") return { format: "module", source: "export function redirect(path){throw new Error('Fixture redirect '+path);}", shortCircuit: true };
    if (url === "review-fixture:next/cache") return { format: "module", source: "export function revalidatePath(path){const f=globalThis.__reviewPlanFixture;if(f.refreshFails)throw new Error('Fixture refresh unavailable');f.paths.push(path);}", shortCircuit: true };
    if (url === new URL("utils/supabase/server.ts", root).href) return { format: "module", source: "export async function createClient(){return globalThis.__reviewPlanFixture.client;}", shortCircuit: true };
    return next(url, context);
  },
});
state.client = {
  auth: { async getClaims() { return ["anonymous", "expired"].includes(state.role) ? { data: null, error: new Error("Fixture invalid session") } : { data: { claims: { sub: id } }, error: null }; } },
  from(table) {
    if (table === "profiles") return { select() { return this; }, eq() { return this; }, async maybeSingle() { return { data: { role: state.role }, error: null }; } };
    assert.equal(table, "article_review_plans"); state.calls.push({ read: table });
    return { select() { return this; }, eq() { return this; }, order() { return this; }, async returns() { return { data: state.invalidList ? null : state.plan ? [state.plan] : [], error: state.error }; }, async maybeSingle() { return { data: state.plan, error: state.error }; } };
  },
  async rpc(name, input) {
    assert.equal(name, "save_article_review_plan"); assert.equal(state.role, "admin"); state.calls.push({ name, input });
    if (state.error) return { data: null, error: state.error };
    if (input.p_expected_id !== (state.plan?.id ?? null) || input.p_expected_version !== (state.plan?.version ?? null)) return { data: null, error: { code: "P0001" } };
    state.plan = input.p_intent === "clear" ? null : { id, blog_post_id: id, interval_months: input.p_interval_months, next_due_on: input.p_next_due_on, version: (state.plan?.version ?? 0) + 1, created_at: "2026-10-06T12:00:00Z", updated_at: "2026-10-06T12:00:00Z" };
    return { data: state.plan, error: null };
  },
};
const { refreshArticleReviewPlan, saveArticleReviewPlan } = await import("../lib/cms/blog/review-plans/actions.ts");
const { getArticleReviewPlan, listArticleReviewPlans } = await import("../lib/cms/blog/review-plans/queries.ts");
const initial = { status: "idle", message: null, values: { intervalMonths: "", nextDueOn: "" }, plan: null };
function form(plan = null, intent = "save") { const data = new FormData(); for (const [key, value] of Object.entries({ reviewPlanWorkflow: "1", intent, intervalMonths: "6", nextDueOn: "2026-10-06", expectedPlanId: plan?.id ?? "", expectedPlanVersion: String(plan?.version ?? "") })) data.set(key, value); return data; }

test("anonymous, expired-session, ordinary and SEO-only callers cannot start planning reads or mutations", async () => {
  for (const role of ["anonymous", "expired", "user", "seo_editor"]) {
    state.role = role; const calls = state.calls.length;
    await assert.rejects(saveArticleReviewPlan(id, initial, form()), /Fixture redirect \/auth/);
    await assert.rejects(getArticleReviewPlan(id), /Fixture redirect \/auth/);
    await assert.rejects(listArticleReviewPlans(), /Fixture redirect \/auth/);
    await assert.rejects(refreshArticleReviewPlan(id), /Fixture redirect \/auth/);
    assert.equal(state.calls.length, calls);
  }
  state.role = "admin";
});
test("missing legacy tokens and invalid dates fail before the caller's RPC", async () => {
  const calls = state.calls.length; const missing = form(); missing.delete("expectedPlanId");
  assert.equal((await saveArticleReviewPlan(id, initial, missing)).status, "error");
  const invalid = form(); invalid.set("nextDueOn", "2026-02-30"); assert.equal((await saveArticleReviewPlan(id, initial, invalid)).status, "error");
  assert.equal(state.calls.length, calls);
});
test("saved cadence uses only private RPC and admin refreshes, keeping article fields and dates untouched", async () => {
  const saved = await saveArticleReviewPlan(id, initial, form());
  assert.equal(saved.status, "success"); assert.equal(saved.plan.interval_months, 6);
  assert.deepEqual(state.paths, [`/admin/blog-posts/${id}`, "/admin/blog-posts"]);
  assert.deepEqual(article, before);
  assert.equal((await getArticleReviewPlan(id)).plan.next_due_on, "2026-10-06");
  assert.equal((await listArticleReviewPlans()).plans.length, 1);
  const conflict = await saveArticleReviewPlan(id, initial, form()); assert.equal(conflict.status, "error"); assert.match(conflict.message, /Reload and compare/);
});
test("unavailable schema fails visibly; confirmed saves survive refresh failure; explicit clear removes only planning", async () => {
  state.error = { code: "PGRST202" };
  const unavailable = await saveArticleReviewPlan(id, { ...initial, plan: state.plan }, form(state.plan)); assert.equal(unavailable.status, "error"); assert.match(unavailable.message, /migration/);
  assert.equal((await listArticleReviewPlans()).available, false);
  state.error = null; state.invalidList = true;
  assert.equal((await listArticleReviewPlans()).available, false);
  state.invalidList = false;
  assert.equal((await refreshArticleReviewPlan(id)).plan.id, id);
  state.error = null; state.refreshFails = true;
  const saved = await saveArticleReviewPlan(id, { ...initial, plan: state.plan }, form(state.plan)); assert.equal(saved.status, "success"); assert.match(saved.message, /Reload the article list/);
  state.refreshFails = false;
  const cleared = await saveArticleReviewPlan(id, saved, form(saved.plan, "clear")); assert.equal(cleared.status, "success"); assert.equal(cleared.plan, null); assert.deepEqual(cleared.values, initial.values); assert.deepEqual(article, before);
});
test("fixture guards prohibit transport and server creation, with no hosted calls", () => {
  for (const call of [() => fetch("https://never.fixture.test"), () => http.get("http://never.fixture.test"), () => https.get("https://never.fixture.test"), () => net.connect(1234), () => tls.connect(1234), () => net.createServer().listen(1234)]) assert.throws(call, /Network forbidden/);
});
