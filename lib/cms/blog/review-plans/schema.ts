export type ArticleReviewPlan = {
  id: string;
  blog_post_id: string;
  interval_months: number;
  next_due_on: string;
  version: number;
  created_at: string;
  updated_at: string;
};
export type ReviewPlanValues = { intervalMonths: string; nextDueOn: string };
export type ReviewPlanState = {
  status: "idle" | "success" | "error";
  message: string | null;
  values: ReviewPlanValues;
  plan: ArticleReviewPlan | null;
};
export const reviewPlansUnavailable = "Review planning is unavailable. Apply the private article review-plan migration and reload before saving.";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isReviewPlanId = (value: unknown): value is string => typeof value === "string" && uuid.test(value);

export function validReviewDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1900 || year > 9999) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

export function reviewPlanValues(plan: ArticleReviewPlan | null): ReviewPlanValues {
  return { intervalMonths: plan ? String(plan.interval_months) : "", nextDueOn: plan?.next_due_on ?? "" };
}

export function readReviewPlanSubmission(form: FormData) {
  const fields = ["reviewPlanWorkflow", "intent", "intervalMonths", "nextDueOn", "expectedPlanId", "expectedPlanVersion"] as const;
  const raw = Object.fromEntries(fields.map((field) => [field, form.get(field)]));
  const values = {
    intervalMonths: typeof raw.intervalMonths === "string" ? raw.intervalMonths.trim() : "",
    nextDueOn: typeof raw.nextDueOn === "string" ? raw.nextDueOn.trim() : "",
  };
  const failure = (error: string) => ({ ok: false as const, error, values });
  if (fields.some((field) => typeof raw[field] !== "string") || raw.reviewPlanWorkflow !== "1") {
    return failure("This review-plan form is incomplete. Reload the article before saving.");
  }
  if (raw.intent !== "save" && raw.intent !== "clear") return failure("Choose Save review plan or Clear review plan.");
  const expectedId = raw.expectedPlanId === "" ? null : raw.expectedPlanId;
  const expectedVersion = raw.expectedPlanVersion === "" ? null : Number(raw.expectedPlanVersion);
  if ((expectedId === null) !== (expectedVersion === null)
      || (expectedId !== null && !isReviewPlanId(expectedId))
      || (expectedVersion !== null && (!/^\d+$/.test(String(raw.expectedPlanVersion)) || !Number.isSafeInteger(expectedVersion) || expectedVersion < 1))) {
    return failure("This review-plan version is invalid. Reload the article before saving.");
  }
  const intervalMonths = Number(values.intervalMonths);
  if (raw.intent === "save" && (!/^\d+$/.test(values.intervalMonths) || !Number.isInteger(intervalMonths) || intervalMonths < 1 || intervalMonths > 36 || !validReviewDate(values.nextDueOn))) {
    return failure("Choose an interval from 1 to 36 months and a valid calendar date (1900–9999).");
  }
  return { ok: true as const, intent: raw.intent as "save" | "clear", values, expectedId: expectedId as string | null, expectedVersion, intervalMonths: raw.intent === "save" ? intervalMonths : null, nextDueOn: raw.intent === "save" ? values.nextDueOn : null };
}

export function reviewPlanTokenMatches(a: Pick<ArticleReviewPlan, "id" | "version"> | null, b: Pick<ArticleReviewPlan, "id" | "version"> | null) {
  return (a?.id ?? null) === (b?.id ?? null) && (a?.version ?? null) === (b?.version ?? null);
}

export type ReviewPlanEditorState = ReviewPlanState & {
  observedServerPlan: ArticleReviewPlan | null;
  conflict: boolean;
  editKey: number;
};
export function initialReviewPlanEditor(plan: ArticleReviewPlan | null): ReviewPlanEditorState {
  return { status: "idle", message: null, values: reviewPlanValues(plan), plan, observedServerPlan: plan, conflict: false, editKey: 0 };
}
export function reviewPlanEditorReducer(state: ReviewPlanEditorState, event:
  | { type: "server"; plan: ArticleReviewPlan | null }
  | { type: "edit"; field: keyof ReviewPlanValues; value: string }
  | { type: "saved"; result: ReviewPlanState }
  | { type: "adopt"; plan: ArticleReviewPlan | null; serverPlan: ArticleReviewPlan | null }
  | { type: "refresh-error"; message: string }
): ReviewPlanEditorState {
  if (event.type === "edit") return { ...state, values: { ...state.values, [event.field]: event.value } };
  if (event.type === "server") {
    if (reviewPlanTokenMatches(state.plan, event.plan)) return { ...state, observedServerPlan: event.plan, conflict: false };
    if (reviewPlanTokenMatches(state.observedServerPlan, event.plan)) return state;
    return { ...state, observedServerPlan: event.plan, conflict: true };
  }
  if (event.type === "saved") {
    // Application errors resolve the React form action too. Keep controlled
    // fields and their recorded token; only a confirmed save adopts new data.
    if (event.result.status !== "success") return { ...state, status: event.result.status, message: event.result.message };
    return { ...state, ...event.result, conflict: false, editKey: state.editKey + 1 };
  }
  if (event.type === "adopt") return { ...initialReviewPlanEditor(event.plan), observedServerPlan: event.serverPlan, editKey: state.editKey + 1, message: "Current review plan loaded. Only the planning fields were replaced." };
  return { ...state, status: "error", message: event.message };
}

export function londonCalendarDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function reviewPlanStatus(plan: ArticleReviewPlan | null, today = londonCalendarDate()): "unplanned" | "overdue" | "due" | "upcoming" {
  if (!plan) return "unplanned";
  if (plan.next_due_on < today) return "overdue";
  return plan.next_due_on === today ? "due" : "upcoming";
}
