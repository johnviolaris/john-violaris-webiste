import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { initialReviewPlanEditor, londonCalendarDate, readReviewPlanSubmission, reviewPlanEditorReducer, reviewPlanStatus, reviewPlanTokenMatches, reviewPlanValues, validReviewDate } from "../lib/cms/blog/review-plans/schema.ts";

const plan = { id: "00000000-0000-4000-8000-000000003211", version: 1, interval_months: 6, next_due_on: "2026-10-06" };
function form() {
  const output = new FormData();
  for (const [key, value] of Object.entries({ reviewPlanWorkflow: "1", intent: "save", intervalMonths: "6", nextDueOn: "2026-10-06", expectedPlanId: "", expectedPlanVersion: "" })) output.set(key, value);
  return output;
}

test("review planning accepts exact finite calendar dates, including genuine leap days", () => {
  for (const date of ["1900-01-01", "2024-02-29", "2026-10-06", "9999-12-31"]) assert.equal(validReviewDate(date), true, date);
  for (const date of ["1900-02-29", "2026-02-29", "2026-04-31", "2026-00-01", "2026-01-00", "2026-13-01", "1899-12-31", "10000-01-01", "2026-1-01", "2026-10-06T00:00:00Z", "infinity", "", null, 2026]) assert.equal(validReviewDate(date), false, String(date));
});

test("a complete review-plan submission explicitly saves or clears, without default dates or cadence", () => {
  const save = readReviewPlanSubmission(form());
  assert.equal(save.ok, true); assert.equal(save.intervalMonths, 6); assert.equal(save.nextDueOn, "2026-10-06"); assert.equal(save.expectedId, null);
  assert.deepEqual(reviewPlanValues(null), { intervalMonths: "", nextDueOn: "" });
  assert.deepEqual(reviewPlanValues(plan), { intervalMonths: "6", nextDueOn: "2026-10-06" });
  const clear = form(); clear.set("intent", "clear"); clear.set("intervalMonths", ""); clear.set("nextDueOn", "");
  const cleared = readReviewPlanSubmission(clear); assert.equal(cleared.ok, true); assert.equal(cleared.intervalMonths, null); assert.equal(cleared.nextDueOn, null);
});

test("legacy or malformed review-plan forms fail closed rather than clearing or inventing a plan", () => {
  for (const key of ["reviewPlanWorkflow", "intent", "intervalMonths", "nextDueOn", "expectedPlanId", "expectedPlanVersion"]) { const input = form(); input.delete(key); assert.equal(readReviewPlanSubmission(input).ok, false, key); }
  for (const [key, value] of [["reviewPlanWorkflow", "0"], ["intent", "publish"], ["intervalMonths", "0"], ["intervalMonths", "37"], ["intervalMonths", "1.5"], ["intervalMonths", "1e1"], ["intervalMonths", ""], ["nextDueOn", "2026-02-30"], ["expectedPlanId", "bad-uuid"], ["expectedPlanVersion", "1"]]) { const input = form(); input.set(key, value); assert.equal(readReviewPlanSubmission(input).ok, false, `${key}:${value}`); }
  const file = form(); file.set("nextDueOn", new Blob(["2026-10-06"]), "date.txt"); assert.equal(readReviewPlanSubmission(file).ok, false);
});

test("review-plan identity and generation travel together and detect delete/recreate ABA", () => {
  const input = form(); input.set("expectedPlanId", plan.id); input.set("expectedPlanVersion", "1");
  const saved = readReviewPlanSubmission(input); assert.equal(saved.ok, true); assert.equal(saved.expectedId, plan.id); assert.equal(saved.expectedVersion, 1);
  for (const value of ["0", "-1", "1.5", "9007199254740993"]) { input.set("expectedPlanVersion", value); assert.equal(readReviewPlanSubmission(input).ok, false, value); }
  assert.equal(reviewPlanTokenMatches(null, null), true);
  assert.equal(reviewPlanTokenMatches(plan, { ...plan }), true);
  assert.equal(reviewPlanTokenMatches(plan, { ...plan, version: 2 }), false);
  assert.equal(reviewPlanTokenMatches(plan, { ...plan, id: "00000000-0000-4000-8000-000000003212" }), false);
  assert.equal(reviewPlanTokenMatches(plan, null), false);
});

test("due and upcoming statuses use the UK calendar through midnight and daylight-saving transitions", () => {
  assert.equal(londonCalendarDate(new Date("2026-06-30T22:59:59Z")), "2026-06-30");
  assert.equal(londonCalendarDate(new Date("2026-06-30T23:00:00Z")), "2026-07-01");
  assert.equal(londonCalendarDate(new Date("2026-12-31T23:30:00Z")), "2026-12-31");
  for (const instant of ["2026-10-25T00:30:00Z", "2026-10-25T01:30:00Z"]) assert.equal(londonCalendarDate(new Date(instant)), "2026-10-25");
  assert.equal(reviewPlanStatus(null, "2026-10-06"), "unplanned");
  assert.equal(reviewPlanStatus(plan, "2026-10-05"), "upcoming");
  assert.equal(reviewPlanStatus(plan, "2026-10-06"), "due");
  assert.equal(reviewPlanStatus(plan, "2026-10-07"), "overdue");
});

test("external plan changes preserve recorded fields/tokens until deliberate isolated adoption", () => {
  let state = initialReviewPlanEditor(plan);
  state = reviewPlanEditorReducer(state, { type: "edit", field: "intervalMonths", value: "12" });
  state = reviewPlanEditorReducer(state, { type: "edit", field: "nextDueOn", value: "2027-01-01" });
  const newer = { ...plan, version: 2, interval_months: 3, next_due_on: "2026-11-01" };
  const conflicted = reviewPlanEditorReducer(state, { type: "server", plan: newer });
  assert.equal(conflicted.conflict, true); assert.deepEqual(conflicted.values, state.values); assert.equal(conflicted.plan, plan); assert.equal(conflicted.editKey, state.editKey);
  const adopted = reviewPlanEditorReducer(conflicted, { type: "adopt", plan: newer, serverPlan: newer });
  assert.equal(adopted.conflict, false); assert.equal(adopted.plan, newer); assert.deepEqual(adopted.values, { intervalMonths: "3", nextDueOn: "2026-11-01" }); assert.equal(adopted.editKey, state.editKey + 1);
  const removed = reviewPlanEditorReducer(adopted, { type: "server", plan: null }); assert.equal(removed.conflict, true); assert.equal(removed.plan, newer);
  const clear = reviewPlanEditorReducer(removed, { type: "adopt", plan: null, serverPlan: null }); assert.equal(clear.plan, null); assert.deepEqual(clear.values, reviewPlanValues(null));
  const recreated = { ...plan, id: "00000000-0000-4000-8000-000000003212" }; assert.equal(reviewPlanEditorReducer(clear, { type: "server", plan: recreated }).conflict, true);
});

test("controlled review fields retain typed values and recorded tokens after resolved save errors and external refresh", () => {
  let edited = initialReviewPlanEditor(plan);
  edited = reviewPlanEditorReducer(edited, { type: "edit", field: "intervalMonths", value: "12" });
  edited = reviewPlanEditorReducer(edited, { type: "edit", field: "nextDueOn", value: "2027-01-02" });
  // A resolving error may carry stale/default echoed fields. It must not reset
  // the controlled editor or adopt an unseen identity/version.
  const failed = reviewPlanEditorReducer(edited, { type: "saved", result: { status: "error", message: "Save failed", values: reviewPlanValues(null), plan: null } });
  assert.deepEqual(failed.values, { intervalMonths: "12", nextDueOn: "2027-01-02" });
  assert.equal(failed.plan, plan); assert.equal(failed.editKey, edited.editKey);
  const external = { ...plan, version: 2, interval_months: 3, next_due_on: "2026-12-01" };
  const conflict = reviewPlanEditorReducer(failed, { type: "server", plan: external });
  assert.deepEqual(conflict.values, failed.values); assert.equal(conflict.plan, plan); assert.equal(conflict.conflict, true);
  const retryFailure = reviewPlanEditorReducer(conflict, { type: "saved", result: { status: "error", message: "Stale plan", values: reviewPlanValues(external), plan: external } });
  assert.deepEqual(retryFailure.values, failed.values); assert.equal(retryFailure.plan, plan); assert.equal(retryFailure.conflict, true);
  const adopted = reviewPlanEditorReducer(retryFailure, { type: "adopt", plan: external, serverPlan: external });
  assert.deepEqual(adopted.values, reviewPlanValues(external)); assert.equal(adopted.plan, external); assert.equal(adopted.conflict, false);
});

test("own confirmed saves and delayed server refresh avoid false conflicts; failed loads never erase fields", () => {
  const initial = initialReviewPlanEditor(null);
  const saved = reviewPlanEditorReducer(initial, { type: "saved", result: { status: "success", message: "Saved", values: reviewPlanValues(plan), plan } });
  assert.equal(reviewPlanEditorReducer(saved, { type: "server", plan: null }).conflict, false);
  const refreshed = reviewPlanEditorReducer(saved, { type: "server", plan }); assert.equal(refreshed.conflict, false);
  const propsFirst = reviewPlanEditorReducer(initial, { type: "server", plan });
  assert.equal(reviewPlanEditorReducer(propsFirst, { type: "saved", result: { status: "success", message: "Saved", values: reviewPlanValues(plan), plan } }).conflict, false);
  assert.equal(reviewPlanEditorReducer(refreshed, { type: "server", plan: null }).conflict, true);
  const adopted = reviewPlanEditorReducer(initial, { type: "adopt", plan, serverPlan: null });
  assert.equal(reviewPlanEditorReducer(adopted, { type: "server", plan: null }).conflict, false);
  const failed = reviewPlanEditorReducer(adopted, { type: "refresh-error", message: "Unavailable" }); assert.equal(failed.plan, plan); assert.deepEqual(failed.values, adopted.values); assert.equal(failed.editKey, adopted.editKey);
});

test("actual review-plan actions and reads independently enforce auth and preserve content in network-free module fixtures", () => {
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const output = execFileSync(process.execPath, ["--import", "./scripts/alias-hook.mjs", "--test", "scripts/verify-article-review-plans.mjs"], { encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"] });
  assert.match(output, /pass 5/); assert.match(output, /fail 0/);
});
